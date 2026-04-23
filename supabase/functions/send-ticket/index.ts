// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendEmail } from "../_shared/mailer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const defaultTemplate = {
  titulo_email: "F.A.D.D.A",
  subtitulo_email: "Festival Araraquarense de Danças Árabes",
  mensagem_confirmacao: "Seu pagamento foi confirmado com sucesso. Prepare-se para uma experiência inesquecível no mundo da dança árabe!",
  titulo_detalhes: "Detalhes do Pedido",
  titulo_voucher: "Seu Voucher de Acesso",
  instrucao_voucher: "Apresente este código na recepção do evento",
  rodape_evento: "9º F.A.D.D.A - 2026",
  rodape_local: "Araraquara, São Paulo",
  cor_primaria: "#d4af37",
  cor_fundo: "#000000",
  cor_texto: "#ffffff",
  cor_subtexto: "#888888",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ticketReq = await req.json();
    if (!ticketReq.email || !ticketReq.ingresso_id || !ticketReq.nome_comprador) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes: email, ingresso_id, nome_comprador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let tpl = { ...defaultTemplate };
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from("site_config").select("valor").eq("chave", "email_template_ingresso").single();
      if (data?.valor && typeof data.valor === "object") {
        tpl = { ...defaultTemplate, ...data.valor };
      }
      const { data: eventConfig } = await sb
        .from("site_config")
        .select("chave,valor")
        .in("chave", ["evento_nome", "evento_subtitulo", "evento_edicao", "evento_local"]);
      const eventMap: Record<string, string> = {};
      (eventConfig || []).forEach((item: any) => {
        eventMap[item.chave] = String(item.valor || "").replace(/"/g, "");
      });
      if (eventMap.evento_nome) tpl.titulo_email = eventMap.evento_nome;
      if (eventMap.evento_subtitulo) tpl.subtitulo_email = eventMap.evento_subtitulo;
      if (eventMap.evento_edicao) tpl.rodape_evento = eventMap.evento_edicao;
      if (eventMap.evento_local) tpl.rodape_local = eventMap.evento_local;
    } catch (_) {}

    const encodedId = btoa(encodeURIComponent(ticketReq.ingresso_id));
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedId}`;
    const valorFormatado = Number(ticketReq.valor_total).toFixed(2).replace(".", ",");

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: ${tpl.cor_fundo}; color: ${tpl.cor_texto}; padding: 40px 20px; border-radius: 12px; border: 1px solid ${tpl.cor_primaria};">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${tpl.cor_primaria}; font-size: 28px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">${tpl.titulo_email}</h1>
          <p style="color: ${tpl.cor_subtexto}; margin: 5px 0;">${tpl.subtitulo_email}</p>
        </div>
        <p style="font-size: 18px; line-height: 1.6;">Olá, <span style="color: ${tpl.cor_primaria}; font-weight: bold;">${ticketReq.nome_comprador}</span>!</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">${tpl.mensagem_confirmacao}</p>
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border: 1px solid #333; padding: 25px; margin: 30px 0; border-radius: 8px;">
          <h2 style="color: ${tpl.cor_primaria}; font-size: 18px; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 10px;">${tpl.titulo_detalhes}</h2>
          <table style="width: 100%; color: ${tpl.cor_texto}; font-size: 14px;">
            <tr>
              <td style="padding: 5px 0; color: ${tpl.cor_subtexto};">Ingresso:</td>
              <td style="text-align: right; font-weight: bold;">${ticketReq.tipo_ingresso_nome}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: ${tpl.cor_subtexto};">Quantidade:</td>
              <td style="text-align: right; font-weight: bold;">${ticketReq.quantidade}</td>
            </tr>
            <tr>
              <td style="padding: 15px 0 5px 0; color: ${tpl.cor_subtexto}; border-top: 1px solid #333; font-size: 16px;">VALOR TOTAL:</td>
              <td style="text-align: right; font-weight: bold; color: ${tpl.cor_primaria}; border-top: 1px solid #333; font-size: 18px;">R$ ${valorFormatado}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin: 40px 0; background-color: #fff; padding: 30px; border-radius: 12px;">
          <p style="color: #000; margin-bottom: 15px; font-weight: bold; font-size: 16px; text-transform: uppercase;">${tpl.titulo_voucher}</p>
          <img src="${qrCodeUrl}" alt="QR Code Ingresso" width="220" height="220" style="display: block; margin: 0 auto;" />
          <p style="color: #666; font-size: 12px; margin-top: 15px;">${tpl.instrucao_voucher}</p>
        </div>
        <div style="text-align: center; color: ${tpl.cor_subtexto}; font-size: 12px; margin-top: 40px; border-top: 1px solid #333; padding-top: 20px;">
          <p>${tpl.rodape_evento}<br/>${tpl.rodape_local}</p>
          <p style="margin-top: 10px;">Este é um e-mail automático. Por favor, não responda.</p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: ticketReq.email,
      subject: `🎉 Seu ingresso para o ${tpl.rodape_evento} está aqui!`,
      html,
    });

    if (!result.sent && result.error && result.error !== "no_provider_configured") {
      throw new Error(`Falha ao enviar email (${result.provider}): ${result.error}`);
    }

    return new Response(JSON.stringify({ success: true, provider: result.provider }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
