
CREATE TABLE public.form_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_inscricao TEXT NOT NULL UNIQUE,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.form_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view form_config" ON public.form_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert form_config" ON public.form_config FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update form_config" ON public.form_config FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete form_config" ON public.form_config FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_form_config_updated_at BEFORE UPDATE ON public.form_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
