import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type PendingPaymentRequest = {
  email: string;
  nome: string;
  contexto?: "inscricao" | "ingresso";
  descricao?: string;
  valor?: number;
  metodo?: "pix" | "dinheiro" | "cartao";
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const defaultTemplate = {
  titulo_email: "F.A.D.D.A",
  subtitulo_email: "Festival Araraquarense de Danças Árabes",
  mensagem_confirmacao:
    "Recebemos sua solicitação e seu pagamento está aguardando confirmação. Assim que for confirmado, enviaremos a confirmação/voucher por e-mail.",
  titulo_detalhes: "Resumo",
  rodape_evento: "9º F.A.D.D.A - 2026",
  rodape_local: "Araraquara, São Paulo",
  cor_primaria: "#d4af37",
  cor_fundo: "#000000",
  cor_texto: "#ffffff",
  cor_subtexto: "#888888",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const resendKey = Deno.env.get("RESEND_KEY") || "";
    if (!resendKey) throw new Error("RESEND_KEY não configurada");
    const resend = new Resend(resendKey);

    const payload = (await req.json()) as PendingPaymentRequest;
    if (!payload?.email || !payload?.nome) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email e nome" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let tpl: Record<string, unknown> = { ...defaultTemplate };
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (supabaseUrl && supabaseKey) {
      const sb = createClient(supabaseUrl, supabaseKey);

      const { data: templateData } = await sb
        .from("site_config")
        .select("valor")
        .eq("chave", "email_template_aguardando_pagamento")
        .maybeSingle();
      if (templateData?.valor && typeof templateData.valor === "object") {
        tpl = { ...defaultTemplate, ...(templateData.valor as Record<string, unknown>) };
      }

      const { data: eventData } = await sb
        .from("site_config")
        .select("chave,valor")
        .in("chave", ["evento_nome", "evento_subtitulo", "evento_edicao", "evento_local"]);
      const eventMap: Record<string, string> = {};
      (eventData || []).forEach((item: { chave: string; valor: unknown }) => {
        eventMap[item.chave] = String(item.valor || "").replace(/"/g, "");
      });
      if (eventMap.evento_nome) tpl.titulo_email = eventMap.evento_nome;
      if (eventMap.evento_subtitulo) tpl.subtitulo_email = eventMap.evento_subtitulo;
      if (eventMap.evento_edicao) tpl.rodape_evento = eventMap.evento_edicao;
      if (eventMap.evento_local) tpl.rodape_local = eventMap.evento_local;
    }

    const valor = Number(payload.valor || 0);
    const mensagem =
      String((tpl as any).mensagem_confirmacao || (tpl as any).mensagem || defaultTemplate.mensagem_confirmacao);
    const html = `
      <div style="font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;background:${tpl.cor_fundo};color:${tpl.cor_texto};padding:36px 20px;border-radius:12px;border:1px solid ${tpl.cor_primaria};">
        <div style="text-align:center;margin-bottom:28px;">
          <h1 style="margin:0;color:${tpl.cor_primaria};text-transform:uppercase;letter-spacing:2px;">${tpl.titulo_email}</h1>
          <p style="color:${tpl.cor_subtexto};margin:6px 0 0;">${tpl.subtitulo_email}</p>
        </div>
        <p>Olá, <strong style="color:${tpl.cor_primaria};">${payload.nome}</strong>!</p>
        <p style="color:#ddd;line-height:1.6">${mensagem}</p>
        <div style="background:#111;border:1px solid #333;border-radius:10px;padding:18px;margin-top:20px;">
          <h2 style="margin:0 0 10px;color:${tpl.cor_primaria};font-size:16px;">${tpl.titulo_detalhes}</h2>
          <p><strong>Contexto:</strong> ${payload.contexto || "-"}</p>
          <p><strong>Descrição:</strong> ${payload.descricao || "-"}</p>
          <p><strong>Método:</strong> ${payload.metodo || "-"}</p>
          <p><strong>Valor:</strong> R$ ${Number.isFinite(valor) ? valor.toFixed(2) : "0.00"}</p>
        </div>
        <div style="text-align:center;color:${tpl.cor_subtexto};font-size:12px;margin-top:26px;">
          <p><strong>${tpl.rodape_evento}</strong><br/>${tpl.rodape_local}</p>
        </div>
      </div>
    `;

    const subjectPrefix = payload.contexto === "ingresso" ? "Compra registrada" : "Inscrição registrada";
    const { error } = await resend.emails.send({
      from: "FADDA <onboarding@resend.dev>",
      to: [payload.email],
      subject: `${subjectPrefix} - aguardando pagamento`,
      html,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
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

