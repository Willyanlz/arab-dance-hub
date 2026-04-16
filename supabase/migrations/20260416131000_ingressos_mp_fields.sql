-- Add payment fields for ticket purchases (ingressos_vendidos)

alter table public.ingressos_vendidos
  add column if not exists metodo_pagamento text not null default 'pix',
  add column if not exists preference_id text;

