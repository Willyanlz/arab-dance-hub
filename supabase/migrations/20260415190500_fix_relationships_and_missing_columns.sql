alter table public.lotes_ingresso
  add column if not exists preco numeric not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_roles_user_id_profiles_fkey'
  ) then
    alter table public.user_roles
      add constraint user_roles_user_id_profiles_fkey
      foreign key (user_id)
      references public.profiles(user_id)
      on delete cascade;
  end if;
end $$;
