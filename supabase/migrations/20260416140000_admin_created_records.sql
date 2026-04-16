-- Track admin-created registrations/tickets for third parties

alter table public.inscricoes
  add column if not exists created_by_admin_id uuid references public.profiles(user_id) on delete set null,
  add column if not exists contato_nome text,
  add column if not exists contato_email text,
  add column if not exists contato_cpf text,
  add column if not exists contato_telefone text;

alter table public.ingressos_vendidos
  add column if not exists created_by_admin_id uuid references public.profiles(user_id) on delete set null;

