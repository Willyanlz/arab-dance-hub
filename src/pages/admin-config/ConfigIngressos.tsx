import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

type Grupo = { id: string; nome: string; created_at: string };
type Lote = {
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
};
type TipoIngresso = {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean;
  lote_grupo_id: string | null;
};

export const ConfigIngressos = () => {
  const [loading, setLoading] = useState(true);
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState<string>('');

  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const [novoTipo, setNovoTipo] = useState({ nome: '', descricao: '', quantidade_total: 0, lote_grupo_id: '' });
  const [novoLote, setNovoLote] = useState({
    numero: 1,
    nome: '',
    data_inicio: '',
    data_fim: '',
    preco: 0,
    quantidade_total: 0,
    ativo: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tiposRes, gruposRes, lotesRes] = await Promise.all([
      supabase.from('tipos_ingresso').select('*').order('created_at'),
      (supabase.from('lote_ingresso_grupos') as any).select('*').order('created_at'),
      (supabase.from('lotes_ingresso') as any).select('*').order('numero'),
    ]);
    setTipos((tiposRes.data || []) as any);
    setGrupos((gruposRes.data || []) as any);
    setLotes((lotesRes.data || []) as any);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!grupoSelecionado && grupos.length > 0) {
      setGrupoSelecionado(grupos[0].id);
    }
  }, [grupos, grupoSelecionado]);

  const lotesDoGrupo = useMemo(
    () => lotes.filter(l => l.grupo_id === grupoSelecionado).sort((a, b) => a.numero - b.numero),
    [lotes, grupoSelecionado]
  );

  useEffect(() => {
    setNovoLote(prev => ({ ...prev, numero: (lotesDoGrupo.at(-1)?.numero || 0) + 1 }));
  }, [grupoSelecionado, lotesDoGrupo]);

  const criarGrupo = async () => {
    if (!novoGrupoNome.trim()) return;
    const { error } = await (supabase.from('lote_ingresso_grupos') as any).insert({ nome: novoGrupoNome.trim() });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Grupo criado!' });
    setNovoGrupoNome('');
    loadData();
  };

  const deleteGrupo = async (id: string) => {
    await (supabase.from('lote_ingresso_grupos') as any).delete().eq('id', id);
    toast({ title: 'Grupo removido' });
    loadData();
  };

  const criarTipo = async () => {
    if (!novoTipo.nome.trim() || !novoTipo.lote_grupo_id) {
      toast({ title: 'Preencha nome e grupo de lotes', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('tipos_ingresso').insert({
      nome: novoTipo.nome.trim(),
      descricao: novoTipo.descricao || null,
      quantidade_total: Number(novoTipo.quantidade_total || 0),
      lote_grupo_id: novoTipo.lote_grupo_id,
    } as any);
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: '✅ Ingresso criado!' });
      setNovoTipo({ nome: '', descricao: '', quantidade_total: 0, lote_grupo_id: '' });
      loadData();
    }
  };

  const deleteTipo = async (id: string) => {
    // Não deletar se já houve vendas; em vez disso, desativar (soft delete)
    const { error } = await supabase.from('tipos_ingresso').update({ ativo: false } as any).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Ingresso desativado' });
    loadData();
  };

  const criarLote = async () => {
    if (!grupoSelecionado || !novoLote.nome || !novoLote.data_inicio || !novoLote.data_fim) {
      toast({ title: 'Preencha nome e datas do lote', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase.from('lotes_ingresso') as any).insert({
      grupo_id: grupoSelecionado,
      numero: Number(novoLote.numero),
      nome: novoLote.nome,
      data_inicio: novoLote.data_inicio,
      data_fim: novoLote.data_fim,
      preco: Number(novoLote.preco || 0),
      quantidade_total: Number(novoLote.quantidade_total || 0),
      ativo: !!novoLote.ativo,
    });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: '✅ Lote criado!' });
      setNovoLote({ numero: novoLote.numero + 1, nome: '', data_inicio: '', data_fim: '', preco: 0, quantidade_total: 0, ativo: true });
      loadData();
    }
  };

  const deleteLote = async (id: string) => {
    await (supabase.from('lotes_ingresso') as any).delete().eq('id', id);
    toast({ title: 'Lote removido' });
    loadData();
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando ingressos...</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg">Grupos de Lotes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input value={novoGrupoNome} onChange={e => setNovoGrupoNome(e.target.value)} placeholder="Ex: Lote Ingresso Geral" className="bg-background" />
            <Button onClick={criarGrupo} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar grupo</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {grupos.map(g => (
              <div key={g.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${grupoSelecionado === g.id ? 'border-gold/60 bg-muted/30' : 'border-border bg-muted/10'}`}>
                <button type="button" className="text-sm font-sans text-foreground" onClick={() => setGrupoSelecionado(g.id)}>{g.nome}</button>
                <Button variant="ghost" size="icon" onClick={() => deleteGrupo(g.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg">Lotes do Grupo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!grupoSelecionado ? (
            <p className="text-sm text-muted-foreground font-sans">Crie e selecione um grupo para configurar lotes.</p>
          ) : (
            <>
              <div className="space-y-2">
                {lotesDoGrupo.map(l => (
                  <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-sans font-medium text-foreground text-sm">{l.nome} <span className="text-muted-foreground text-xs">#{l.numero}</span></p>
                      <p className="text-xs text-muted-foreground font-sans">{l.data_inicio} → {l.data_fim}</p>
                      <p className="text-xs text-muted-foreground font-sans">R$ {Number(l.preco || 0).toFixed(2)} • {l.quantidade_vendida}/{l.quantidade_total}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteLote(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                {lotesDoGrupo.length === 0 && (
                  <p className="text-sm text-muted-foreground font-sans">Nenhum lote cadastrado neste grupo ainda.</p>
                )}
              </div>

              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <p className="text-sm font-sans font-semibold text-foreground">Criar lote</p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                  <div className="md:col-span-2">
                    <Label className="text-foreground">Nome</Label>
                    <Input value={novoLote.nome} onChange={e => setNovoLote({ ...novoLote, nome: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <Label className="text-foreground">Início</Label>
                    <Input type="date" value={novoLote.data_inicio} onChange={e => setNovoLote({ ...novoLote, data_inicio: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <Label className="text-foreground">Expira</Label>
                    <Input type="date" value={novoLote.data_fim} onChange={e => setNovoLote({ ...novoLote, data_fim: e.target.value })} className="bg-background" />
                  </div>
                  <div>
                    <Label className="text-foreground">Preço (R$)</Label>
                    <Input type="number" value={novoLote.preco} onChange={e => setNovoLote({ ...novoLote, preco: Number(e.target.value) })} className="bg-background" />
                  </div>
                  <div>
                    <Label className="text-foreground">Qtd</Label>
                    <Input type="number" value={novoLote.quantidade_total} onChange={e => setNovoLote({ ...novoLote, quantidade_total: Number(e.target.value) })} className="bg-background" />
                  </div>
                </div>
                <Button onClick={criarLote} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar lote</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg">Tipos de Ingresso</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">Nome *</Label>
              <Input value={novoTipo.nome} onChange={e => setNovoTipo({ ...novoTipo, nome: e.target.value })} className="bg-background" />
            </div>
            <div>
              <Label className="text-foreground">Quantidade total *</Label>
              <Input type="number" value={novoTipo.quantidade_total} onChange={e => setNovoTipo({ ...novoTipo, quantidade_total: Number(e.target.value) })} className="bg-background" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-foreground">Grupo de lotes *</Label>
              <select
                value={novoTipo.lote_grupo_id}
                onChange={e => setNovoTipo({ ...novoTipo, lote_grupo_id: e.target.value })}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Selecione...</option>
                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={criarTipo} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar ingresso</Button>

          <div className="space-y-3 pt-2">
            {tipos.map(t => {
              const grupo = grupos.find(g => g.id === t.lote_grupo_id);
              return (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">Grupo: {grupo?.nome || '-'}</p>
                    <p className="text-xs text-muted-foreground">Vendidos: {t.quantidade_vendida}/{t.quantidade_total}</p>
                    {!t.ativo && <p className="text-xs text-destructive font-sans mt-1">Desativado</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTipo(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
