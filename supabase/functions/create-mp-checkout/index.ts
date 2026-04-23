// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type CreateMpCheckoutRequest = {
  inscricao_id?: string;
  pagamento_id?: string;
  external_reference?: string;
  valor: number;
  descricao: string;
  email: string;
  nome: string;
  back_urls?: { success?: string; pending?: string; failure?: string };
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Get MP Access Token: secure_config DB first, then env var fallback */
async function getMpAccessToken(sb: any): Promise<string> {
  const { data } = await sb
    .from("secure_config")
    .select("valor")
    .eq("chave", "mp_access_token")
    .maybeSingle();
  
  if (data?.valor) return data.valor;

  // Fallback to env var if DB is empty
  return Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const sb = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getMpAccessToken(sb);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Mercado Pago não configurado. Configure a chave de acesso no painel de integrações." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = (await req.json()) as CreateMpCheckoutRequest;
    if (!payload?.email || !payload?.nome) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: email e nome" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      Deno.env.get("PUBLIC_SITE_URL") ||
      "https://fadda-festival.vercel.app";

    const externalReference =
      payload.external_reference || payload.pagamento_id || payload.inscricao_id || "";
    if (!externalReference) throw new Error("external_reference não informado");

    const prefBody = {
      items: [
        {
          title: payload.descricao || "Pagamento",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(payload.valor || 0),
        },
      ],
      payer: {
        name: payload.nome,
        email: payload.email,
      },
      external_reference: externalReference,
      back_urls: {
        success: payload.back_urls?.success || `${siteUrl}/dashboard?mp=success`,
        pending: payload.back_urls?.pending || `${siteUrl}/dashboard?mp=pending`,
        failure: payload.back_urls?.failure || `${siteUrl}/dashboard?mp=failure`,
      },
      auto_return: "approved",
      payment_methods: {
        installments: 10,
        default_installments: 1,
      },
      statement_descriptor: "FADDA",
      binary_mode: false,
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(prefBody),
    });

    const mpJson = await mpRes.json();
    if (!mpRes.ok) {
      throw new Error(mpJson?.message || "Erro ao criar preferência no Mercado Pago");
    }

    const preferenceId = String(mpJson?.id || "");
    const initPoint = String(mpJson?.init_point || "");
    if (!preferenceId || !initPoint) {
      throw new Error("Resposta do Mercado Pago incompleta (id/init_point)");
    }

    if (supabaseUrl && supabaseKey && payload.pagamento_id) {
      await sb.from("pagamentos").update({ preference_id: preferenceId }).eq("id", payload.pagamento_id);
    }

    // NEW: Send "Aguardando Pagamento" email immediately
    if (payload.email) {
      const contexto = payload.inscricao_id ? "inscricao" : "ingresso";
      const descricao = payload.descricao || (contexto === "inscricao" ? "Sua Inscrição" : "Seus Ingressos");
      
      await fetch(`${supabaseUrl}/functions/v1/send-pending-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          nome: payload.nome || "Participante",
          contexto,
          descricao,
          valor: payload.valor,
          metodo: "cartao",
        }),
      }).catch((e) => console.error("[create-mp-checkout] Error sending pending email:", e.message));
    }

    return new Response(JSON.stringify({ preference_id: preferenceId, init_point: initPoint }), {
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
