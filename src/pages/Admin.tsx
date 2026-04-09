import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { CATEGORIAS, MODALIDADES } from '@/lib/constants';
import { ArrowLeft, Download, Check, Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago: 'bg-blue-100 text-blue-800',
  confirmado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const Admin = () => {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroModalidade, setFiltroModalidade] = useState('all');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [filtroPeriodo, setFiltroPeriodo] = useState('all');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/login');
  }, [user, authLoading, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadInscricoes();
  }, [user, isAdmin]);

  const loadInscricoes = async () => {
    setLoading(true);
    const { data: inscData } = await supabase
      .from('inscricoes')
      .select('*')
      .order('created_at', { ascending: false });
    if (!inscData) { setLoading(false); return; }
    
    // Fetch profiles for all user_ids
    const userIds = [...new Set(inscData.map(i => i.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, nome, email, cpf, telefone')
      .in('user_id', userIds);
    
    const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
    const data = inscData.map(i => ({ ...i, profiles: profileMap.get(i.user_id) || null }));
    if (data) setInscricoes(data);
    setLoading(false);
  };

  const confirmarPagamento = async (id: string) => {
    await supabase.from('inscricoes').update({ status: 'confirmado' }).eq('id', id);
    await supabase.from('pagamentos').update({ status: 'confirmado' }).eq('inscricao_id', id);
    toast({ title: 'Pagamento confirmado!' });
    loadInscricoes();
  };

  const marcarPago = async (id: string) => {
    await supabase.from('inscricoes').update({ status: 'pago' }).eq('id', id);
    await supabase.from('pagamentos').update({ status: 'pago' }).eq('inscricao_id', id);
    toast({ title: 'Marcado como pago!' });
    loadInscricoes();
  };

  const filteredInscricoes = inscricoes.filter(i => {
    if (filtroCategoria !== 'all' && i.categoria !== filtroCategoria) return false;
    if (filtroModalidade !== 'all' && i.modalidade !== filtroModalidade) return false;
    if (filtroStatus !== 'all' && i.status !== filtroStatus) return false;
    if (filtroPeriodo !== 'all' && i.periodo !== filtroPeriodo) return false;
    if (busca) {
      const search = busca.toLowerCase();
      const profile = i.profiles;
      return (
        i.nome_coreografia?.toLowerCase().includes(search) ||
        i.nome_artistico?.toLowerCase().includes(search) ||
        profile?.nome?.toLowerCase().includes(search) ||
        profile?.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'CPF', 'Telefone', 'Categoria', 'Modalidade', 'Coreografia', 'Status', 'Período', 'Valor', 'Data'];
    const rows = filteredInscricoes.map(i => [
      i.profiles?.nome || '', i.profiles?.email || '', i.profiles?.cpf || '', i.profiles?.telefone || '',
      i.categoria, i.modalidade, i.nome_coreografia, i.status, i.periodo,
      i.valor_final, new Date(i.created_at).toLocaleDateString('pt-BR'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inscricoes_fadda.csv'; a.click();
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent text-accent-foreground font-sans">Admin</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground font-sans">Sair</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Gerenciamento de Inscrições</h1>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-border text-foreground font-sans">
              <Link to="/admin/config">⚙️ Configurações</Link>
            </Button>
            <Button onClick={exportCSV} variant="outline" className="border-border text-foreground font-sans">
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: inscricoes.length },
            { label: 'Pendentes', value: inscricoes.filter(i => i.status === 'pendente').length },
            { label: 'Confirmadas', value: inscricoes.filter(i => i.status === 'confirmado').length },
            { label: 'Receita', value: `R$ ${inscricoes.filter(i => i.status !== 'cancelado').reduce((s, i) => s + Number(i.valor_final || 0), 0).toFixed(2)}` },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground font-sans">{s.label}</p>
                <p className="text-2xl font-bold text-foreground font-sans">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-background border-border text-foreground" />
              </div>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Modalidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas modalidades</SelectItem>
                  {MODALIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos períodos</SelectItem>
                  <SelectItem value="manha">Manhã</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
                  <SelectItem value="nao_competir">Não competir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground font-sans">Participante</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Coreografia</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Categoria</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Modalidade</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Período</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Valor</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Status</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscricoes.map(i => (
                  <TableRow key={i.id} className="border-border">
                    <TableCell className="font-sans">
                      <div>
                        <p className="font-medium text-foreground">{i.profiles?.nome || '-'}</p>
                        <p className="text-xs text-muted-foreground">{i.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-sans">{i.nome_coreografia}</TableCell>
                    <TableCell className="text-foreground font-sans">{i.categoria === 'dupla_trio' ? 'Dupla/Trio' : i.categoria}</TableCell>
                    <TableCell className="text-foreground font-sans text-sm">{i.modalidade}</TableCell>
                    <TableCell className="text-foreground font-sans">{i.periodo === 'manha' ? 'Manhã' : i.periodo === 'tarde' ? 'Tarde' : 'N/C'}</TableCell>
                    <TableCell className="text-foreground font-sans font-medium">R$ {Number(i.valor_final || 0).toFixed(2)}</TableCell>
                    <TableCell><Badge className={statusColors[i.status]}>{i.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {i.status === 'pendente' && (
                          <Button size="sm" variant="outline" onClick={() => marcarPago(i.id)} className="text-xs border-border text-foreground font-sans">Pago</Button>
                        )}
                        {(i.status === 'pendente' || i.status === 'pago') && (
                          <Button size="sm" onClick={() => confirmarPagamento(i.id)} className="text-xs bg-gradient-gold text-primary-foreground font-sans">
                            <Check className="w-3 h-3 mr-1" /> Confirmar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredInscricoes.length === 0 && (
            <div className="p-8 text-center text-muted-foreground font-sans">Nenhuma inscrição encontrada.</div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Admin;
