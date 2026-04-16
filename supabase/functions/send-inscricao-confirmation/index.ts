// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const defaultTemplate = {
  titulo_email: "F.A.D.D.A",
  subtitulo_email: "Festival Araraquarense de Danças Árabes",
  mensagem_confirmacao:
    "Seu pagamento foi confirmado e sua inscrição está validada. Nos vemos no festival!",
  titulo_detalhes: "Resumo da Inscrição",
  rodape_evento: "9º F.A.D.D.A - 2026",
  rodape_local: "Araraquara, São Paulo",
  cor_primaria: "#d4af37",
  cor_fundo: "#000000",
  cor_texto: "#ffffff",
  cor_subtexto: "#888888",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    if (!payload?.email || !payload?.nome) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes: email e nome" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let tpl = { ...defaultTemplate };
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const sb = createClient(supabaseUrl, supabaseKey);

    try {
      const { data: templateData } = await sb
        .from("site_config")
        .select("valor")
        .eq("chave", "email_template_inscricao")
        .single();
      if (templateData?.valor && typeof templateData.valor === "object") {
        tpl = { ...defaultTemplate, ...templateData.valor };
      }

      const { data: eventData } = await sb
        .from("site_config")
        .select("chave,valor")
        .in("chave", ["evento_nome", "evento_subtitulo", "evento_edicao", "evento_local"]);
      const eventMap: Record<string, string> = {};
      (eventData || []).forEach((item: any) => {
        eventMap[item.chave] = String(item.valor || "").replace(/"/g, "");
      });
      if (eventMap.evento_nome) tpl.titulo_email = eventMap.evento_nome;
      if (eventMap.evento_subtitulo) tpl.subtitulo_email = eventMap.evento_subtitulo;
      if (eventMap.evento_edicao) tpl.rodape_evento = eventMap.evento_edicao;
      if (eventMap.evento_local) tpl.rodape_local = eventMap.evento_local;
    } catch (_) {}

    const html = `
      <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:${tpl.cor_fundo};color:${tpl.cor_texto};padding:36px 20px;border-radius:12px;border:1px solid ${tpl.cor_primaria};">
        <div style="text-align:center;margin-bottom:28px;">
          <h1 style="margin:0;color:${tpl.cor_primaria};text-transform:uppercase;letter-spacing:2px;">${tpl.titulo_email}</h1>
          <p style="color:${tpl.cor_subtexto};margin:6px 0 0;">${tpl.subtitulo_email}</p>
        </div>
        <p>Olá, <strong style="color:${tpl.cor_primaria};">${payload.nome}</strong>!</p>
        <p style="color:#ddd;line-height:1.6">${tpl.mensagem_confirmacao}</p>
        <div style="background:#111;border:1px solid #333;border-radius:10px;padding:18px;margin-top:20px;">
          <h2 style="margin:0 0 10px;color:${tpl.cor_primaria};font-size:16px;">${tpl.titulo_detalhes}</h2>
          <p><strong>Tipo:</strong> ${payload.tipo_inscricao || "-"}</p>
          <p><strong>Modalidade:</strong> ${payload.modalidade || "-"}</p>
          <p><strong>Coreografia:</strong> ${payload.nome_coreografia || "-"}</p>
          <p><strong>Valor:</strong> R$ ${Number(payload.valor_final || 0).toFixed(2)}</p>
        </div>
        <div style="text-align:center;color:${tpl.cor_subtexto};font-size:12px;margin-top:26px;">
          <p><strong>${tpl.rodape_evento}</strong><br/>${tpl.rodape_local}</p>
        </div>
      </div>
    `;

    console.log('Email would be sent to:', payload.email);
    console.log('Subject:', `Inscrição confirmada - ${tpl.rodape_evento}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
