import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Save, Trash2, Plus } from 'lucide-react';

export const ConfigWorkshops = () => {
  const [loading, setLoading] = useState(true);
  const [workshops, setWorkshops] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from('workshops_config') as any).select('*').order('nome');
    setWorkshops(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveWorkshop = async (i: number) => {
    const w = workshops[i];
    if (w.id) {
      await (supabase.from('workshops_config') as any).update({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo }).eq('id', w.id);
      toast({ title: '✅ Workshop salvo!' });
    } else {
      await (supabase.from('workshops_config') as any).insert({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo });
      toast({ title: '✅ Workshop criado!' });
      loadData();
    }
  };

  const deleteWorkshop = async (id: string) => {
    await (supabase.from('workshops_config') as any).delete().eq('id', id);
    toast({ title: 'Workshop removido' });
    loadData();
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando workshops...</div>;

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="font-serif text-foreground text-lg">Gerenciar Workshops</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {workshops.map((w, i) => (
          <div key={w.id || i} className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-foreground font-sans text-xs">Nome</Label><Input value={w.nome} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], nome: e.target.value }; setWorkshops(u); }} className="bg-background border-border" /></div>
              <div><Label className="text-foreground font-sans text-xs">Professor(a)</Label><Input value={w.professor || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], professor: e.target.value }; setWorkshops(u); }} className="bg-background border-border" /></div>
              <div><Label className="text-foreground font-sans text-xs">Horário</Label><Input value={w.horario || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], horario: e.target.value }; setWorkshops(u); }} className="bg-background border-border" /></div>
              <div><Label className="text-foreground font-sans text-xs">Período</Label>
                <select value={w.periodo || 'manha'} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], periodo: e.target.value }; setWorkshops(u); }} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm">
                  <option value="manha">Manhã</option><option value="tarde">Tarde</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={w.ativo} onCheckedChange={v => { const u = [...workshops]; u[i] = { ...u[i], ativo: v }; setWorkshops(u); }} />
                <span className="text-xs font-sans text-muted-foreground">{w.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveWorkshop(i)}><Save className="w-3.5 h-3.5 mr-1" /> Salvar</Button>
                {w.id && <Button size="sm" variant="ghost" onClick={() => deleteWorkshop(w.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => setWorkshops([...workshops, { nome: '', professor: '', horario: '', periodo: 'manha', ativo: true }])} className="w-full"><Plus className="w-4 h-4 mr-1" /> Adicionar Workshop</Button>
      </CardContent>
    </Card>
  );
};
