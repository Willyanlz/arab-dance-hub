do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_user_id_unique') then
    alter table public.profiles
      add constraint profiles_user_id_unique unique (user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_roles_user_id_fkey') then
    alter table public.user_roles
      add constraint user_roles_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_roles_user_id_profiles_fkey') then
    alter table public.user_roles
      add constraint user_roles_user_id_profiles_fkey
      foreign key (user_id)
      references public.profiles(user_id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ingressos_vendidos_tipo_ingresso_id_fkey') then
    alter table public.ingressos_vendidos
      add constraint ingressos_vendidos_tipo_ingresso_id_fkey
      foreign key (tipo_ingresso_id)
      references public.tipos_ingresso(id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inscricao_workshops_inscricao_id_fkey') then
    alter table public.inscricao_workshops
      add constraint inscricao_workshops_inscricao_id_fkey
      foreign key (inscricao_id)
      references public.inscricoes(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inscricao_workshops_workshop_id_fkey') then
    alter table public.inscricao_workshops
      add constraint inscricao_workshops_workshop_id_fkey
      foreign key (workshop_id)
      references public.workshops_config(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'participantes_inscricao_id_fkey') then
    alter table public.participantes
      add constraint participantes_inscricao_id_fkey
      foreign key (inscricao_id)
      references public.inscricoes(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pagamentos_inscricao_id_fkey') then
    alter table public.pagamentos
      add constraint pagamentos_inscricao_id_fkey
      foreign key (inscricao_id)
      references public.inscricoes(id)
      on delete cascade;
  end if;
end $$;

notify pgrst, 'reload schema';
