-- Create lot groups table
CREATE TABLE public.lote_ingresso_grupos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lote_ingresso_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lote_ingresso_grupos" ON public.lote_ingresso_grupos FOR SELECT USING (true);
CREATE POLICY "Admins can insert lote_ingresso_grupos" ON public.lote_ingresso_grupos FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lote_ingresso_grupos" ON public.lote_ingresso_grupos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lote_ingresso_grupos" ON public.lote_ingresso_grupos FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add columns to lotes_ingresso for price and quantity per lot
ALTER TABLE public.lotes_ingresso
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.lote_ingresso_grupos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS preco NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantidade_vendida INTEGER NOT NULL DEFAULT 0;

-- Add grupo_id to tipos_ingresso
ALTER TABLE public.tipos_ingresso
  ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.lote_ingresso_grupos(id) ON DELETE SET NULL;

-- Enable realtime for ticket-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.tipos_ingresso;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lotes_ingresso;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lote_ingresso_grupos;