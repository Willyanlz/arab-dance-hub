import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

export const ConfigIngressos = () => {
  const [loading, setLoading] = useState(true);
  const [tiposIngresso, setTiposIngresso] = useState<any[]>([]);
  const [lotesIngresso, setLotesIngresso] = useState<any[]>([]);
  const [novoIngresso, setNovoIngresso] = useState({ nome: '', descricao: '', preco: 0, quantidade_total: 0, lote_ingresso_id: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ingRes, loteRes] = await Promise.all([
      supabase.from('tipos_ingresso').select('*').order('created_at'),
      (supabase.from('lotes_ingresso') as any).select('*').order('numero')
    ]);
    setTiposIngresso(ingRes.data || []);
    setLotesIngresso(loteRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const criarIngresso = async () => {
    if (!novoIngresso.nome) return;
    const { error } = await supabase.from('tipos_ingresso').insert({
      nome: novoIngresso.nome,
      descricao: novoIngresso.descricao,
      preco: novoIngresso.preco,
      quantidade_total: novoIngresso.quantidade_total,
      lote_ingresso_id: novoIngresso.lote_ingresso_id || null
    } as any);
    
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else {
      toast({ title: '✅ Ingresso criado!' });
      setNovoIngresso({ nome: '', descricao: '', preco: 0, quantidade_total: 0, lote_ingresso_id: '' });
      loadData();
    }
  };

  const deleteIngresso = async (id: string) => {
    await supabase.from('tipos_ingresso').delete().eq('id', id);
    toast({ title: 'Ingresso removido' });
    loadData();
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando ingressos...</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg">Criar Tipo de Ingresso</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-foreground">Nome *</Label><Input value={novoIngresso.nome} onChange={e => setNovoIngresso({ ...novoIngresso, nome: e.target.value })} className="bg-background" /></div>
            <div><Label className="text-foreground">Preço (R$)</Label><Input type="number" value={novoIngresso.preco} onChange={e => setNovoIngresso({ ...novoIngresso, preco: Number(e.target.value) })} className="bg-background" /></div>
            <div><Label className="text-foreground">Lote</Label>
              <select value={novoIngresso.lote_ingresso_id} onChange={e => setNovoIngresso({ ...novoIngresso, lote_ingresso_id: e.target.value })} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                <option value="">Sem lote</option>
                {lotesIngresso.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={criarIngresso} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg">Ingressos Cadastrados</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {tiposIngresso.map(t => (
            <div key={t.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">{t.nome}</p>
                <p className="text-xs text-muted-foreground">Vendidos: {t.quantidade_vendida}/{t.quantidade_total}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteIngresso(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
