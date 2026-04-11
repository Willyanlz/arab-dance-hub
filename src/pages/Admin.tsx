import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Download, Check, Search, Eye, X, Edit2, Users, Trophy, Star, BookOpen, UserPlus } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pago: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

const TIPO_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  competicao: { label: 'Competição', icon: Trophy, color: 'text-gold-light bg-primary/10' },
  mostra: { label: 'Mostra', icon: Star, color: 'text-burgundy bg-secondary/10' },
  workshop: { label: 'Workshop', icon: BookOpen, color: 'text-primary bg-accent/10' },
};

const CATEGORIAS_LABEL: Record<string, string> = {
  solo: 'Solo',
  dupla_trio: 'Dupla/Trio',
  grupo: 'Grupo',
};

const Admin = () => {
  const { user, loading: authLoading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail dialog
  const [selected, setSelected] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editObs, setEditObs] = useState('');
  const [saving, setSaving] = useState(false);

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

    const userIds = [...new Set(inscData.map((i: any) => i.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id,nome,email,cpf,telefone,is_aluna_jalilete,participante_anterior')
      .in('user_id', userIds);

    const inscIds = inscData.map((i: any) => i.id);
    const { data: participantesData } = await supabase
      .from('participantes')
      .select('inscricao_id,nome,cpf,email,telefone')
      .in('inscricao_id', inscIds);

    const { data: workshopsData } = await supabase
      .from('inscricao_workshops')
      .select('inscricao_id,workshop_id,workshops_config(nome,professor)')
      .in('inscricao_id', inscIds);

    const participantesMap = new Map<string, any[]>();
    participantesData?.forEach((p: any) => {
      const list = participantesMap.get(p.inscricao_id) || [];
      list.push(p);
      participantesMap.set(p.inscricao_id, list);
    });

    const workshopsMap = new Map<string, any[]>();
    workshopsData?.forEach((w: any) => {
      const list = workshopsMap.get(w.inscricao_id) || [];
      list.push(w);
      workshopsMap.set(w.inscricao_id, list);
    });

    const profileMap = new Map(profilesData?.map((p: any) => [p.user_id, p]) || []);
    const data = inscData.map((i: any) => ({
      ...i,
      profiles: profileMap.get(i.user_id) || null,
      participantes_lista: participantesMap.get(i.id) || [],
      workshops_lista: workshopsMap.get(i.id) || [],
    }));

    setInscricoes(data);
    setLoading(false);
  };

  const confirmarPagamento = async (id: string) => {
    await supabase.from('inscricoes').update({ status: 'confirmado' }).eq('id', id);
    await supabase.from('pagamentos').update({ status: 'confirmado' }).eq('inscricao_id', id);
    toast({ title: '✅ Pagamento confirmado!' });
    loadInscricoes();
  };

  const marcarPago = async (id: string) => {
    await supabase.from('inscricoes').update({ status: 'pago' }).eq('id', id);
    await supabase.from('pagamentos').update({ status: 'pago' }).eq('inscricao_id', id);
    toast({ title: 'Marcado como pago!' });
    loadInscricoes();
  };

  const cancelarInscricao = async (id: string) => {
    await supabase.from('inscricoes').update({ status: 'cancelado' }).eq('id', id);
    toast({ title: 'Inscrição cancelada', variant: 'destructive' });
    loadInscricoes();
    setDetailOpen(false);
  };

  const saveEdits = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('inscricoes').update({ status: editStatus as any, observacoes: editObs }).eq('id', selected.id);
    toast({ title: '✅ Inscrição atualizada' });
    setEditMode(false);
    setSaving(false);
    loadInscricoes();
  };

  const openDetail = (insc: any) => {
    setSelected(insc);
    setEditStatus(insc.status);
    setEditObs(insc.observacoes || '');
    setEditMode(false);
    setDetailOpen(true);
  };

  const filteredInscricoes = inscricoes.filter(i => {
    if (filtroTipo !== 'all' && i.tipo_inscricao !== filtroTipo) return false;
    if (filtroStatus !== 'all' && i.status !== filtroStatus) return false;
    if (busca) {
      const s = busca.toLowerCase();
      return (
        i.nome_coreografia?.toLowerCase().includes(s) ||
        i.profiles?.nome?.toLowerCase().includes(s) ||
        i.profiles?.email?.toLowerCase().includes(s) ||
        i.profiles?.cpf?.includes(s)
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Tipo','Nome','Email','CPF','Telefone','Categoria','Modalidade','Coreografia','Status','Período','Valor Final','Lote','Como Soube','Data','Participantes (Nome|CPF)'];
    const rows = filteredInscricoes.map(i => [
      i.tipo_inscricao || '',
      i.profiles?.nome || '',
      i.profiles?.email || '',
      i.profiles?.cpf || '',
      i.profiles?.telefone || '',
      CATEGORIAS_LABEL[i.categoria] || i.categoria,
      i.modalidade,
      i.nome_coreografia,
      i.status,
      i.periodo || '',
      i.valor_final || 0,
      i.lote_id || i.lote_mostra_id || i.lote_workshop_id || '',
      i.como_soube || '',
      new Date(i.created_at).toLocaleDateString('pt-BR'),
      (i.participantes_lista || []).map((p: any) => `${p.nome}|${p.cpf || ''}`).join('; '),
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inscricoes_fadda.csv'; a.click();
  };

  const stats = {
    total: inscricoes.length,
    pendentes: inscricoes.filter(i => i.status === 'pendente').length,
    confirmadas: inscricoes.filter(i => i.status === 'confirmado').length,
    receita: inscricoes.filter(i => i.status !== 'cancelado').reduce((s, i) => s + Number(i.valor_final || 0), 0),
    competicao: inscricoes.filter(i => i.tipo_inscricao === 'competicao').length,
    mostra: inscricoes.filter(i => i.tipo_inscricao === 'mostra').length,
    workshop: inscricoes.filter(i => i.tipo_inscricao === 'workshop').length,
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-sans">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent text-accent-foreground font-sans">Admin</Badge>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="border-border text-foreground font-sans">
              <Link to="/admin/config">⚙️ Configurações</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground font-sans">Sair</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        {/* Title + actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl font-serif font-bold text-foreground">Gerenciamento de Inscrições</h1>
          <div className="flex gap-2">
            <Button asChild size="sm" className="bg-gradient-gold text-primary-foreground font-sans">
              <Link to="/inscricao"><UserPlus className="w-4 h-4 mr-1" /> Nova Inscrição</Link>
            </Button>
            <Button onClick={exportCSV} variant="outline" size="sm" className="border-border text-foreground font-sans">
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Pendentes', value: stats.pendentes },
            { label: 'Confirmadas', value: stats.confirmadas },
            { label: 'Receita', value: `R$ ${stats.receita.toFixed(2)}` },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide">{s.label}</p>
                <p className="text-xl font-bold text-foreground font-sans mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Competição', value: stats.competicao, icon: Trophy },
            { label: 'Mostra', value: stats.mostra, icon: Star },
            { label: 'Workshop', value: stats.workshop, icon: BookOpen },
          ].map(s => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-sans">{s.label}</p>
                  <p className="text-lg font-bold text-foreground font-sans">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="Buscar por nome, email, CPF..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9 bg-background border-border text-foreground" />
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="competicao">Competição</SelectItem>
                  <SelectItem value="mostra">Mostra</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
                  <TableHead className="text-muted-foreground font-sans">Tipo</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Participante</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Modalidade / Coreografia</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Categoria</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Valor</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Status</TableHead>
                  <TableHead className="text-muted-foreground font-sans">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscricoes.map(i => {
                  const tipo = TIPO_LABELS[i.tipo_inscricao] || TIPO_LABELS['competicao'];
                  return (
                    <TableRow key={i.id} className="border-border hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-sans ${tipo.color}`}>
                          <tipo.icon className="w-3 h-3" />
                          {tipo.label}
                        </div>
                      </TableCell>
                      <TableCell className="font-sans">
                        <div>
                          <p className="font-medium text-foreground">{i.profiles?.nome || '—'}</p>
                          <p className="text-xs text-muted-foreground">{i.profiles?.email}</p>
                          {i.participantes_lista?.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-primary" />
                              <p className="text-xs text-primary">{i.participantes_lista.length + 1} integrantes</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-sm">
                        <p className="text-foreground">{i.modalidade}</p>
                        <p className="text-xs text-muted-foreground">{i.nome_coreografia}</p>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-foreground">
                        {CATEGORIAS_LABEL[i.categoria] || i.categoria}
                      </TableCell>
                      <TableCell className="font-sans font-medium text-foreground">
                        R$ {Number(i.valor_final || 0).toFixed(2)}
                        {i.desconto_percentual > 0 && <p className="text-xs text-primary">-{i.desconto_percentual}%</p>}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border font-sans ${STATUS_COLORS[i.status] || 'bg-muted text-muted-foreground'}`}>
                          {i.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(i)} className="text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {i.status === 'pendente' && (
                            <Button size="sm" variant="outline" onClick={() => marcarPago(i.id)} className="text-xs border-border text-foreground font-sans">Pago</Button>
                          )}
                          {(i.status === 'pendente' || i.status === 'pago') && (
                            <Button size="sm" onClick={() => confirmarPagamento(i.id)} className="text-xs bg-gradient-gold text-primary-foreground font-sans">
                              <Check className="w-3 h-3 mr-1" /> OK
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {filteredInscricoes.length === 0 && (
            <div className="p-10 text-center text-muted-foreground font-sans">
              <p>Nenhuma inscrição encontrada.</p>
            </div>
          )}
        </Card>
      </main>

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-foreground flex items-center gap-2">
              Detalhes da Inscrição
              {selected && (
                <Badge className={`text-xs border font-sans ${STATUS_COLORS[selected.status] || ''}`}>
                  {selected?.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 font-sans text-sm">
              {/* Tipo e Categoria */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`${TIPO_LABELS[selected.tipo_inscricao]?.color || ''} border-0`}>
                  {TIPO_LABELS[selected.tipo_inscricao]?.label || selected.tipo_inscricao}
                </Badge>
                <Badge variant="outline" className="border-border text-foreground">
                  {CATEGORIAS_LABEL[selected.categoria] || selected.categoria}
                </Badge>
              </div>

              {/* Dados do responsável */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground mb-2">Responsável pela Inscrição</p>
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  <div><span className="text-muted-foreground">Nome: </span>{selected.profiles?.nome || '—'}</div>
                  <div><span className="text-muted-foreground">Email: </span>{selected.profiles?.email || '—'}</div>
                  <div><span className="text-muted-foreground">CPF: </span>{selected.profiles?.cpf || '—'}</div>
                  <div><span className="text-muted-foreground">Tel: </span>{selected.profiles?.telefone || '—'}</div>
                  {selected.profiles?.is_aluna_jalilete && <div className="col-span-2"><Badge className="text-xs bg-primary/10 text-primary border-0">Aluna Jalilete (-10%)</Badge></div>}
                  {selected.profiles?.participante_anterior && <div className="col-span-2"><Badge className="text-xs bg-muted text-muted-foreground border border-border">Participante anterior (-5%)</Badge></div>}
                </div>
              </div>

              {/* Dados da apresentação */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="font-semibold text-foreground mb-2">Dados da Apresentação</p>
                <div className="grid grid-cols-2 gap-2 text-foreground">
                  {selected.modalidade && <div className="col-span-2"><span className="text-muted-foreground">Modalidade: </span>{selected.modalidade}</div>}
                  {selected.nome_coreografia && <div className="col-span-2"><span className="text-muted-foreground">Coreografia: </span>{selected.nome_coreografia}</div>}
                  {selected.nome_escola && <div><span className="text-muted-foreground">Escola: </span>{selected.nome_escola}</div>}
                  {selected.professora && <div><span className="text-muted-foreground">Professora: </span>{selected.professora}</div>}
                  {selected.nome_artistico && <div><span className="text-muted-foreground">Nome Artístico: </span>{selected.nome_artistico}</div>}
                  {selected.tipo_musica && <div><span className="text-muted-foreground">Música: </span>{selected.tipo_musica}</div>}
                  {selected.periodo && <div><span className="text-muted-foreground">Período: </span>{selected.periodo === 'manha' ? 'Manhã' : selected.periodo === 'tarde' ? 'Tarde' : 'S/ preferência'}</div>}
                  {selected.tipo_participacao && <div><span className="text-muted-foreground">Tipo Participação: </span>{selected.tipo_participacao}</div>}
                  {selected.sugestao_horario && <div><span className="text-muted-foreground">Sugestão Horário: </span>{selected.sugestao_horario}</div>}
                  {selected.tipo_compra_workshop && <div><span className="text-muted-foreground">Compra Workshop: </span>{selected.tipo_compra_workshop}</div>}
                  {selected.como_soube && <div className="col-span-2"><span className="text-muted-foreground">Como soube: </span>{selected.como_soube}</div>}
                  {selected.extra_harem && <div className="col-span-2"><Badge className="text-xs bg-burgundy/10 text-burgundy border-0">✨ Harem das Fadas</Badge></div>}
                </div>
              </div>

              {/* Workshops selecionados */}
              {selected.workshops_lista?.length > 0 && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold text-foreground mb-2">Workshops Selecionados</p>
                  {selected.workshops_lista.map((w: any, i: number) => (
                    <p key={i} className="text-foreground">• {w.workshops_config?.nome} ({w.workshops_config?.professor})</p>
                  ))}
                </div>
              )}

              {/* Todos os participantes */}
              {(selected.participantes_lista?.length > 0) && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary" /> Todos os Participantes
                  </p>
                  {/* Responsável */}
                  <div className="p-2 bg-primary/5 rounded mb-1 border border-gold/20">
                    <p className="font-medium text-foreground">1. {selected.profiles?.nome} <span className="text-muted-foreground font-normal text-xs">(responsável)</span></p>
                    <p className="text-xs text-muted-foreground">CPF: {selected.profiles?.cpf || '—'}</p>
                  </div>
                  {selected.participantes_lista.map((p: any, i: number) => (
                    <div key={i} className="p-2 bg-background rounded mb-1 border border-border">
                      <p className="font-medium text-foreground">{i + 2}. {p.nome}</p>
                      <p className="text-xs text-muted-foreground">CPF: {p.cpf || '—'}{p.email ? ` · ${p.email}` : ''}{p.telefone ? ` · ${p.telefone}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Financeiro */}
              <div className="bg-muted rounded-lg p-4">
                <p className="font-semibold text-foreground mb-2">Financeiro</p>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor base:</span><span className="text-foreground">R$ {Number(selected.valor_total || 0).toFixed(2)}</span></div>
                {selected.desconto_percentual > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Desconto:</span><span className="text-primary">-{selected.desconto_percentual}%</span></div>}
                <div className="flex justify-between font-bold"><span className="text-foreground">Total:</span><span className="text-primary">R$ {Number(selected.valor_final || 0).toFixed(2)}</span></div>
              </div>

              {/* Edit mode */}
              {editMode ? (
                <div className="space-y-3 border border-gold/30 rounded-lg p-4">
                  <p className="font-semibold text-foreground">✏️ Editar Inscrição</p>
                  <div>
                    <Label className="text-foreground">Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Observações</Label>
                    <Textarea value={editObs} onChange={e => setEditObs(e.target.value)} className="bg-background border-border text-foreground" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditMode(false)} className="border-border text-foreground font-sans">Cancelar</Button>
                    <Button onClick={saveEdits} disabled={saving} className="bg-gradient-gold text-primary-foreground font-sans">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setEditMode(true)} variant="outline" className="border-border text-foreground font-sans">
                    <Edit2 className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  {selected.status !== 'cancelado' && (
                    <Button onClick={() => cancelarInscricao(selected.id)} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 font-sans">
                      <X className="w-4 h-4 mr-1" /> Cancelar Inscrição
                    </Button>
                  )}
                  {selected.status === 'pendente' && (
                    <Button onClick={() => { confirmarPagamento(selected.id); setDetailOpen(false); }} className="bg-gradient-gold text-primary-foreground font-sans">
                      <Check className="w-4 h-4 mr-1" /> Confirmar Pagamento
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
