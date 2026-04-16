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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || "";
    if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    const payload = (await req.json()) as CreateMpCheckoutRequest;
    if (!payload?.email || !payload?.nome) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email e nome" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const siteUrl =
      Deno.env.get("SITE_URL") ||
      Deno.env.get("PUBLIC_SITE_URL") ||
      "http://localhost:5173";

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
      payer: { name: payload.nome, email: payload.email },
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
    if (!preferenceId || !initPoint) throw new Error("Resposta do Mercado Pago incompleta (id/init_point)");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (supabaseUrl && supabaseKey && payload.pagamento_id) {
      const sb = createClient(supabaseUrl, supabaseKey);
      await sb.from("pagamentos").update({ preference_id: preferenceId }).eq("id", payload.pagamento_id);
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

