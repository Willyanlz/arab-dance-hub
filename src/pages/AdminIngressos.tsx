import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft, Ticket, TrendingUp, PackageX, DollarSign,
  Users, CheckCircle2, XCircle, Clock, Download
} from 'lucide-react';

interface LoteIngresso {
  id: string;
  numero: number;
  nome: string;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  data_inicio: string;
  data_fim: string;
  ativo: boolean | null;
}

interface IngressoVendido {
  id: string;
  nome_comprador: string;
  cpf: string;
  email: string;
  telefone: string | null;
  quantidade: number;
  valor_total: number;
  status: string;
  created_at: string;
  lote_ingresso_id: string | null;
  tipo_ingresso_id: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pago: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  pendente: <Clock className="w-3 h-3" />,
  pago: <CheckCircle2 className="w-3 h-3" />,
  confirmado: <CheckCircle2 className="w-3 h-3" />,
  cancelado: <XCircle className="w-3 h-3" />,
};

const AdminIngressos = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<LoteIngresso[]>([]);
  const [vendidos, setVendidos] = useState<IngressoVendido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroLote, setFiltroLote] = useState('todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/login');
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: lotesData }, { data: vendidosData }] = await Promise.all([
      (supabase.from('lotes_ingresso') as any).select('*').order('numero'),
      (supabase.from('ingressos_vendidos') as any).select('*').order('created_at', { ascending: false }),
    ]);
    if (lotesData) setLotes(lotesData);
    if (vendidosData) setVendidos(vendidosData);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (status === 'confirmado') {
        const ingresso = vendidos.find(v => v.id === id);
        const lote = lotes.find(l => l.id === ingresso?.lote_ingresso_id);
        if (ingresso) {
          // Fire and forget edge function
          supabase.functions.invoke('send-ticket', {
            body: {
              email: ingresso.email,
              nome_comprador: ingresso.nome_comprador,
              quantidade: ingresso.quantidade,
              tipo_ingresso_nome: lote?.nome || 'Ingresso FADDA',
              ingresso_id: ingresso.id,
              valor_total: ingresso.valor_total
            }
          }).catch(console.error);
        }
      }

      await (supabase.from('ingressos_vendidos') as any).update({ status }).eq('id', id);
      toast({ title: '✅ Status atualizado' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Nome', 'CPF', 'Email', 'Telefone', 'Qtd', 'Valor Total', 'Status', 'Lote', 'Data'],
      ...filteredVendidos.map(v => {
        const lote = lotes.find(l => l.id === v.lote_ingresso_id);
        return [
          v.nome_comprador,
          v.cpf,
          v.email,
          v.telefone || '',
          v.quantidade,
          `R$ ${Number(v.valor_total).toFixed(2)}`,
          v.status,
          lote?.nome || '-',
          new Date(v.created_at).toLocaleDateString('pt-BR'),
        ];
      }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ingressos_fadda_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Stats
  const totalVendidos = vendidos.filter(v => v.status !== 'cancelado').reduce((s, v) => s + v.quantidade, 0);
  const receitaTotal = vendidos.filter(v => v.status === 'confirmado' || v.status === 'pago').reduce((s, v) => s + Number(v.valor_total), 0);
  const totalEstoque = lotes.filter(l => l.ativo).reduce((s, l) => s + l.quantidade_total, 0);
  const totalDisponiveis = totalEstoque - totalVendidos;
  const totalPendentes = vendidos.filter(v => v.status === 'pendente').length;

  const filteredVendidos = vendidos.filter(v => {
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const matchLote = filtroLote === 'todos' || v.lote_ingresso_id === filtroLote;
    const matchBusca = !busca || v.nome_comprador.toLowerCase().includes(busca.toLowerCase()) || v.email.toLowerCase().includes(busca.toLowerCase()) || v.cpf.includes(busca);
    return matchStatus && matchLote && matchBusca;
  });

  if (authLoading || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground font-sans">Carregando...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-sans text-foreground font-medium flex items-center gap-1">
              <Ticket className="w-4 h-4 text-primary" /> Dashboard de Ingressos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-border font-sans">
              <Link to="/admin">← Admin</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-border font-sans">
              <Link to="/admin/config">Config</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-8">

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Total Vendidos</p>
                <Ticket className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalVendidos}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1">ingressos</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Em Estoque</p>
                <PackageX className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{Math.max(0, totalDisponiveis)}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1">de {totalEstoque} total</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Receita Confirmada</p>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-primary">R$ {receitaTotal.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1">pago + confirmado</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Aguardando Pgto</p>
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalPendentes}</p>
              <p className="text-xs text-muted-foreground font-sans mt-1">pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Por Lote ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Vendas por Lote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lotes.map(lote => {
                const vendaLote = vendidos.filter(v => v.lote_ingresso_id === lote.id && v.status !== 'cancelado');
                const qtdVendida = vendaLote.reduce((s, v) => s + v.quantidade, 0);
                const receita = vendaLote.filter(v => v.status === 'confirmado' || v.status === 'pago').reduce((s, v) => s + Number(v.valor_total), 0);
                const pct = lote.quantidade_total > 0 ? Math.round((qtdVendida / lote.quantidade_total) * 100) : 0;
                return (
                  <div key={lote.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-sans font-semibold text-foreground text-sm">{lote.nome}</p>
                        <p className="text-xs text-muted-foreground font-sans">R$ {Number(lote.preco).toFixed(2)}/un</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-sm text-foreground font-bold">{qtdVendida}/{lote.quantidade_total}</p>
                        <p className="text-xs text-primary font-sans">R$ {receita.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-gradient-gold h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">{pct}% vendido • {lote.quantidade_total - qtdVendida} restantes</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Lista de compradores ── */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="font-serif text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Compradores
              </CardTitle>
              <Button onClick={exportCSV} variant="outline" size="sm" className="border-border font-sans flex items-center gap-1">
                <Download className="w-4 h-4" /> Exportar CSV
              </Button>
            </div>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input
                className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm flex-1"
                placeholder="Buscar nome, email, CPF..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              <select className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <select className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm" value={filtroLote} onChange={e => setFiltroLote(e.target.value)}>
                <option value="todos">Todos os lotes</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVendidos.length === 0 ? (
              <p className="text-center text-muted-foreground font-sans py-8">Nenhum ingresso vendido ainda.</p>
            ) : (
              <div className="space-y-2">
                {filteredVendidos.map(v => {
                  const lote = lotes.find(l => l.id === v.lote_ingresso_id);
                  return (
                    <div key={v.id} className="p-4 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-sans font-semibold text-foreground">{v.nome_comprador}</p>
                        <p className="text-xs text-muted-foreground font-sans">{v.email} • CPF: {v.cpf}</p>
                        {v.telefone && <p className="text-xs text-muted-foreground font-sans">{v.telefone}</p>}
                        <p className="text-xs text-muted-foreground font-sans">
                          {v.quantidade}x ingresso • {lote?.nome || '-'} • {new Date(v.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                        <p className="font-bold text-primary font-sans">R$ {Number(v.valor_total).toFixed(2)}</p>
                        <Badge className={`${statusColors[v.status]} border text-xs flex items-center gap-1`}>
                          {statusIcons[v.status]} {v.status}
                        </Badge>
                        <div className="flex gap-1">
                          {(v.status === 'pago' || v.status === 'pendente') && (
                            <Button size="sm" onClick={() => updateStatus(v.id, 'confirmado')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7 font-sans">
                              Confirmar + E-mail
                            </Button>
                          )}
                          {v.status !== 'cancelado' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'cancelado')} className="border-red-600 text-red-400 hover:bg-red-600/10 text-xs px-2 py-1 h-7 font-sans">
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminIngressos;
