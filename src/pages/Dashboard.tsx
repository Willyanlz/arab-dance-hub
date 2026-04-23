import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, User, Ticket } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { QRCodeSVG } from 'qrcode.react';
import { getEventStatus } from '@/lib/date-utils';

type Inscricao = Database['public']['Tables']['inscricoes']['Row'];
type IngressoVendido = Database['public']['Tables']['ingressos_vendidos']['Row'] & { tipos_ingresso?: { nome: string } };

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  expirado: 'bg-gray-200 text-gray-600',
  usado: 'bg-purple-100 text-purple-800',
  parcial: 'bg-indigo-100 text-indigo-800',
};

const Dashboard = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [ingressos, setIngressos] = useState<IngressoVendido[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [eventoDatas, setEventoDatas] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = () => {
      supabase.from('inscricoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) setInscricoes((data as any[]).filter(i => i.status !== 'cancelado'));
      });
      Promise.all([
        supabase.from('ingressos_vendidos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tipos_ingresso').select('id, nome'),
      ]).then(([{ data: ingressosData }, { data: tiposData }]) => {
        if (ingressosData) {
          const tiposMap = new Map((tiposData || []).map((tipo: any) => [tipo.id, tipo.nome]));
          const filtered = (ingressosData || []).filter((ing: any) => ing.status !== 'cancelado');
          const merged = filtered.map((ing: any) => ({
            ...ing,
            tipos_ingresso: { nome: tiposMap.get(ing.tipo_ingresso_id) || 'Ingresso' },
          }));
          setIngressos(merged as any);
        }
      });
    };

    load();

    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inscricoes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingressos_vendidos' }, () => load())
      .subscribe();

    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
    supabase.from('site_config').select('valor').eq('chave', 'evento_datas').maybeSingle().then(({ data }) => {
      if (data?.valor) setEventoDatas(data.valor as string[]);
    });

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="border-border text-foreground font-sans">
                <Link to="/admin">Painel Admin</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="border-border text-foreground font-sans">
              <Link to="/perfil">Meu Perfil</Link>
            </Button>
            <span className="text-sm text-muted-foreground font-sans flex items-center gap-1"><User className="w-4 h-4" />{profile?.nome || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Minhas Inscrições</h1>
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
              <Link to="/inscricao"><Plus className="w-4 h-4 mr-2" /> Nova Inscrição</Link>
            </Button>
          </div>
        </div>

        {inscricoes.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground font-sans mb-4">Você ainda não tem inscrições.</p>
              <Button asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
                <Link to="/inscricao">Fazer Inscrição</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {inscricoes.map(insc => (
              <Card key={`inscricao-${insc.id}`} className="bg-card border-border hover:border-gold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif font-semibold text-foreground text-lg">{insc.nome_coreografia}</h3>
                      <p className="text-sm text-muted-foreground font-sans">{insc.modalidade} • {insc.categoria === 'dupla_trio' ? 'Dupla/Trio' : insc.categoria.charAt(0).toUpperCase() + insc.categoria.slice(1)}</p>
                      {insc.nome_artistico && <p className="text-sm text-muted-foreground font-sans mt-1">Artístico: {insc.nome_artistico}</p>}
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[insc.status] || 'bg-muted text-foreground'}>{insc.status.charAt(0).toUpperCase() + insc.status.slice(1)}</Badge>
                      <p className="text-lg font-bold text-primary mt-2 font-sans">R$ {Number(insc.valor_final || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-12 mb-8">
          <h2 className="text-2xl font-serif font-bold text-foreground">Meus Ingressos</h2>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-border text-foreground font-sans">
              <Link to="/ingressos"><Ticket className="w-4 h-4 mr-2" /> Comprar Ingressos</Link>
            </Button>
          </div>
        </div>

        {ingressos.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground font-sans mb-4">Você ainda não comprou ingressos.</p>
              <Button asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
                <Link to="/ingressos">Ver Ingressos Disponíveis</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ingressos.map(ing => {
              const usedCount = Number((ing as any).quantidade_validada || 0);
              const totalCount = Number(ing.quantidade || 0);
              const isUsed = usedCount > 0;
              const isFullyUsed = usedCount >= totalCount;
              
              const { isExpired: eventPassed } = getEventStatus(eventoDatas);
              const isExpired = eventPassed && !isUsed && ing.status === 'confirmado';

              let displayStatus = ing.status?.toLowerCase();
              if (isFullyUsed) displayStatus = 'usado';
              else if (isExpired) displayStatus = 'expirado';
              else if (isUsed) displayStatus = 'parcial';

              return (
                <Card key={`ticket-${ing.id}`} className={`bg-card border-border overflow-hidden ${isExpired || isUsed ? 'opacity-75' : ''}`}>
                  <div className={`${isFullyUsed ? 'bg-purple-500' : isUsed ? 'bg-indigo-500' : isExpired ? 'bg-gray-500' : 'bg-gradient-gold'} px-4 py-2 flex justify-between items-center`}>
                    <span className="font-bold text-primary-foreground font-serif">{ing.tipos_ingresso?.nome}</span>
                    <Badge className="bg-white/20 text-white border-0">
                      {displayStatus === 'usado' ? 'Já usado' : 
                       displayStatus === 'parcial' ? `Usado (${usedCount}/${totalCount})` :
                       displayStatus === 'expirado' ? 'Expirado' :
                       displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </Badge>
                  </div>
                  <CardContent className="p-6 flex flex-col items-center">
                    {['confirmado', 'pago', 'usado', 'parcial'].includes(displayStatus) ? (
                      <div className="bg-white p-2 rounded-lg mb-4">
                        <QRCodeSVG value={btoa(ing.id)} size={150} />
                      </div>
                    ) : (
                      <div className="w-[150px] h-[150px] bg-muted flex items-center justify-center rounded-lg mb-4 border border-dashed border-border text-center p-4">
                        <span className="text-xs text-muted-foreground font-sans">
                          {isFullyUsed ? 'Ingresso totalmente utilizado' : isUsed ? 'Ingresso parcialmente utilizado' : isExpired ? 'Ingresso expirado' : 'QR Code disponível após confirmação'}
                        </span>
                      </div>
                    )}
                  
                  <div className="w-full space-y-2 mt-2 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-sans">Quantidade:</span>
                      <span className="font-bold text-foreground font-sans">{ing.quantidade}x</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-sans">Valor Pago:</span>
                      <span className="font-bold text-green-500 font-sans">R$ {Number(ing.valor_total).toFixed(2)}</span>
                    </div>
                    {ing.status === 'confirmado' && (
                      <div className="text-center mt-2 text-xs text-muted-foreground font-sans">
                        Apresente este QR Code na portaria.
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
