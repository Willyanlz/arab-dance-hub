
-- Table for dynamic site configuration (form labels, modalidades, event settings, etc.)
CREATE TABLE public.site_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text NOT NULL UNIQUE,
  valor jsonb NOT NULL DEFAULT '{}'::jsonb,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site_config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert site_config" ON public.site_config FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update site_config" ON public.site_config FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete site_config" ON public.site_config FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON public.site_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for ticket types
CREATE TABLE public.tipos_ingresso (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  preco numeric NOT NULL DEFAULT 0,
  quantidade_total integer NOT NULL DEFAULT 0,
  quantidade_vendida integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tipos_ingresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tipos_ingresso" ON public.tipos_ingresso FOR SELECT USING (true);
CREATE POLICY "Admins can insert tipos_ingresso" ON public.tipos_ingresso FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update tipos_ingresso" ON public.tipos_ingresso FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete tipos_ingresso" ON public.tipos_ingresso FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_tipos_ingresso_updated_at BEFORE UPDATE ON public.tipos_ingresso FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for sold tickets
CREATE TABLE public.ingressos_vendidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_ingresso_id uuid NOT NULL REFERENCES public.tipos_ingresso(id),
  user_id uuid,
  nome_comprador text NOT NULL,
  cpf text NOT NULL,
  email text NOT NULL,
  telefone text,
  quantidade integer NOT NULL DEFAULT 1,
  valor_total numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ingressos_vendidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all ingressos_vendidos" ON public.ingressos_vendidos FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ingressos_vendidos" ON public.ingressos_vendidos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert ingressos_vendidos" ON public.ingressos_vendidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own ingressos" ON public.ingressos_vendidos FOR SELECT USING (user_id = auth.uid());

CREATE TRIGGER update_ingressos_vendidos_updated_at BEFORE UPDATE ON public.ingressos_vendidos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default site config
INSERT INTO public.site_config (chave, valor, descricao) VALUES
('modalidades_competicao', '["Livre / Inspiração", "Moderno / Fusão", "Folclórico", "Clássico / Tarab", "Amador", "Semi-profissional", "Profissional", "Ballet", "Tribal", "Cigano", "Afro", "Jazz", "Contemporâneo", "Dança de salão"]', 'Lista de modalidades para competição'),
('modalidades_mostra', '["Livre / Inspiração", "Moderno / Fusão", "Folclórico", "Clássico / Tarab", "Ballet", "Tribal", "Cigano", "Afro", "Jazz", "Contemporâneo", "Dança de salão"]', 'Lista de modalidades para mostra'),
('workshops', '[{"nome": "Estilo Egípcio – Lulita", "ativo": true}, {"nome": "Leitura Musical – Yasmin Uatanabi", "ativo": true}, {"nome": "Dança Cigana – Andreia Gaia", "ativo": true}, {"nome": "Técnica para Festivais – Dana Farida", "ativo": true}, {"nome": "Dabke Cabaré – Karina Vieira", "ativo": true}, {"nome": "Quadril Hipnótico – Elaine Jalilah", "ativo": true}, {"nome": "Acroyoga – Silvia Soul", "ativo": true}, {"nome": "Defesa Pessoal – Anabrisa", "ativo": true}]', 'Lista de workshops disponíveis'),
('como_soube_opcoes', '["Instagram Apaixonadas por Dança do Ventre", "Redes da Jalilah", "Redes de terceiros", "Já participou antes", "Jalilete (aluna)", "Outro"]', 'Opções para como soube do festival'),
('inscricoes_abertas', 'true', 'Se as inscrições estão abertas'),
('evento_datas', '{"inicio": "2026-08-08", "fim": "2026-08-09"}', 'Datas do evento'),
('evento_local', '"Araraquara, São Paulo"', 'Local do evento');
