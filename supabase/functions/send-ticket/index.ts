import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const ticketReq: TicketRequest = await req.json();

    const encodedId = btoa(ticketReq.ingresso_id);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedId}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #fff; padding: 20px; border-radius: 10px;">
        <h1 style="color: #d4af37; text-align: center;">F.A.D.D.A - Seu Ingresso</h1>
        <p style="font-size: 16px;">Olá <strong>${ticketReq.nome_comprador}</strong>,</p>
        <p style="font-size: 16px;">Seu pagamento foi confirmado! Aqui estão os detalhes do seu ingresso:</p>
        
        <div style="background-color: #2a2a2a; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Ingresso:</strong> ${ticketReq.tipo_ingresso_nome}</p>
          <p style="margin: 5px 0;"><strong>Quantidade:</strong> ${ticketReq.quantidade}</p>
          <p style="margin: 5px 0;"><strong>Valor Total:</strong> R$ ${ticketReq.valor_total.toFixed(2)}</p>
        </div>

        <div style="text-align: center; margin-top: 30px; background-color: #fff; padding: 20px; border-radius: 10px; display: inline-block;">
          <p style="color: #000; margin-bottom: 10px; font-weight: bold;">Apresente este QR Code na portaria</p>
          <img src="${qrCodeUrl}" alt="QR Code Ingresso" width="250" height="250" />
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
          Este é um e-mail automático, por favor não responda.<br/>
          Em caso de dúvidas, entre em contato com a organização do evento.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "F.A.D.D.A <onboarding@resend.dev>", // TODO: Replace with the verified domain: ingressos@seudominio.com
        to: [ticketReq.email],
        subject: "Seu ingresso para o 9º F.A.D.D.A foi confirmado!",
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Erro na Resend:", errorData);
      throw new Error(`Erro ao enviar email: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
