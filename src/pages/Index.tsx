import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, Music, Users, Star } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import { PREMIACOES, PONTUACAO, MODALIDADES } from '@/lib/constants';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Festival de Danças Árabes" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-hero opacity-80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <Badge className="mb-6 bg-primary/20 border-gold text-gold-light px-4 py-1.5 text-sm font-sans">
            9ª Edição • 08 e 09 de Agosto 2026
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-gradient-gold mb-4 leading-tight">
            F.A.D.D.A
          </h1>
          <p className="text-xl md:text-2xl font-serif text-gold-light/90 mb-2">
            Festival Araraquarense de Danças Árabes
          </p>
          <p className="text-muted-foreground text-base mb-8 max-w-2xl mx-auto font-sans text-sand-dark">
            Competições • Mostras • Workshops • Premiações
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-8 py-6 rounded-xl shimmer">
              <Link to="/inscricao">Inscreva-se Agora</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gold text-gold-light hover:bg-gold/10 font-sans text-lg px-8 py-6 rounded-xl">
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
            { icon: Calendar, title: 'Quando', desc: '08 e 09 de Agosto de 2026' },
            { icon: MapPin, title: 'Onde', desc: 'Araraquara, São Paulo' },
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
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Modalidades
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {MODALIDADES.map((m) => (
              <Badge key={m} variant="secondary" className="text-sm px-4 py-2 font-sans bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">
                {m}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Premiações */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            <Trophy className="inline-block w-8 h-8 text-primary mr-2 mb-1" />
            Premiações
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PREMIACOES.map(({ categoria, valor }) => (
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
      </section>

      {/* Pontuação */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Critérios de Pontuação
          </h2>
          <div className="space-y-4">
            {Object.entries(PONTUACAO).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize font-sans text-foreground">
                  {key.replace('_', ' ')}
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
      </section>

      {/* Regras */}
      <section className="py-20 px-4">
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
                  <li>• Formato MP3 via pen drive</li>
                  <li>• Entregar antes da apresentação</li>
                  <li>• Solo/Dupla/Trio: até 3 minutos</li>
                  <li>• Grupo: até 4 minutos</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Star className="w-6 h-6 text-destructive mb-3" />
                <h3 className="font-serif font-semibold text-foreground mb-2">Proibições</h3>
                <ul className="text-sm text-muted-foreground space-y-1 font-sans">
                  <li>• Uso de fogo</li>
                  <li>• Uso de água</li>
                  <li>• Elementos perigosos</li>
                  <li>• Atrasos desclassificam</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-hero text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gradient-gold mb-4">
            Garanta sua Vaga!
          </h2>
          <p className="text-sand-dark mb-8 font-sans">
            Inscrições abertas. Aproveite os melhores preços do 1º lote!
          </p>
          <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-10 py-6 rounded-xl shimmer">
            <Link to="/inscricao">Inscrever-se</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm font-sans">
          <p>© 2026 F.A.D.D.A - Festival Araraquarense de Danças Árabes. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
