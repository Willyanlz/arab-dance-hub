import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Ticket, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface Grupo {
  id: string;
  nome: string;
  created_at: string;
}

interface Lote {
  id: string;
  grupo_id: string | null;
  numero: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean | null;
}

interface TipoIngresso {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  grupo_id: string | null;
  quantidade_total: number;
}

export const ConfigIngressos = () => {
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [expandedGrupo, setExpandedGrupo] = useState<string | null>(null);

  // New grupo
  const [novoGrupoNome, setNovoGrupoNome] = useState('');

  // New lote (per grupo)
  const [novoLote, setNovoLote] = useState<Record<string, { numero: number; nome: string; data_inicio: string; data_fim: string; preco: number; quantidade_total: number }>>({});

  // New tipo
  const [novoTipo, setNovoTipo] = useState({ nome: '', grupo_id: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [gruposRes, lotesRes, tiposRes] = await Promise.all([
      (supabase.from('lote_ingresso_grupos') as any).select('*').order('created_at'),
      supabase.from('lotes_ingresso').select('*').order('numero'),
      supabase.from('tipos_ingresso').select('*').order('created_at'),
    ]);
    setGrupos((gruposRes.data || []) as Grupo[]);
    setLotes((lotesRes.data || []) as Lote[]);
    setTipos((tiposRes.data || []) as TipoIngresso[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Grupo CRUD ──
  const criarGrupo = async () => {
    if (!novoGrupoNome.trim()) {
      toast({ title: 'Preencha o nome do grupo de lotes', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase.from('lote_ingresso_grupos') as any).insert({ nome: novoGrupoNome.trim() });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Grupo criado!' });
    setNovoGrupoNome('');
    loadData();
  };

  const deleteGrupo = async (id: string) => {
    if (!confirm('Remover este grupo e todos seus lotes?')) return;
    await (supabase.from('lote_ingresso_grupos') as any).delete().eq('id', id);
    toast({ title: 'Grupo removido' });
    loadData();
  };

  // ── Lote CRUD ──
  const getNovoLote = (grupoId: string) => novoLote[grupoId] || { numero: 1, nome: '', data_inicio: '', data_fim: '', preco: 0, quantidade_total: 0 };
  const setNovoLoteField = (grupoId: string, field: string, value: any) => {
    setNovoLote(prev => ({ ...prev, [grupoId]: { ...getNovoLote(grupoId), [field]: value } }));
  };

  const criarLote = async (grupoId: string) => {
    const l = getNovoLote(grupoId);
    if (!l.nome || !l.data_inicio || !l.data_fim) {
      toast({ title: 'Preencha nome e datas do lote', variant: 'destructive' });
      return;
    }
    if (l.preco <= 0) {
      toast({ title: 'Preencha o valor do ingresso no lote', variant: 'destructive' });
      return;
    }
    if (l.quantidade_total <= 0) {
      toast({ title: 'Preencha a quantidade de ingressos no lote', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('lotes_ingresso').insert({
      grupo_id: grupoId,
      numero: Number(l.numero),
      nome: l.nome,
      data_inicio: l.data_inicio,
      data_fim: l.data_fim,
      preco: Number(l.preco),
      quantidade_total: Number(l.quantidade_total),
      ativo: true,
    } as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Lote criado!' });
    setNovoLote(prev => {
      const next = { ...prev };
      delete next[grupoId];
      return next;
    });
    loadData();
  };

  const deleteLote = async (id: string) => {
    await supabase.from('lotes_ingresso').delete().eq('id', id);
    toast({ title: 'Lote removido' });
    loadData();
  };

  const toggleLote = async (id: string, ativo: boolean) => {
    await supabase.from('lotes_ingresso').update({ ativo } as any).eq('id', id);
    loadData();
  };

  // ── Tipo CRUD ──
  const criarTipo = async () => {
    if (!novoTipo.nome.trim()) {
      toast({ title: 'Preencha o nome do ingresso', variant: 'destructive' });
      return;
    }
    if (!novoTipo.grupo_id) {
      toast({ title: 'Selecione um grupo de lotes', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('tipos_ingresso').insert({
      nome: novoTipo.nome.trim(),
      grupo_id: novoTipo.grupo_id,
    } as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Ingresso criado!' });
    setNovoTipo({ nome: '', grupo_id: '' });
    loadData();
  };

  const deleteTipo = async (id: string) => {
    await supabase.from('tipos_ingresso').update({ ativo: false } as any).eq('id', id);
    toast({ title: 'Ingresso desativado' });
    loadData();
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando ingressos...</div>;

  return (
    <div className="space-y-6">
      {/* ── Tipos de Ingresso ── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5 text-primary" /> Tipos de Ingresso
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Cada tipo de ingresso é vinculado a um grupo de lotes. O preço e quantidade são definidos em cada lote.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {tipos.map((t) => {
              const grupo = grupos.find(g => g.id === t.grupo_id);
              return (
                <div key={t.id} className={`flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg border ${t.ativo ? 'bg-muted border-border' : 'bg-muted/30 border-border/50 opacity-60'}`}>
                  <div className="flex-1">
                    <p className="font-sans font-medium text-foreground">{t.nome} {!t.ativo && <span className="text-xs text-destructive">(desativado)</span>}</p>
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      Grupo: {grupo?.nome || <span className="text-destructive">Sem grupo</span>}
                    </p>
                  </div>
                  {t.ativo && (
                    <Button variant="ghost" size="icon" onClick={() => deleteTipo(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
            {tipos.length === 0 && <p className="text-sm text-muted-foreground font-sans">Nenhum tipo de ingresso cadastrado.</p>}
          </div>

          <div className="p-4 bg-muted/30 rounded-lg space-y-3 border border-dashed border-border">
            <p className="text-sm font-sans font-semibold text-foreground">Novo Tipo de Ingresso</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nome do Ingresso *</Label>
                <Input value={novoTipo.nome} onChange={e => setNovoTipo({ ...novoTipo, nome: e.target.value })} className="bg-background border-border" placeholder="Ex: Ingresso Geral" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Grupo de Lotes *</Label>
                <select
                  value={novoTipo.grupo_id}
                  onChange={e => setNovoTipo({ ...novoTipo, grupo_id: e.target.value })}
                  required
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm font-sans text-foreground"
                >
                  <option value="">Selecione um grupo *</option>
                  {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={criarTipo} className="bg-gradient-gold text-primary-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Criar Ingresso</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Grupos de Lotes ── */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Grupos de Lotes
          </CardTitle>
          <CardDescription className="text-xs font-sans">
            Cada grupo contém vários lotes com datas, preço e quantidade. Vincule tipos de ingresso a grupos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create grupo */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Nome do Grupo</Label>
              <Input value={novoGrupoNome} onChange={e => setNovoGrupoNome(e.target.value)} className="bg-background border-border" placeholder="Ex: Lotes Ingresso Geral" />
            </div>
            <Button onClick={criarGrupo} className="bg-gradient-gold text-primary-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Criar Grupo</Button>
          </div>

          {/* Existing grupos */}
          <div className="space-y-3">
            {grupos.map(grupo => {
              const grupoLotes = lotes.filter(l => l.grupo_id === grupo.id).sort((a, b) => a.numero - b.numero);
              const grupoTipos = tipos.filter(t => t.grupo_id === grupo.id && t.ativo);
              const isExpanded = expandedGrupo === grupo.id;
              const nl = getNovoLote(grupo.id);

              return (
                <div key={grupo.id} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setExpandedGrupo(isExpanded ? null : grupo.id)}
                  >
                    <div>
                      <p className="font-sans font-semibold text-foreground">{grupo.nome}</p>
                      <p className="text-xs text-muted-foreground font-sans">
                        {grupoLotes.length} lote(s) • {grupoTipos.length} ingresso(s) vinculado(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); deleteGrupo(grupo.id); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-4 bg-card">
                      {/* Tipos vinculados */}
                      {grupoTipos.length > 0 && (
                        <div className="text-xs text-muted-foreground font-sans">
                          <span className="font-semibold">Ingressos vinculados:</span>{' '}
                          {grupoTipos.map(t => t.nome).join(', ')}
                        </div>
                      )}

                      {/* Existing lotes */}
                      <div className="space-y-2">
                        {grupoLotes.map(l => (
                          <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-sans font-medium text-foreground text-sm">
                                {l.nome} <span className="text-muted-foreground text-xs">#{l.numero}</span>
                              </p>
                              <p className="text-xs text-muted-foreground font-sans">
                                {l.data_inicio} → {l.data_fim} • R$ {Number(l.preco || 0).toFixed(2)} • {l.quantidade_vendida || 0}/{l.quantidade_total} vendidos
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch checked={l.ativo ?? false} onCheckedChange={(v) => toggleLote(l.id, v)} />
                              <span className="text-xs text-muted-foreground font-sans">{l.ativo ? 'Ativo' : 'Inativo'}</span>
                              <Button variant="ghost" size="icon" onClick={() => deleteLote(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </div>
                        ))}
                        {grupoLotes.length === 0 && <p className="text-xs text-muted-foreground font-sans">Nenhum lote neste grupo.</p>}
                      </div>

                      {/* New lote form */}
                      <div className="p-3 bg-muted/20 rounded-lg space-y-3 border border-dashed border-border">
                        <p className="text-xs font-sans font-semibold text-foreground">Novo Lote neste Grupo</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">Nome *</Label>
                            <Input value={nl.nome} onChange={e => setNovoLoteField(grupo.id, 'nome', e.target.value)} className="bg-background border-border h-9 text-sm" placeholder="1º Lote" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Nº</Label>
                            <Input type="number" value={nl.numero} onChange={e => setNovoLoteField(grupo.id, 'numero', Number(e.target.value))} className="bg-background border-border h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Preço (R$) *</Label>
                            <Input type="number" step="0.01" value={nl.preco} onChange={e => setNovoLoteField(grupo.id, 'preco', Number(e.target.value))} className="bg-background border-border h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Qtd Ingressos *</Label>
                            <Input type="number" value={nl.quantidade_total} onChange={e => setNovoLoteField(grupo.id, 'quantidade_total', Number(e.target.value))} className="bg-background border-border h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Início *</Label>
                            <Input type="date" value={nl.data_inicio} onChange={e => setNovoLoteField(grupo.id, 'data_inicio', e.target.value)} className="bg-background border-border h-9 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Fim *</Label>
                            <Input type="date" value={nl.data_fim} onChange={e => setNovoLoteField(grupo.id, 'data_fim', e.target.value)} className="bg-background border-border h-9 text-sm" />
                          </div>
                        </div>
                        <Button size="sm" onClick={() => criarLote(grupo.id)} className="bg-gradient-gold text-primary-foreground font-sans">
                          <Plus className="w-3 h-3 mr-1" /> Criar Lote
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {grupos.length === 0 && <p className="text-sm text-muted-foreground font-sans">Nenhum grupo de lotes criado.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
