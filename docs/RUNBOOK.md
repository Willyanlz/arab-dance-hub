## Guia de integração / deploy (Supabase + Vite)

### 1) Pré-requisitos
- Node.js (LTS)
- Supabase CLI (`npm i -g supabase`)
- Projeto Supabase (URL + keys)

### 2) Variáveis de ambiente (Frontend)
Crie um arquivo `.env` na raiz (não commitar):

```env
VITE_SUPABASE_URL="https://<project-ref>.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon-key>"
```

### 3) Variáveis de ambiente (Supabase Edge Functions)
Configure no painel do Supabase (Project Settings → Functions → Secrets) ou via CLI.

- **Resend (envio de e-mail)**
  - `RESEND_KEY`

- **Mercado Pago (Checkout Pro - teste/sandbox)**
  - `MERCADO_PAGO_ACCESS_TOKEN`
  - (opcional) `SITE_URL` (ex: `https://seu-dominio.com`) para `back_urls`

- **Supabase (usado internamente nas functions)**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 4) Banco de dados (migrations)
As migrations ficam em `supabase/migrations/`.

Para aplicar localmente:

```bash
supabase start
supabase db reset
```

Para aplicar no projeto remoto:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

### 5) Edge Functions (deploy)
Functions existentes em `supabase/functions/`:
- `send-ticket` (envia voucher de ingresso)
- `send-inscricao-confirmation` (confirmação de inscrição)
- `send-pending-payment` (aguardando pagamento PIX/Dinheiro)
- `create-mp-checkout` (Checkout Pro Mercado Pago)
- `mp-webhook` (webhook do Mercado Pago)

Deploy:

```bash
supabase functions deploy send-ticket
supabase functions deploy send-inscricao-confirmation
supabase functions deploy send-pending-payment
supabase functions deploy create-mp-checkout
supabase functions deploy mp-webhook
```

### 6) Configuração do webhook do Mercado Pago
No Mercado Pago (ambiente teste), aponte notificações para:

- `https://<project-ref>.supabase.co/functions/v1/mp-webhook`

Observação: o webhook valida o pagamento consultando a API do Mercado Pago.

### 7) Configurações dinâmicas (Admin)
No painel Admin → Configurações do Evento, o sistema salva em `site_config`:
- `evento_nome`, `evento_data`, `evento_local`, `evento_horario`, `evento_edicao`, `evento_subtitulo`, `evento_descricao`
- `evento_background_url`
- `pix_chave` / `evento_pix` (chave pix)
- `pix_banco` (banco/descrição opcional)
- `regras_e_proibicoes` (pode ficar vazio)
- `rodape_texto` (opcional; se vazio não aparece na landing)

Templates de e-mail (Admin → Templates):
- `email_template_ingresso`
- `email_template_inscricao`
- `email_template_aguardando_pagamento`

### 8) Pontos importantes de segurança
- **Nunca** coloque `MERCADO_PAGO_ACCESS_TOKEN` no frontend.
- As Edge Functions deste projeto estão com `verify_jwt = false` para evitar erro de JWT ES256 no runtime.
  - Se quiser endurecer segurança depois, adicione um header/secret próprio e valide dentro das functions.

