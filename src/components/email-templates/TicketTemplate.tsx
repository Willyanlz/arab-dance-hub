import * as React from 'react';

export interface TicketTemplateConfig {
  titulo_email: string;
  subtitulo_email: string;
  mensagem_confirmacao: string;
  titulo_detalhes: string;
  titulo_voucher: string;
  instrucao_voucher: string;
  rodape_evento: string;
  rodape_local: string;
  cor_primaria: string;
  cor_fundo: string;
  cor_texto: string;
  cor_subtexto: string;
}

export const defaultTicketTemplate: TicketTemplateConfig = {
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

interface TicketEmailProps {
  nome: string;
  ingresso: string;
  quantidade: number;
  valorTotal: number;
  qrCodeUrl: string;
  config?: TicketTemplateConfig;
}

export const TicketEmail = ({
  nome,
  ingresso,
  quantidade,
  valorTotal,
  qrCodeUrl,
  config = defaultTicketTemplate,
}: TicketEmailProps) => {
  const c = config;

  return (
    <div style={{
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      backgroundColor: c.cor_fundo,
      color: c.cor_texto,
      padding: '40px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      borderRadius: '16px',
      border: `1px solid ${c.cor_primaria}`,
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: c.cor_primaria, fontSize: '32px', margin: '0', textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'bold' }}>
          {c.titulo_email}
        </h1>
        <p style={{ color: c.cor_subtexto, margin: '8px 0', fontSize: '14px', letterSpacing: '1px' }}>
          {c.subtitulo_email}
        </p>
      </div>

      <div style={{ fontSize: '16px', lineHeight: '1.6', color: '#dddddd' }}>
        <p>Olá, <span style={{ color: c.cor_primaria, fontWeight: 'bold' }}>{nome}</span>!</p>
        <p>{c.mensagem_confirmacao}</p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        border: '1px solid #333333',
        padding: '30px',
        margin: '30px 0',
        borderRadius: '12px',
      }}>
        <h2 style={{ color: c.cor_primaria, fontSize: '18px', margin: '0 0 15px 0', borderBottom: '1px solid #222', paddingBottom: '10px', fontWeight: 'bold' }}>
          {c.titulo_detalhes}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto, fontSize: '14px' }}>Ingresso:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: c.cor_texto }}>{ingresso}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto, fontSize: '14px' }}>Quantidade:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: c.cor_texto }}>{quantidade}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto, fontSize: '14px', borderTop: '1px solid #222', paddingTop: '15px' }}>Total Pago:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: c.cor_primaria, fontSize: '20px', borderTop: '1px solid #222', paddingTop: '15px' }}>
                R$ {valorTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', margin: '40px 0', backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <p style={{ color: '#000000', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase' }}>
          {c.titulo_voucher}
        </p>
        <img src={qrCodeUrl} alt="QR Code Ticket" width="200" height="200" style={{ display: 'block', margin: '0 auto' }} />
        <p style={{ color: '#888', fontSize: '11px', marginTop: '15px', marginBottom: 0 }}>
          {c.instrucao_voucher}
        </p>
      </div>

      <div style={{ textAlign: 'center', color: '#666666', fontSize: '12px', marginTop: '40px', borderTop: '1px solid #222222', paddingTop: '20px' }}>
        <p><strong>{c.rodape_evento}</strong><br />{c.rodape_local}</p>
        <p style={{ marginTop: '10px' }}>Este é um e-mail automático. Por favor, não responda.</p>
      </div>
    </div>
  );
};
