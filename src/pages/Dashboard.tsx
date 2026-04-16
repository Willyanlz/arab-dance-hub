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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { isValidCpf, isValidEmail, isValidPhoneBR, maskCpf, maskPhone } from '@/lib/inputValidation';

type Inscricao = Database['public']['Tables']['inscricoes']['Row'];
type IngressoVendido = Database['public']['Tables']['ingressos_vendidos']['Row'] & { tipos_ingresso?: { nome: string } };

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
  const [ingressos, setIngressos] = useState<IngressoVendido[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [adminModal, setAdminModal] = useState<'none' | 'inscricao' | 'ingresso'>('none');
  const [adminPessoa, setAdminPessoa] = useState({ nome: '', cpf: '', email: '', whatsapp: '' });
  const [adminTipoInscricao, setAdminTipoInscricao] = useState<'competicao' | 'mostra' | 'workshop'>('competicao');
  const [adminIngressoTipoId, setAdminIngressoTipoId] = useState<string>('');
  const [tiposIngresso, setTiposIngresso] = useState<{ id: string; nome: string }[]>([]);
  const [adminQtdIngresso, setAdminQtdIngresso] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('inscricoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setInscricoes(data);
    });
    Promise.all([
      supabase.from('ingressos_vendidos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('tipos_ingresso').select('id, nome'),
    ]).then(([{ data: ingressosData }, { data: tiposData }]) => {
      if (ingressosData) {
        const tiposMap = new Map((tiposData || []).map((tipo: any) => [tipo.id, tipo.nome]));
        const merged = ingressosData.map((ing: any) => ({
          ...ing,
          tipos_ingresso: { nome: tiposMap.get(ing.tipo_ingresso_id) || 'Ingresso' },
        }));
        setIngressos(merged as any);
      }
      if (tiposData) setTiposIngresso(tiposData as any);
    });
    supabase.from('profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const adminCreateInscricao = async () => {
    if (!user) return;
    if (!adminPessoa.nome.trim()) {
      toast({ title: 'Informe o nome', variant: 'destructive' });
      return;
    }
    if (!isValidCpf(adminPessoa.cpf)) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(adminPessoa.email)) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    if (!isValidPhoneBR(adminPessoa.whatsapp)) {
      toast({ title: 'WhatsApp inválido', description: 'Use DDD + número (ex: 16999999999).', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('inscricoes').insert({
      user_id: user.id,
      tipo_inscricao: adminTipoInscricao,
      categoria: 'solo',
      modalidade: 'ADMIN',
      nome_coreografia: `Inscrição (admin) - ${adminPessoa.nome}`,
      status: 'pendente',
      valor_total: 0,
      valor_final: 0,
      desconto_percentual: 0,
      num_integrantes: 1,
      created_by_admin_id: user.id,
      contato_nome: adminPessoa.nome.trim(),
      contato_cpf: adminPessoa.cpf,
      contato_email: adminPessoa.email.trim(),
      contato_telefone: adminPessoa.whatsapp,
      dados_adicionais: { criado_no_dashboard: true },
    } as any);

    if (error) {
      toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Inscrição criada (sem pagamento)' });
    setAdminModal('none');
    setAdminPessoa({ nome: '', cpf: '', email: '', whatsapp: '' });
    supabase.from('inscricoes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setInscricoes(data);
    });
  };

  const adminCreateIngresso = async () => {
    if (!user) return;
    if (!adminIngressoTipoId) {
      toast({ title: 'Selecione o tipo de ingresso', variant: 'destructive' });
      return;
    }
    if (!adminPessoa.nome.trim()) {
      toast({ title: 'Informe o nome', variant: 'destructive' });
      return;
    }
    if (!isValidCpf(adminPessoa.cpf)) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(adminPessoa.email)) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    if (adminPessoa.whatsapp && !isValidPhoneBR(adminPessoa.whatsapp)) {
      toast({ title: 'WhatsApp inválido', description: 'Use DDD + número (ex: 16999999999).', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('ingressos_vendidos').insert({
      tipo_ingresso_id: adminIngressoTipoId,
      user_id: user.id,
      nome_comprador: adminPessoa.nome.trim(),
      cpf: adminPessoa.cpf,
      email: adminPessoa.email.trim(),
      telefone: adminPessoa.whatsapp || null,
      quantidade: Math.max(1, adminQtdIngresso),
      valor_total: 0,
      status: 'pendente',
      metodo_pagamento: 'dinheiro',
      created_by_admin_id: user.id,
    } as any);

    if (error) {
      toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Ingresso criado (sem pagamento)' });
    setAdminModal('none');
    setAdminPessoa({ nome: '', cpf: '', email: '', whatsapp: '' });
  };

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
            {isAdmin && (
              <Button variant="outline" className="border-border text-foreground font-sans" onClick={() => setAdminModal('inscricao')}>
                Inscrever outra pessoa
              </Button>
            )}
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

        <div className="flex justify-between items-center mt-12 mb-8">
          <h2 className="text-2xl font-serif font-bold text-foreground">Meus Ingressos</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" className="border-border text-foreground font-sans" onClick={() => setAdminModal('ingresso')}>
                Comprar ingresso para outra pessoa
              </Button>
            )}
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
            {ingressos.map(ing => (
              <Card key={ing.id} className="bg-card border-border overflow-hidden">
                <div className="bg-gradient-gold px-4 py-2 flex justify-between items-center">
                  <span className="font-bold text-primary-foreground font-serif">{ing.tipos_ingresso?.nome}</span>
                  <Badge className="bg-white/20 text-white border-0">
                    {ing.status.charAt(0).toUpperCase() + ing.status.slice(1)}
                  </Badge>
                </div>
                <CardContent className="p-6 flex flex-col items-center">
                  {ing.status === 'confirmado' ? (
                    <div className="bg-white p-2 rounded-lg mb-4">
                      <QRCodeSVG value={btoa(ing.id)} size={150} />
                    </div>
                  ) : (
                    <div className="w-[150px] h-[150px] bg-muted flex items-center justify-center rounded-lg mb-4 border border-dashed border-border text-center p-4">
                      <span className="text-xs text-muted-foreground font-sans">QR Code disponível após confirmação</span>
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
            ))}
          </div>
        )}
      </main>

      {adminModal !== 'none' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border w-full max-w-lg">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">
                {adminModal === 'inscricao' ? 'Inscrever outra pessoa (sem pagamento)' : 'Comprar ingresso para outra pessoa (sem pagamento)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminModal === 'inscricao' && (
                <div>
                  <Label className="text-foreground font-sans">Tipo de inscrição</Label>
                  <Select value={adminTipoInscricao} onValueChange={(v) => setAdminTipoInscricao(v as any)}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="competicao">Competição</SelectItem>
                      <SelectItem value="mostra">Mostra</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {adminModal === 'ingresso' && (
                <div>
                  <Label className="text-foreground font-sans">Tipo de ingresso</Label>
                  <select
                    value={adminIngressoTipoId}
                    onChange={(e) => setAdminIngressoTipoId(e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Selecione...</option>
                    {tiposIngresso.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              )}

              <div>
                <Label className="text-foreground font-sans">Nome *</Label>
                <Input value={adminPessoa.nome} onChange={(e) => setAdminPessoa(p => ({ ...p, nome: e.target.value }))} className="bg-background border-border text-foreground" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground font-sans">CPF *</Label>
                  <Input value={adminPessoa.cpf} onChange={(e) => setAdminPessoa(p => ({ ...p, cpf: maskCpf(e.target.value) }))} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">WhatsApp *</Label>
                  <Input value={maskPhone(adminPessoa.whatsapp)} onChange={(e) => setAdminPessoa(p => ({ ...p, whatsapp: e.target.value.replace(/\D/g, '').slice(0, 11) }))} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
                </div>
              </div>
              <div>
                <Label className="text-foreground font-sans">E-mail *</Label>
                <Input type="email" value={adminPessoa.email} onChange={(e) => setAdminPessoa(p => ({ ...p, email: e.target.value }))} className="bg-background border-border text-foreground" />
              </div>

              {adminModal === 'ingresso' && (
                <div>
                  <Label className="text-foreground font-sans">Quantidade</Label>
                  <Input type="number" value={adminQtdIngresso} onChange={(e) => setAdminQtdIngresso(Math.max(1, Number(e.target.value)))} className="bg-background border-border text-foreground" />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setAdminModal('none')} className="flex-1 border-border text-foreground font-sans">Cancelar</Button>
                <Button
                  onClick={adminModal === 'inscricao' ? adminCreateInscricao : adminCreateIngresso}
                  className="flex-1 bg-gradient-gold text-primary-foreground font-sans"
                >
                  Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
