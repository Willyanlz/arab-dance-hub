-- Mercado Pago Checkout Pro + Pending payment email
-- NOTE: Do NOT store Mercado Pago access tokens in site_config (publicly readable).

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'pagamento_metodo'
      and e.enumlabel = 'dinheiro'
  ) then
    alter type public.pagamento_metodo add value 'dinheiro';
  end if;
end $$;

alter table public.pagamentos
  add column if not exists preference_id text;

insert into public.site_config (chave, valor, descricao)
values
  (
    'mercado_pago_public_key',
    '"APP_USR-e3e5f3dd-4b7b-4ac9-a209-b028b6088a91"'::jsonb,
    'Public key do Mercado Pago (ambiente de teste)'
  )
on conflict (chave) do nothing;

insert into public.site_config (chave, valor, descricao)
values
  (
    'email_template_aguardando_pagamento',
    '{
      "titulo_email":"F.A.D.D.A",
      "subtitulo_email":"Festival Araraquarense de Danças Árabes",
      "mensagem_confirmacao":"Recebemos sua solicitação e seu pagamento está aguardando confirmação. Assim que for confirmado, enviaremos a confirmação/voucher por e-mail.",
      "titulo_detalhes":"Resumo",
      "rodape_evento":"9º F.A.D.D.A - 2026",
      "rodape_local":"Araraquara, São Paulo",
      "cor_primaria":"#d4af37",
      "cor_fundo":"#000000",
      "cor_texto":"#ffffff",
      "cor_subtexto":"#888888"
    }'::jsonb,
    'Template do email de aguardando pagamento (PIX/Dinheiro)'
  )
on conflict (chave) do nothing;

