insert into public.site_config (chave, valor, descricao)
values
  ('rodape_texto', '""'::jsonb, 'Texto opcional do rodapé da Landing Page')
on conflict (chave) do nothing;

