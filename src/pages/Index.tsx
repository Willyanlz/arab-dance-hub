import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, Music, Users, Star, Ticket, Camera, Scissors, CircleDot, Shield } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';


const btnPrimary = "bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-8 py-6 rounded-xl shimmer";
const btnOutline = "border-gold text-gold-light hover:bg-gold/10 font-sans text-lg px-8 py-6 rounded-xl";

interface StandItem {
  titulo: string;
  icone: string;
  descricao: string;
  contato?: string;
}

const ICON_MAP: Record<string, any> = { camera: Camera, scissors: Scissors, circle: CircleDot, clock: Clock };

const Index = () => {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [premiacoes, setPremiacoes] = useState<{ categoria: string; valor: string }[]>([]);
  const [pontuacao, setPontuacao] = useState<Record<string, number>>({});
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
        
        // Only override defaults if data exists in config
        if (Array.isArray(map.premiacoes) && map.premiacoes.length > 0) {
          setPremiacoes(map.premiacoes);
        } else if (Object.prototype.hasOwnProperty.call(map, 'premiacoes')) {
          setPremiacoes([]); // Explicitly empty if key exists but is empty
        }

        if (Array.isArray(map.pontuacao) && map.pontuacao.length > 0) {
          const obj: Record<string, number> = {};
          map.pontuacao.forEach((p: any) => { obj[p.criterio] = p.percentual; });
          setPontuacao(obj);
        } else if (Object.prototype.hasOwnProperty.call(map, 'pontuacao')) {
          setPontuacao({}); // Explicitly empty
        }

        if (Array.isArray(map.stands_feirinha)) {
          setStands(map.stands_feirinha);
        }

        // Handle rules migration/fallback
        if (!map.regras_e_proibicoes && (map.regras_musica?.length > 0 || map.regras_proibicoes?.length > 0)) {
          let combined = '';
          if (map.regras_musica?.length > 0) {
            combined += 'REGRAS DE MÚSICA:\n' + map.regras_musica.filter(Boolean).map((r: string) => `• ${r}`).join('\n') + '\n\n';
          }
          if (map.regras_proibicoes?.length > 0) {
            combined += 'PROIBIÇÕES:\n' + map.regras_proibicoes.filter(Boolean).map((r: string) => `• ${r}`).join('\n');
          }
          map.regras_e_proibicoes = combined.trim();
          setConfig(prev => ({ ...prev, regras_e_proibicoes: combined.trim() }));
        }
      }
      
      if (modData && modData.length > 0) {
        setModalidades(modData.map((m: any) => m.nome));
      } else {
        setModalidades([]); // Hide if no modalities are found
      }
      
      setLoaded(true);
    };
    load();
  }, []);

  const c = (key: string, fallback: string) => {
    const val = config[key];
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'string') return val;
    // JSONB strings may be stored with quotes
    const s = String(val).replace(/^"|"$/g, '');
    return s || fallback;
  };

  const eventoNome = c('evento_nome', '');
  const eventoData = c('evento_data', '');
  const eventoLocal = c('evento_local', '');
  const eventoHorario = c('evento_horario', '');
  const eventoEdicao = c('evento_edicao', '');
  const eventoSubtitulo = c('evento_subtitulo', '');
  const eventoDescricao = c('evento_descricao', '');
  const eventoBackgroundUrl = c('evento_background_url', '');

  // Rules from config
  const regrasEProibicoes = config.regras_e_proibicoes || '';
  
  // Section visibility logic: only show if explicitly configured and has items
  const hasModalidades = loaded && modalidades.length > 0;
  const hasPremiacoes = loaded && Array.isArray(premiacoes) && premiacoes.length > 0;
  const hasPontuacao = loaded && Object.keys(pontuacao || {}).length > 0;
  const hasRegras = loaded && !!regrasEProibicoes.trim();
  const hasStands = loaded && stands.length > 0;

  // Info card visibility — only show if field has content
  const hasEventoData = !!eventoData.trim();
  const hasEventoLocal = !!eventoLocal.trim();

  const infoCards = [
    hasEventoData && { icon: Calendar, title: 'Quando', desc: `${eventoData}${eventoHorario ? ` • ${eventoHorario}` : ''}` },
    hasEventoLocal && { icon: MapPin, title: 'Onde', desc: eventoLocal },
    modalidades.length > 0 && { icon: Users, title: 'Categorias', desc: 'Solo, Dupla/Trio e Grupo' },
  ].filter(Boolean) as { icon: any; title: string; desc: string }[];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={eventoBackgroundUrl || heroBg} alt="Festival de Danças Árabes" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {eventoEdicao && <Badge className="mb-6 bg-primary/20 border-gold text-gold-light px-4 py-1.5 text-sm font-sans">
            {eventoEdicao}{eventoData ? ` • ${eventoData}` : ''}
          </Badge>}
          {eventoNome && <h1 className="text-5xl md:text-7xl font-serif font-bold text-gradient-gold mb-4 leading-tight">
            {eventoNome}
          </h1>}
          <p className="text-xl md:text-2xl font-serif text-gold-light/90 mb-2">
            {eventoSubtitulo}
          </p>
          {eventoDescricao && (
            <p className="text-muted-foreground text-base mb-8 max-w-2xl mx-auto font-sans text-sand-dark">
              {eventoDescricao}
            </p>
          )}
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
        <div className={`grid gap-6 ${infoCards.length === 1 ? 'max-w-xs mx-auto' : infoCards.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' : 'md:grid-cols-3'}`}>
          {infoCards.map(({ icon: Icon, title, desc }, idx) => (
            <Card key={`info-${title}-${idx}`} className="bg-card border-border hover:border-gold/50 transition-colors">
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
            {modalidades.map((m, idx) => (
              <Badge key={`mod-${m}-${idx}`} variant="secondary" className="text-sm px-4 py-2 font-sans bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">
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
            {premiacoes.map(({ categoria, valor }: any, idx: number) => (
              <Card key={`premio-${categoria}-${idx}`} className="bg-card border-border hover:border-gold/50 transition-colors">
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
            {Object.entries(pontuacao).map(([key, value], idx) => (
              <div key={`pontuacao-${key}-${idx}`} className="flex items-center justify-between">
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

      {/* Regras e Proibições */}
      {hasRegras && <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Regras e Proibições
          </h2>
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-serif font-semibold text-foreground">Informações Importantes</h3>
              </div>
              <div className="text-muted-foreground font-sans whitespace-pre-line leading-relaxed text-lg">
                {regrasEProibicoes}
              </div>
            </CardContent>
          </Card>
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
                <Card key={`stand-${idx}-${stand.titulo}`} className="bg-card border-border">
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
          <p>© {new Date().getFullYear()}{eventoNome ? ` ${eventoNome}` : ''}{eventoSubtitulo ? ` - ${eventoSubtitulo}` : ''}. Todos os direitos reservados.</p>
          {typeof config.rodape_texto === 'string' && config.rodape_texto.trim() && (
            <p className="mt-1">{config.rodape_texto}</p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Index;
