import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MercadoPagoWebhookPayload = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

function toPaymentStatus(mpStatus: string): "pendente" | "confirmado" | "cancelado" {
  if (mpStatus === "approved") return "confirmado";
  if (mpStatus === "cancelled" || mpStatus === "rejected" || mpStatus === "refunded" || mpStatus === "charged_back") {
    return "cancelado";
  }
  return "pendente";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRole) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados");
    const sb = createClient(supabaseUrl, serviceRole);

    // Prioritize DB key over env var
    const { data: secureCfg } = await sb
      .from("secure_config")
      .select("valor")
      .eq("chave", "mp_access_token")
      .maybeSingle();
    
    const accessToken = secureCfg?.valor || Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
    if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado no painel nem no ENV");

    const payload = (await req.json().catch(() => ({}))) as MercadoPagoWebhookPayload;
    const paymentId = payload?.data?.id ? String(payload.data.id) : null;
    if (!paymentId) {
      // MP sometimes pings without data; ack to avoid retries storm.
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      throw new Error(mpJson?.message || "Falha ao validar pagamento no Mercado Pago");
    }

    const mpStatus = String(mpJson?.status || "");
    const status = toPaymentStatus(mpStatus);
    const externalReference = String(mpJson?.external_reference || "");
    const preferenceId = String(mpJson?.preference_id || "");

    if (!externalReference) {
      return new Response(JSON.stringify({ ok: true, ignored: true, reason: "missing_external_reference" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // external_reference = pagamento_id (preferred) OR inscricao_id (fallback) OR ingresso_vendido.id
    const { data: pagamento, error: payErr } = await sb
      .from("pagamentos")
      .select("id, inscricao_id, status")
      .or(`id.eq.${externalReference},inscricao_id.eq.${externalReference}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (payErr) throw payErr;

    if (!pagamento?.id) {
      // Try ticket purchase (group by pedido_ref or fallback to id)
      const { data: ingressos, error: ingErr } = await sb
        .from("ingressos_vendidos")
        .select("id, email, nome_comprador, quantidade, valor_total, status, tipo_ingresso_id")
        .or(`id.eq.${externalReference},pedido_ref.eq.${externalReference}`);

      if (ingErr) throw ingErr;

      if (!ingressos || ingressos.length === 0) {
        return new Response(JSON.stringify({ ok: true, ignored: true, reason: "payment_not_found" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const newStatus = status === "confirmado" ? "confirmado" : status === "cancelado" ? "cancelado" : "pendente";

      for (const ingresso of ingressos) {
        // Idempotency: if already confirmed, skip email
        const isAlreadyConfirmed = ingresso.status === "confirmado";
        
        await sb
          .from("ingressos_vendidos")
          .update({ status: newStatus, preference_id: preferenceId || null, metodo_pagamento: "cartao" })
          .eq("id", ingresso.id);

        if (newStatus === "confirmado" && !isAlreadyConfirmed) {
          const { data: tipo } = await sb.from("tipos_ingresso").select("nome").eq("id", ingresso.tipo_ingresso_id).maybeSingle();
          await fetch(`${supabaseUrl}/functions/v1/send-ticket`, {
            method: "POST",
            headers: { Authorization: `Bearer ${serviceRole}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              email: ingresso.email,
              nome_comprador: ingresso.nome_comprador,
              quantidade: ingresso.quantidade,
              tipo_ingresso_nome: String((tipo as any)?.nome || "Ingresso FADDA"),
              ingresso_id: ingresso.id,
              valor_total: ingresso.valor_total,
            }),
          }).catch(console.error);
        }
      }

      return new Response(JSON.stringify({ ok: true, ticket: true, affected: ingressos.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if already confirmado, just ack.
    if (pagamento.status === "confirmado" && status === "confirmado") {
      return new Response(JSON.stringify({ ok: true, already_confirmed: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sb
      .from("pagamentos")
      .update({ status, preference_id: preferenceId || null })
      .eq("id", pagamento.id);

    if (status === "confirmado" && pagamento.inscricao_id) {
      await sb.from("inscricoes").update({ status: "confirmado" }).eq("id", pagamento.inscricao_id);

      const { data: insc } = await sb
        .from("inscricoes")
        .select("tipo_inscricao, modalidade, nome_coreografia, valor_final, profiles:profiles!inscricoes_user_id_fkey(nome,email)")
        .eq("id", pagamento.inscricao_id)
        .maybeSingle();

      const email = (insc as any)?.profiles?.email as string | undefined;
      const nome = (insc as any)?.profiles?.nome as string | undefined;

      if (email) {
        // Call send-inscricao-confirmation (keeps template logic centralized)
        await fetch(`${supabaseUrl}/functions/v1/send-inscricao-confirmation`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRole}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            nome: nome || "Participante",
            tipo_inscricao: (insc as any)?.tipo_inscricao,
            modalidade: (insc as any)?.modalidade,
            nome_coreografia: (insc as any)?.nome_coreografia,
            valor_final: (insc as any)?.valor_final,
          }),
        }).catch(() => {});
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

