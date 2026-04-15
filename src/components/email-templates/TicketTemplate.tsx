import * as React from 'react';

interface TicketEmailProps {
  nome: string;
  ingresso: string;
  quantidade: number;
  valorTotal: number;
  qrCodeUrl: string;
}

export const TicketEmail = ({
  nome,
  ingresso,
  quantidade,
  valorTotal,
  qrCodeUrl,
}: TicketEmailProps) => {
  const containerStyle = {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
    borderRadius: '16px',
    border: '1px solid #d4af37',
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '40px',
  };

  const titleStyle = {
    color: '#d4af37',
    fontSize: '32px',
    margin: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '4px',
    fontWeight: 'bold',
  };

  const subtitleStyle = {
    color: '#888888',
    margin: '8px 0',
    fontSize: '14px',
    letterSpacing: '1px',
  };

  const bodyStyle = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#dddddd',
  };

  const highlightStyle = {
    color: '#d4af37',
    fontWeight: 'bold',
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
    border: '1px solid #333333',
    padding: '30px',
    margin: '30px 0',
    borderRadius: '12px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '10px',
  };

  const tdLabelStyle = {
    padding: '8px 0',
    color: '#888888',
    fontSize: '14px',
  };

  const tdValueStyle = {
    padding: '8px 0',
    textAlign: 'right' as const,
    fontWeight: 'bold',
    color: '#ffffff',
  };

  const qrSectionStyle = {
    textAlign: 'center' as const,
    margin: '40px 0',
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  };

  const qrTitleStyle = {
    color: '#000000',
    marginBottom: '10px',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase' as const,
  };

  const footerStyle = {
    textAlign: 'center' as const,
    color: '#666666',
    fontSize: '12px',
    marginTop: '40px',
    borderTop: '1px solid #222222',
    paddingTop: '20px',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>F.A.D.D.A</h1>
        <p style={subtitleStyle}>9º Festival Araraquarense de Danças Árabes</p>
      </div>

      <div style={bodyStyle}>
        <p>Olá, <span style={highlightStyle}>{nome}</span>!</p>
        <p>
          Sua participação no maior evento de dança árabe da região está confirmada. 
          Estamos ansiosos para vê-lo brilhar no palco!
        </p>
      </div>

      <div style={cardStyle}>
        <h2 style={{ ...highlightStyle, fontSize: '18px', margin: '0 0 15px 0', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
          Detalhes da Inscrição
        </h2>
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={tdLabelStyle}>Participante:</td>
              <td style={tdValueStyle}>{nome}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Ingresso:</td>
              <td style={tdValueStyle}>{ingresso}</td>
            </tr>
            <tr>
              <td style={tdLabelStyle}>Quantidade:</td>
              <td style={tdValueStyle}>{quantidade}</td>
            </tr>
            <tr>
              <td style={{ ...tdLabelStyle, borderTop: '1px solid #222', paddingTop: '15px' }}>Total Pago:</td>
              <td style={{ ...tdValueStyle, borderTop: '1px solid #222', paddingTop: '15px', color: '#d4af37', fontSize: '20px' }}>
                R$ {valorTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={qrSectionStyle}>
        <p style={qrTitleStyle}>Seu Voucher Digital</p>
        <img 
          src={qrCodeUrl} 
          alt="QR Code Ticket" 
          width="200" 
          height="200" 
          style={{ display: 'block', margin: '0 auto' }} 
        />
        <p style={{ color: '#888', fontSize: '11px', marginTop: '15px', marginBottom: 0 }}>
          Apresente este código no credenciamento do evento.<br/>
          Pode ser lido diretamente do seu celular.
        </p>
      </div>

      <div style={footerStyle}>
        <p><strong>9º F.A.D.D.A - 2026</strong><br />Araraquara, São Paulo</p>
        <p style={{ marginTop: '10px' }}>Este é um e-mail automático. Por favor, não responda.</p>
      </div>
    </div>
  );
};
