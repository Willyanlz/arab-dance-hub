import * as React from 'react';

export interface InscricaoTemplateConfig {
  titulo_email: string;
  subtitulo_email: string;
  mensagem_confirmacao: string;
  titulo_detalhes: string;
  rodape_evento: string;
  rodape_local: string;
  cor_primaria: string;
  cor_fundo: string;
  cor_texto: string;
  cor_subtexto: string;
}

export const defaultInscricaoTemplate: InscricaoTemplateConfig = {
  titulo_email: 'F.A.D.D.A',
  subtitulo_email: 'Festival Araraquarense de Danças Árabes',
  mensagem_confirmacao:
    'Seu pagamento foi confirmado e sua inscrição está validada. Nos vemos no festival!',
  titulo_detalhes: 'Resumo da Inscrição',
  rodape_evento: '9º F.A.D.D.A - 2026',
  rodape_local: 'Araraquara, São Paulo',
  cor_primaria: '#d4af37',
  cor_fundo: '#000000',
  cor_texto: '#ffffff',
  cor_subtexto: '#888888',
};

interface InscricaoEmailProps {
  nome: string;
  tipoInscricao: string;
  modalidade: string;
  nomeCoreografia: string;
  valorTotal: number;
  config?: InscricaoTemplateConfig;
}

export const InscricaoEmail = ({
  nome,
  tipoInscricao,
  modalidade,
  nomeCoreografia,
  valorTotal,
  config = defaultInscricaoTemplate,
}: InscricaoEmailProps) => {
  const c = config;

  return (
    <div
      style={{
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        backgroundColor: c.cor_fundo,
        color: c.cor_texto,
        padding: '40px 20px',
        maxWidth: '600px',
        margin: '0 auto',
        borderRadius: '16px',
        border: `1px solid ${c.cor_primaria}`,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1
          style={{
            color: c.cor_primaria,
            fontSize: '30px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          {c.titulo_email}
        </h1>
        <p style={{ color: c.cor_subtexto, margin: '8px 0', fontSize: '14px' }}>
          {c.subtitulo_email}
        </p>
      </div>

      <p style={{ fontSize: '16px', lineHeight: 1.6 }}>
        Ola, <strong style={{ color: c.cor_primaria }}>{nome}</strong>!
      </p>
      <p style={{ color: '#dddddd', fontSize: '15px', lineHeight: 1.6 }}>{c.mensagem_confirmacao}</p>

      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          border: '1px solid #333333',
          padding: '26px',
          margin: '30px 0',
          borderRadius: '12px',
        }}
      >
        <h2
          style={{
            color: c.cor_primaria,
            fontSize: '18px',
            margin: '0 0 14px 0',
            borderBottom: '1px solid #222',
            paddingBottom: '10px',
          }}
        >
          {c.titulo_detalhes}
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto }}>Tipo:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{tipoInscricao}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto }}>Modalidade:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{modalidade}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: c.cor_subtexto }}>Coreografia:</td>
              <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold' }}>{nomeCoreografia || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '12px 0 8px 0', color: c.cor_subtexto, borderTop: '1px solid #222' }}>
                Valor Confirmado:
              </td>
              <td
                style={{
                  padding: '12px 0 8px 0',
                  textAlign: 'right',
                  color: c.cor_primaria,
                  fontWeight: 'bold',
                  fontSize: '18px',
                  borderTop: '1px solid #222',
                }}
              >
                R$ {Number(valorTotal || 0).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', color: '#666666', fontSize: '12px', marginTop: '30px' }}>
        <p>
          <strong>{c.rodape_evento}</strong>
          <br />
          {c.rodape_local}
        </p>
      </div>
    </div>
  );
};
