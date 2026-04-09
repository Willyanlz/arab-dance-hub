import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, Music, Users, Star, Ticket, Camera, Scissors, CircleDot } from 'lucide-react';
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
          <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-10 py-6 rounded-xl">
            <Link to="/ingressos">Ver Ingressos Disponíveis</Link>
          </Button>
        </div>
      </section>

      {/* Premiações */}
      <section className="py-20 px-4 bg-card">
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
      <section className="py-20 px-4">
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
      <section className="py-20 px-4 bg-card">
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

      {/* Stand / Feirinha */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-center mb-12 text-foreground">
            Stand / Feirinha
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Foto & Filmagem */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Camera className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-3">Foto e Filmagem</h3>
                <p className="text-sm text-muted-foreground font-sans mb-3">
                  Cobertura oficial por <strong>Marcelo Ribeiro Fotografia</strong> (CNPJ: 28.544.222/0001-94).
                </p>
                <p className="text-xs text-muted-foreground font-sans mb-3">
                  É proibido filmar/fotografar com equipamento profissional. Apenas celulares sem flash. Violação pode levar à desclassificação.
                </p>
                <div className="space-y-1 text-xs font-sans text-muted-foreground">
                  <p className="font-medium text-foreground">Valores por apresentação:</p>
                  <p>R$ 160 até 15/04 (fotos R$85 / filmagem R$85)</p>
                  <p>R$ 170 até 30/04 (fotos R$90 / filmagem R$90)</p>
                  <p>R$ 180 até 31/05 (fotos R$95 / filmagem R$95)</p>
                  <p>R$ 190 até 30/06 (fotos R$100 / filmagem R$100)</p>
                  <p>R$ 200 até 31/07 (fotos R$105 / filmagem R$105)</p>
                  <p>R$ 210 após 08/08 (fotos R$110 / filmagem R$110)</p>
                  <p className="text-primary">5% desconto para +1 apresentação</p>
                </div>
                <p className="text-xs text-muted-foreground font-sans mt-3">
                  📱 WhatsApp: 19 9 93185949
                </p>
              </CardContent>
            </Card>

            {/* Maquiagem */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <Scissors className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-3">Maquiagem e Cabelo</h3>
                <p className="text-sm text-muted-foreground font-sans mb-3">
                  Com <strong>Teresinha Ferro</strong>
                </p>
                <p className="text-sm text-muted-foreground font-sans">
                  Agende seu horário!
                </p>
                <p className="text-xs text-muted-foreground font-sans mt-3">
                  📱 Cel: (11) 97992-2321
                </p>
              </CardContent>
            </Card>

            {/* Plataforma 360 */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <CircleDot className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-3">Plataforma 360° e Cabine de Fotos</h3>
                <p className="text-sm text-muted-foreground font-sans">
                  Pagamento diretamente com a equipe do <strong>Paulo JR Cabine</strong>.
                </p>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans text-lg px-10 py-6 rounded-xl shimmer">
              <Link to="/inscricao">Inscrever-se</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-gold text-gold-light hover:bg-gold/10 font-sans text-lg px-10 py-6 rounded-xl">
              <Link to="/ingressos">Comprar Ingressos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm font-sans">
          <p>© 2026 F.A.D.D.A - Festival Araraquarense de Danças Árabes. Todos os direitos reservados.</p>
          <p className="mt-1">Elaine de Fátima da Silva — CNPJ 196914770001-99</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
