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
import { exportToXlsx } from '@/lib/exportXlsx';

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
  const [tipos, setTipos] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [vendidos, setVendidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const ITEMS_POR_PAGINA = 25;
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear().toString());
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
    const [{ data: tiposData }, { data: lotesData }, { data: gruposData }, { data: vendidosData }] = await Promise.all([
      supabase.from('tipos_ingresso').select('*').order('created_at'),
      supabase.from('lotes_ingresso').select('*').order('numero'),
      (supabase.from('lote_ingresso_grupos') as any).select('*'),
      supabase.from('ingressos_vendidos').select('*').order('created_at', { ascending: false }),
    ]);
    if (tiposData) setTipos(tiposData as any[]);
    if (lotesData) setLotes(lotesData as any[]);
    if (gruposData) setGrupos(gruposData as any[]);
    if (vendidosData) setVendidos(vendidosData as any[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      if (status === 'confirmado') {
        const ingresso = vendidos.find((v: any) => v.id === id);
        const tipo = tipos.find((t: any) => t.id === ingresso?.tipo_ingresso_id);
        if (ingresso) {
          supabase.functions.invoke('send-ticket', {
            body: {
              email: ingresso.email,
              nome_comprador: ingresso.nome_comprador,
              quantidade: ingresso.quantidade,
              tipo_ingresso_nome: tipo?.nome || 'Ingresso FADDA',
              ingresso_id: ingresso.id,
              valor_total: ingresso.valor_total
            }
          }).catch(console.error);
        }
      }
      await supabase.from('ingressos_vendidos').update({ status } as any).eq('id', id);
      toast({ title: '✅ Status atualizado' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar', description: e.message, variant: 'destructive' });
    }
  };

  const validarIngresso = async (ingresso: any) => {
    const novaValidada = (ingresso.quantidade_validada || 0) + 1;
    if (novaValidada > ingresso.quantidade) {
      toast({ title: 'Erro', description: 'Todos os tickets já foram validados.', variant: 'destructive' });
      return;
    }
    if (!confirm(`Confirmar entrada? Utilizados: ${novaValidada}/${ingresso.quantidade}`)) return;
    try {
      await supabase.from('ingressos_vendidos').update({ quantidade_validada: novaValidada } as any).eq('id', ingresso.id);
      toast({ title: '✅ Entrada validada!' });
      loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const exportExcel = () => {
    const headers = ['Nome Completo', 'CPF', 'E-mail', 'Telefone', 'Quantidade', 'Valor Total (R$)', 'Status', 'Tipo de Ingresso', 'Data da Compra'];
    const rows = filteredVendidos.map((v: any) => {
      const tipo = tipos.find((t: any) => t.id === v.tipo_ingresso_id);
      return [v.nome_comprador, v.cpf, v.email, v.telefone || '', v.quantidade, `R$ ${Number(v.valor_total).toFixed(2)}`, v.status, tipo?.nome || '-', new Date(v.created_at).toLocaleDateString('pt-BR')];
    });
    exportToXlsx(headers, rows, `ingressos_fadda_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Stats from lotes (price/quantity now live on lotes)
  const totalVendidos = vendidos.filter((v: any) => v.status !== 'cancelado').reduce((s: number, v: any) => s + v.quantidade, 0);
  const receitaTotal = vendidos.filter((v: any) => v.status === 'confirmado' || v.status === 'pago').reduce((s: number, v: any) => s + Number(v.valor_total), 0);
  const totalEstoque = lotes.reduce((s: number, l: any) => s + (l.quantidade_total || 0), 0);
  const totalVendidosLotes = lotes.reduce((s: number, l: any) => s + (l.quantidade_vendida || 0), 0);
  const totalDisponiveis = totalEstoque - totalVendidosLotes;
  const totalPendentes = vendidos.filter((v: any) => v.status === 'pendente').length;

  // Dynamic years from vendidos data
  const anosIngressos = [...new Set(vendidos.map((v: any) => new Date(v.created_at).getFullYear()))].sort((a, b) => b - a);

  const filteredVendidos = vendidos.filter((v: any) => {
    const matchStatus = filtroStatus === 'todos' || v.status === filtroStatus;
    const matchTipo = filtroTipo === 'todos' || v.tipo_ingresso_id === filtroTipo;
    const matchAno = filtroAno === 'todos' || new Date(v.created_at).getFullYear().toString() === filtroAno;
    const matchBusca = !busca || v.nome_comprador.toLowerCase().includes(busca.toLowerCase()) || v.email.toLowerCase().includes(busca.toLowerCase()) || v.cpf.includes(busca);
    return matchStatus && matchTipo && matchAno && matchBusca;
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
            <Link to="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-sans text-foreground font-medium flex items-center gap-1">
              <Ticket className="w-4 h-4 text-primary" /> Dashboard de Ingressos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-border font-sans"><Link to="/admin">← Admin</Link></Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border"><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Total Vendidos</p><Ticket className="w-4 h-4 text-primary" /></div>
            <p className="text-3xl font-bold text-foreground">{totalVendidos}</p>
          </CardContent></Card>
          <Card className="bg-card border-border"><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Em Estoque</p><PackageX className="w-4 h-4 text-blue-400" /></div>
            <p className="text-3xl font-bold text-foreground">{Math.max(0, totalDisponiveis)}</p>
            <p className="text-xs text-muted-foreground font-sans mt-1">de {totalEstoque} total</p>
          </CardContent></Card>
          <Card className="bg-card border-border"><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Receita Confirmada</p><DollarSign className="w-4 h-4 text-green-400" /></div>
            <p className="text-3xl font-bold text-primary">R$ {receitaTotal.toFixed(0)}</p>
          </CardContent></Card>
          <Card className="bg-card border-border"><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">Pendentes</p><Clock className="w-4 h-4 text-yellow-400" /></div>
            <p className="text-3xl font-bold text-foreground">{totalPendentes}</p>
          </CardContent></Card>
        </div>

        {/* Per tipo breakdown */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Vendas por Tipo de Ingresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tipos.filter((t: any) => t.ativo).map((tipo: any) => {
                const grupoLotes = lotes.filter((l: any) => l.grupo_id === tipo.grupo_id);
                const vendaTipo = vendidos.filter((v: any) => v.tipo_ingresso_id === tipo.id && v.status !== 'cancelado');
                const qtdVendida = vendaTipo.reduce((s: number, v: any) => s + (v.quantidade || 0), 0);
                const receita = vendaTipo.filter((v: any) => v.status === 'confirmado' || v.status === 'pago').reduce((s: number, v: any) => s + Number(v.valor_total || 0), 0);
                const totalTipo = grupoLotes.reduce((s: number, l: any) => s + (l.quantidade_total || 0), 0);
                const pct = totalTipo > 0 ? Math.round((qtdVendida / totalTipo) * 100) : 0;
                const grupo = grupos.find((g: any) => g.id === tipo.grupo_id);
                return (
                  <div key={tipo.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-sans font-semibold text-foreground text-sm">{tipo.nome}</p>
                        <p className="text-xs text-muted-foreground font-sans">{grupo?.nome || 'Sem grupo'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-sm text-foreground font-bold">{qtdVendida}/{totalTipo}</p>
                        <p className="text-xs text-primary font-sans">R$ {receita.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-gradient-gold h-2 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Buyers list */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <CardTitle className="font-serif text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Compradores
              </CardTitle>
              <Button onClick={exportExcel} variant="outline" size="sm" className="border-border font-sans flex items-center gap-1">
                <Download className="w-4 h-4" /> Exportar Excel
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <input className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm flex-1" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
              <select className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="todos">Todos status</option>
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="confirmado">Confirmado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <select className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos tipos</option>
                {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              <select className="px-3 py-2 rounded-lg bg-background border border-border text-foreground font-sans text-sm" value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
                <option value="todos">Todos os anos</option>
                {anosIngressos.map(ano => <option key={ano} value={ano.toString()}>{ano}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredVendidos.length === 0 ? (
              <p className="text-center text-muted-foreground font-sans py-8">Nenhum ingresso vendido.</p>
            ) : (
              <div className="space-y-2">
                {filteredVendidos.slice((pagina - 1) * ITEMS_POR_PAGINA, pagina * ITEMS_POR_PAGINA).map((v: any) => {
                  const tipo = tipos.find((t: any) => t.id === v.tipo_ingresso_id);
                  return (
                    <div key={v.id} className="p-4 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-sans font-semibold text-foreground">{v.nome_comprador}</p>
                        <p className="text-xs text-muted-foreground font-sans">{v.email} • CPF: {v.cpf}</p>
                        <p className="text-xs text-muted-foreground font-sans">{v.quantidade}x • {tipo?.nome || '-'} • {new Date(v.created_at).toLocaleDateString('pt-BR')}</p>
                        {(v.quantidade_validada || 0) > 0 && (
                          <p className="text-xs text-green-500 font-bold font-sans flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" /> {v.quantidade_validada}/{v.quantidade} utilizados
                          </p>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                        <p className="font-bold text-primary font-sans">R$ {Number(v.valor_total).toFixed(2)}</p>
                        <Badge className={`${statusColors[v.status]} border text-xs flex items-center gap-1`}>
                          {statusIcons[v.status]} {v.status}
                        </Badge>
                        <div className="flex gap-1">
                          {(v.status === 'confirmado' || v.status === 'pago') && (v.quantidade_validada || 0) < v.quantidade && (
                            <Button size="sm" onClick={() => validarIngresso(v)} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-2 py-1 h-7 font-sans">Dar Baixa</Button>
                          )}
                          {(v.status === 'pago' || v.status === 'pendente') && (
                            <Button size="sm" onClick={() => updateStatus(v.id, 'confirmado')} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7 font-sans">Confirmar</Button>
                          )}
                          {v.status !== 'cancelado' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(v.id, 'cancelado')} className="border-red-600 text-red-400 hover:bg-red-600/10 text-xs px-2 py-1 h-7 font-sans">Cancelar</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {filteredVendidos.length > ITEMS_POR_PAGINA && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground font-sans">
                  {(pagina - 1) * ITEMS_POR_PAGINA + 1}–{Math.min(pagina * ITEMS_POR_PAGINA, filteredVendidos.length)} de {filteredVendidos.length}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)} className="border-border font-sans">Anterior</Button>
                  <Button variant="outline" size="sm" disabled={pagina * ITEMS_POR_PAGINA >= filteredVendidos.length} onClick={() => setPagina(p => p + 1)} className="border-border font-sans">Próxima</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminIngressos;
