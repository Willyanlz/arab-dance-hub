
-- workshops_config
CREATE TABLE public.workshops_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  professor TEXT,
  horario TEXT,
  periodo TEXT DEFAULT 'manha',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workshops_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view workshops_config" ON public.workshops_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert workshops_config" ON public.workshops_config FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update workshops_config" ON public.workshops_config FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete workshops_config" ON public.workshops_config FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- lotes_mostra
CREATE TABLE public.lotes_mostra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  preco_solo NUMERIC NOT NULL,
  preco_dupla_trio NUMERIC NOT NULL,
  preco_grupo_por_integrante NUMERIC NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lotes_mostra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lotes_mostra" ON public.lotes_mostra FOR SELECT USING (true);
CREATE POLICY "Admins can insert lotes_mostra" ON public.lotes_mostra FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lotes_mostra" ON public.lotes_mostra FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lotes_mostra" ON public.lotes_mostra FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- lotes_workshop
CREATE TABLE public.lotes_workshop (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  preco_pacote_completo NUMERIC NOT NULL,
  preco_1_aula NUMERIC NOT NULL,
  preco_2_aulas NUMERIC NOT NULL,
  preco_3_aulas NUMERIC NOT NULL,
  preco_4_aulas NUMERIC NOT NULL,
  preco_5_aulas NUMERIC NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lotes_workshop ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lotes_workshop" ON public.lotes_workshop FOR SELECT USING (true);
CREATE POLICY "Admins can insert lotes_workshop" ON public.lotes_workshop FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lotes_workshop" ON public.lotes_workshop FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lotes_workshop" ON public.lotes_workshop FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- lotes_ingresso (for guest tickets)
CREATE TABLE public.lotes_ingresso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lotes_ingresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lotes_ingresso" ON public.lotes_ingresso FOR SELECT USING (true);
CREATE POLICY "Admins can insert lotes_ingresso" ON public.lotes_ingresso FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lotes_ingresso" ON public.lotes_ingresso FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lotes_ingresso" ON public.lotes_ingresso FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Add lote_id FK to tipos_ingresso
ALTER TABLE public.tipos_ingresso ADD COLUMN lote_ingresso_id UUID REFERENCES public.lotes_ingresso(id) ON DELETE SET NULL;

-- termos_config
CREATE TABLE public.termos_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL UNIQUE,
  conteudo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.termos_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view termos_config" ON public.termos_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert termos_config" ON public.termos_config FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update termos_config" ON public.termos_config FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete termos_config" ON public.termos_config FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_termos_config_updated_at BEFORE UPDATE ON public.termos_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- modalidades_config
CREATE TABLE public.modalidades_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'competicao', -- competicao | mostra
  periodo TEXT NOT NULL DEFAULT 'manha', -- manha | tarde
  horario TEXT, -- e.g. "09:00 - 10:30"
  faixa_etaria TEXT, -- e.g. "12 a 17 anos"
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.modalidades_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modalidades_config" ON public.modalidades_config FOR SELECT USING (true);
CREATE POLICY "Admins can insert modalidades_config" ON public.modalidades_config FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update modalidades_config" ON public.modalidades_config FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete modalidades_config" ON public.modalidades_config FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- inscricao_workshops
CREATE TABLE public.inscricao_workshops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscricao_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES public.workshops_config(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inscricao_workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own inscricao_workshops" ON public.inscricao_workshops FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM inscricoes WHERE inscricoes.id = inscricao_workshops.inscricao_id AND inscricoes.user_id = auth.uid()));
CREATE POLICY "Users can view own inscricao_workshops" ON public.inscricao_workshops FOR SELECT USING (EXISTS (SELECT 1 FROM inscricoes WHERE inscricoes.id = inscricao_workshops.inscricao_id AND inscricoes.user_id = auth.uid()));
CREATE POLICY "Admins can view all inscricao_workshops" ON public.inscricao_workshops FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Add new columns to inscricoes
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS tipo_inscricao TEXT DEFAULT 'competicao';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS tipo_participacao_mostra TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS preferencia_periodo TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS sugestao_horario TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS tipo_compra_workshop TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS como_soube TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS faixa_etaria TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS participa_harem BOOLEAN DEFAULT false;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS lote_mostra_id UUID REFERENCES public.lotes_mostra(id) ON DELETE SET NULL;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS lote_workshop_id UUID REFERENCES public.lotes_workshop(id) ON DELETE SET NULL;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS termos_atraso BOOLEAN DEFAULT false;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS termos_musica BOOLEAN DEFAULT false;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS termos_sem_ensaio BOOLEAN DEFAULT false;
