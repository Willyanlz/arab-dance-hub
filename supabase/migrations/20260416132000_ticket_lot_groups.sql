-- Ticket lots: groups + quantities + pricing

create table if not exists public.lote_ingresso_grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

alter table public.lote_ingresso_grupos enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lote_ingresso_grupos' and policyname = 'Anyone can view lote_ingresso_grupos') then
    create policy "Anyone can view lote_ingresso_grupos" on public.lote_ingresso_grupos for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lote_ingresso_grupos' and policyname = 'Admins can insert lote_ingresso_grupos') then
    create policy "Admins can insert lote_ingresso_grupos" on public.lote_ingresso_grupos for insert with check (public.has_role(auth.uid(), 'admin'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lote_ingresso_grupos' and policyname = 'Admins can update lote_ingresso_grupos') then
    create policy "Admins can update lote_ingresso_grupos" on public.lote_ingresso_grupos for update using (public.has_role(auth.uid(), 'admin'));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lote_ingresso_grupos' and policyname = 'Admins can delete lote_ingresso_grupos') then
    create policy "Admins can delete lote_ingresso_grupos" on public.lote_ingresso_grupos for delete using (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

alter table public.lotes_ingresso
  add column if not exists grupo_id uuid references public.lote_ingresso_grupos(id) on delete cascade,
  add column if not exists quantidade_total integer not null default 0,
  add column if not exists quantidade_vendida integer not null default 0;

alter table public.tipos_ingresso
  add column if not exists lote_grupo_id uuid references public.lote_ingresso_grupos(id) on delete set null;

do $$
declare
  default_group_id uuid;
begin
  select id into default_group_id from public.lote_ingresso_grupos where nome = 'Padrão' limit 1;
  if default_group_id is null then
    insert into public.lote_ingresso_grupos (nome) values ('Padrão') returning id into default_group_id;
  end if;

  update public.lotes_ingresso
    set grupo_id = coalesce(grupo_id, default_group_id);

  update public.tipos_ingresso
    set lote_grupo_id = coalesce(lote_grupo_id, default_group_id);
end $$;

