-- Add pedido_ref column to ingressos_vendidos
ALTER TABLE public.ingressos_vendidos ADD COLUMN IF NOT EXISTS pedido_ref TEXT;