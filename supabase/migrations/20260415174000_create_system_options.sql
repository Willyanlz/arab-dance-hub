create table if not exists public.system_options (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value text not null,
  label text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists system_options_key_value_unique_idx
  on public.system_options (key, value);

create index if not exists system_options_key_ordem_idx
  on public.system_options (key, ordem);

alter table public.system_options enable row level security;

create policy if not exists "System options are viewable by everyone"
  on public.system_options
  for select
  using (true);

create policy if not exists "Admins can manage system options"
  on public.system_options
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create trigger update_system_options_updated_at
before update on public.system_options
for each row execute procedure public.update_updated_at_column();

insert into public.system_options (key, value, label, ordem)
values
  ('categoria', 'solo', 'Solo', 0),
  ('categoria', 'dupla_trio', 'Dupla / Trio', 1),
  ('categoria', 'grupo', 'Grupo', 2),
  ('periodo', 'manha', 'Manhã', 0),
  ('periodo', 'tarde', 'Tarde', 1),
  ('periodo', 'nao_competir', 'Sem preferência de período', 2),
  ('tipo_musica', 'solta', 'Solta', 0),
  ('tipo_musica', 'posicionada', 'Posicionada', 1),
  ('tipo_participacao', 'mostra', 'Mostra', 0),
  ('tipo_participacao', 'avaliada', 'Avaliada', 1),
  ('tipo_compra', '1_aula', '1 Aula', 0),
  ('tipo_compra', '2_aulas', '2 Aulas', 1),
  ('tipo_compra', '3_aulas', '3 Aulas', 2),
  ('tipo_compra', '4_aulas', '4 Aulas', 3),
  ('tipo_compra', '5_aulas', '5 Aulas', 4),
  ('tipo_compra', 'pacote_completo', 'Pacote Completo', 5)
on conflict (key, value) do update
set
  label = excluded.label,
  ordem = excluded.ordem,
  updated_at = now();
