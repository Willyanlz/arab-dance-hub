-- Create enum types
CREATE TYPE public.categoria_tipo AS ENUM ('solo', 'dupla_trio', 'grupo');
CREATE TYPE public.status_inscricao AS ENUM ('pendente', 'pago', 'confirmado', 'cancelado');
CREATE TYPE public.periodo_tipo AS ENUM ('manha', 'tarde', 'nao_competir');
CREATE TYPE public.musica_tipo AS ENUM ('solta', 'posicionada');
CREATE TYPE public.pagamento_metodo AS ENUM ('pix', 'cartao');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  cpf TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  is_aluna_jalilete BOOLEAN DEFAULT false,
  participante_anterior BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Lotes (price tiers)
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  preco_solo NUMERIC(10,2) NOT NULL,
  preco_dupla_trio NUMERIC(10,2) NOT NULL,
  preco_grupo_por_integrante NUMERIC(10,2) NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view lotes" ON public.lotes FOR SELECT USING (true);
CREATE POLICY "Admins can insert lotes" ON public.lotes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update lotes" ON public.lotes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lotes" ON public.lotes FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Inscricoes (registrations)
CREATE TABLE public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  categoria categoria_tipo NOT NULL,
  modalidade TEXT NOT NULL,
  nome_escola TEXT,
  professora TEXT,
  nome_coreografia TEXT NOT NULL,
  nome_artistico TEXT,
  tipo_musica musica_tipo NOT NULL DEFAULT 'solta',
  periodo periodo_tipo NOT NULL DEFAULT 'manha',
  status status_inscricao NOT NULL DEFAULT 'pendente',
  lote_id UUID REFERENCES public.lotes(id),
  valor_total NUMERIC(10,2),
  desconto_percentual NUMERIC(5,2) DEFAULT 0,
  valor_final NUMERIC(10,2),
  num_integrantes INT DEFAULT 1,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inscricoes" ON public.inscricoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inscricoes" ON public.inscricoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inscricoes" ON public.inscricoes FOR UPDATE USING (auth.uid() = user_id AND status = 'pendente');
CREATE POLICY "Admins can view all inscricoes" ON public.inscricoes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all inscricoes" ON public.inscricoes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Participantes (for dupla/trio/grupo)
CREATE TABLE public.participantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own participantes" ON public.participantes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.inscricoes WHERE id = inscricao_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own participantes" ON public.participantes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.inscricoes WHERE id = inscricao_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all participantes" ON public.participantes FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Pagamentos
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscricao_id UUID REFERENCES public.inscricoes(id) ON DELETE CASCADE NOT NULL,
  metodo pagamento_metodo NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  status status_inscricao NOT NULL DEFAULT 'pendente',
  comprovante_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pagamentos" ON public.pagamentos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.inscricoes WHERE id = inscricao_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own pagamentos" ON public.pagamentos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.inscricoes WHERE id = inscricao_id AND user_id = auth.uid()));
CREATE POLICY "Admins can view all pagamentos" ON public.pagamentos FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pagamentos" ON public.pagamentos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inscricoes_updated_at BEFORE UPDATE ON public.inscricoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, cpf, email, telefone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), '', COALESCE(NEW.email, ''), '');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
