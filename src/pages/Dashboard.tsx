import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Plus, User } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Inscricao = Database['public']['Tables']['inscricoes']['Row'];

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const Dashboard = () => {
  const { user, loading: authLoading, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    supabase.from('inscricoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setInscricoes(data);
    });
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="border-border text-foreground font-sans">
                <Link to="/admin">Painel Admin</Link>
              </Button>
            )}
            <span className="text-sm text-muted-foreground font-sans flex items-center gap-1"><User className="w-4 h-4" />{profile?.nome || user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Minhas Inscrições</h1>
          <Button asChild className="bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
            <Link to="/inscricao"><Plus className="w-4 h-4 mr-2" /> Nova Inscrição</Link>
          </Button>
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
              <Card key={insc.id} className="bg-card border-border hover:border-gold/30 transition-colors">
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
      </main>
    </div>
  );
};

export default Dashboard;
