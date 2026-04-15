alter table public.inscricoes
  add column if not exists dados_adicionais jsonb not null default '{}'::jsonb;

alter table public.ingressos_vendidos
  add column if not exists quantidade_validada integer not null default 0;

insert into public.site_config (chave, valor, descricao)
values
  (
    'email_template_inscricao',
    '{
      "titulo_email":"F.A.D.D.A",
      "subtitulo_email":"Festival Araraquarense de Danças Árabes",
      "mensagem_confirmacao":"Seu pagamento foi confirmado e sua inscrição está validada. Nos vemos no festival!",
      "titulo_detalhes":"Resumo da Inscrição",
      "rodape_evento":"9º F.A.D.D.A - 2026",
      "rodape_local":"Araraquara, São Paulo",
      "cor_primaria":"#d4af37",
      "cor_fundo":"#000000",
      "cor_texto":"#ffffff",
      "cor_subtexto":"#888888"
    }'::jsonb,
    'Template do email de confirmação de inscrição'
  )
on conflict (chave) do nothing;
