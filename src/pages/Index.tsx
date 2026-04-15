import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, Music, Users, Star, Ticket, Camera, Scissors, CircleDot } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { PREMIACOES as DEFAULT_PREMIACOES, PONTUACAO as DEFAULT_PONTUACAO, MODALIDADES as DEFAULT_MODALIDADES } from '@/lib/constants';

const btnPrimary = "bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-8 py-6 rounded-xl shimmer";
const btnOutline = "border-gold text-gold-light hover:bg-gold/10 font-sans text-lg px-8 py-6 rounded-xl";

interface StandItem {
  titulo: string;
  icone: string;
  descricao: string;
  contato?: string;
}

const ICON_MAP: Record<string, any> = { camera: Camera, scissors: Scissors, circle: CircleDot };

const Index = () => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [modalidades, setModalidades] = useState<string[]>([...DEFAULT_MODALIDADES]);
  const [premiacoes, setPremiacoes] = useState(DEFAULT_PREMIACOES);
  const [pontuacao, setPontuacao] = useState<Record<string, number>>(DEFAULT_PONTUACAO);
  const [stands, setStands] = useState<StandItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [{ data: configData }, { data: modData }] = await Promise.all([
        supabase.from('site_config').select('chave,valor'),
        (supabase.from('modalidades_config') as any).select('nome').eq('ativo', true).order('ordem'),
      ]);

      if (configData) {
        const map: Record<string, any> = {};
        configData.forEach((c: any) => { map[c.chave] = c.valor; });
        setConfig(map);
        if (Array.isArray(map.premiacoes) && map.premiacoes.length > 0) setPremiacoes(map.premiacoes);
        if (Array.isArray(map.pontuacao) && map.pontuacao.length > 0) {
          const obj: Record<string, number> = {};
          map.pontuacao.forEach((p: any) => { obj[p.criterio] = p.percentual; });
          setPontuacao(obj);
        }
        if (Array.isArray(map.stands_feirinha)) setStands(map.stands_feirinha);
      }
      if (modData && modData.length > 0) setModalidades(modData.map((m: any) => m.nome));
      setLoaded(true);
    };
    load();
  }, []);

  const c = (key: string, fallback: string) => (typeof config[key] === 'string' ? config[key] : fallback);

  const eventoNome = c('evento_nome', 'F.A.D.D.A');
  const eventoData = c('evento_data', '08 e 09 de Agosto 2026');
  const eventoLocal = c('evento_local', 'Araraquara, São Paulo');
  const eventoHorario = c('evento_horario', '');
  const eventoEdicao = c('evento_edicao', '9ª Edição');
  const eventoSubtitulo = c('evento_subtitulo', 'Festival Araraquarense de Danças Árabes');
  const eventoDescricao = c('evento_descricao', 'Competições • Mostras • Workshops • Premiações');
  const eventoBackgroundUrl = c('evento_background_url', '');

  // Rules from config or defaults
  const regrasMusica = Array.isArray(config.regras_musica) ? config.regras_musica.filter(Boolean) : [];
  const regrasProibicoes = Array.isArray(config.regras_proibicoes) ? config.regras_proibicoes.filter(Boolean) : [];
  const hasModalidades = modalidades.length > 0;
  const hasPremiacoes = Array.isArray(premiacoes) && premiacoes.length > 0;
  const hasPontuacao = Object.keys(pontuacao || {}).length > 0;
  const hasRegras = regrasMusica.length > 0 || regrasProibicoes.length > 0;
  const hasStands = stands.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={eventoBackgroundUrl || heroBg} alt="Festival de Danças Árabes" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/20 border-gold text-gold-light px-4 py-1.5 text-sm font-sans">
            {eventoEdicao} • {eventoData}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-gradient-gold mb-4 leading-tight">
            {eventoNome}
          </h1>
          <p className="text-xl md:text-2xl font-serif text-gold-light/90 mb-2">
            {eventoSubtitulo}
          </p>
          <p className="text-muted-foreground text-base mb-8 max-w-2xl mx-auto font-sans text-sand-dark">
            {eventoDescricao}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className={btnPrimary}>
              <Link to="/inscricao">Inscreva-se Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={btnOutline}>
              <Link to="/ingressos">Comprar Ingressos</Link>
            </Button>
          </div>
          <div className="mt-4">
            <Button asChild variant="ghost" size="sm" className="text-gold-light/70 hover:text-gold-light font-sans">
              <Link to="/login">Acessar Conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
          Sobre o Festival
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Calendar, title: 'Quando', desc: `${eventoData}${eventoHorario ? ` • ${eventoHorario}` : ''}` },
            { icon: MapPin, title: 'Onde', desc: eventoLocal },
            { icon: Users, title: 'Categorias', desc: 'Solo, Dupla/Trio e Grupo' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="bg-card border-border hover:border-gold/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-serif font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground font-sans">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Modalidades */}
      {hasModalidades && <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Modalidades
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {modalidades.map((m) => (
              <Badge key={m} variant="secondary" className="text-sm px-4 py-2 font-sans bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </section>}

      {/* Ingressos CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 text-foreground">
            <Ticket className="inline-block w-8 h-8 text-primary mr-2 mb-1" />
            Ingressos
          </h2>
          <p className="text-muted-foreground font-sans mb-8 max-w-2xl mx-auto">
            Garanta seu ingresso para assistir às competições, mostras e o show de gala com premiações.
          </p>
          <Button asChild size="lg" className={btnPrimary}>
            <Link to="/ingressos">Ver Ingressos Disponíveis</Link>
          </Button>
        </div>
      </section>

      {/* Premiações */}
      {hasPremiacoes && <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            <Trophy className="inline-block w-8 h-8 text-primary mr-2 mb-1" />
            Premiações
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {premiacoes.map(({ categoria, valor }: any) => (
              <Card key={categoria} className="bg-card border-border hover:border-gold/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <Star className="w-6 h-6 mx-auto mb-3 text-primary" />
                  <h3 className="font-serif font-semibold text-foreground mb-1">{categoria}</h3>
                  <p className="text-2xl font-bold text-primary">{valor}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-6 font-sans text-sm">
            + Medalhas para 1º, 2º e 3º lugar em todas as categorias
          </p>
        </div>
      </section>}

      {/* Pontuação */}
      {hasPontuacao && <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Critérios de Pontuação
          </h2>
          <div className="space-y-4">
            {Object.entries(pontuacao).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize font-sans text-foreground">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-gold h-full rounded-full transition-all" style={{ width: `${value}%` }} />
                  </div>
                </div>
                <span className="font-bold text-primary font-sans">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>}

      {/* Regras */}
      {hasRegras && <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Regras Importantes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Music className="w-6 h-6 text-primary mb-3" />
                <h3 className="font-serif font-semibold text-foreground mb-2">Música</h3>
                <ul className="text-sm text-muted-foreground space-y-1 font-sans">
                  {regrasMusica.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Star className="w-6 h-6 text-destructive mb-3" />
                <h3 className="font-serif font-semibold text-foreground mb-2">Proibições</h3>
                <ul className="text-sm text-muted-foreground space-y-1 font-sans">
                  {regrasProibicoes.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>}

      {/* Stand / Feirinha */}
      {hasStands && <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Stand / Feirinha
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {stands.map((stand, idx) => {
              const IconComp = ICON_MAP[stand.icone] || CircleDot;
              return (
                <Card key={idx} className="bg-card border-border">
                  <CardContent className="p-6">
                    <IconComp className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-serif font-semibold text-foreground mb-3">{stand.titulo}</h3>
                    <p className="text-sm text-muted-foreground font-sans whitespace-pre-line">{stand.descricao}</p>
                    {stand.contato && <p className="text-xs text-muted-foreground font-sans mt-3">📱 {stand.contato}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>}

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-hero text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient-gold mb-4">
            Garanta sua Vaga!
          </h2>
          <p className="text-sand-dark mb-8 font-sans">
            Inscrições abertas. Aproveite os melhores preços!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className={btnPrimary}>
              <Link to="/inscricao">Inscrever-se</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={btnOutline}>
              <Link to="/ingressos">Comprar Ingressos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm font-sans">
          <p>© 2026 {eventoNome} - {eventoSubtitulo}. Todos os direitos reservados.</p>
          <p className="mt-1">Elaine de Fátima da Silva — CNPJ 196914770001-99</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
