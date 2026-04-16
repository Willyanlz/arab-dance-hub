CREATE TABLE IF NOT EXISTS public.system_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system_options"
ON public.system_options FOR SELECT
USING (true);

CREATE POLICY "Admins can insert system_options"
ON public.system_options FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system_options"
ON public.system_options FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system_options"
ON public.system_options FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_system_options_key ON public.system_options(key);