// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketRequest {
  email: string;
  nome_comprador: string;
  quantidade: number;
  tipo_ingresso_nome: string;
  ingresso_id: string;
  valor_total: number;
}

const defaultTemplate = {
  titulo_email: 'F.A.D.D.A',
  subtitulo_email: 'Festival Araraquarense de Danças Árabes',
  mensagem_confirmacao: 'Seu pagamento foi confirmado com sucesso. Prepare-se para uma experiência inesquecível no mundo da dança árabe!',
  titulo_detalhes: 'Detalhes do Pedido',
  titulo_voucher: 'Seu Voucher de Acesso',
  instrucao_voucher: 'Apresente este código na recepção do evento',
  rodape_evento: '9º F.A.D.D.A - 2026',
  rodape_local: 'Araraquara, São Paulo',
  cor_primaria: '#d4af37',
  cor_fundo: '#000000',
  cor_texto: '#ffffff',
  cor_subtexto: '#888888',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ticketReq: TicketRequest = await req.json();

    if (!ticketReq.email || !ticketReq.ingresso_id || !ticketReq.nome_comprador) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes: email, ingresso_id, nome_comprador" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load dynamic template config
    let tpl = { ...defaultTemplate };
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const sb = createClient(supabaseUrl, supabaseKey);
      const { data } = await sb.from('site_config').select('valor').eq('chave', 'email_template_ingresso').single();
      if (data?.valor && typeof data.valor === 'object') {
        tpl = { ...defaultTemplate, ...data.valor };
      }
    } catch (_) { /* use defaults */ }

    const encodedId = btoa(encodeURIComponent(ticketReq.ingresso_id));
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedId}`;
    const valorFormatado = Number(ticketReq.valor_total).toFixed(2).replace(".", ",");

    const htmlContent = `
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

        <div style="text-align: center; margin: 40px 0; background-color: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
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

    const { data, error } = await resend.emails.send({
      from: "FADDA <onboarding@resend.dev>",
      to: [ticketReq.email],
      subject: `🎉 Seu ingresso para o ${tpl.rodape_evento} está aqui!`,
      html: htmlContent,
    });

    if (error) {
      console.error("Erro na Resend:", error);
      throw new Error(`Erro ao enviar email: ${error.message}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
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
