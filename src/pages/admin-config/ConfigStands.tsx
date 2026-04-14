import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Trash2, Plus, Store } from 'lucide-react';

export const ConfigStands = () => {
  const [loading, setLoading] = useState(true);
  const [stands, setStands] = useState<any[]>([]);

  useEffect(() => { loadStands(); }, []);

  const loadStands = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_config').select('*').eq('chave', 'stands_feirinha').single();
    if (data && data.valor) setStands(data.valor);
    setLoading(false);
  };

  const saveStands = async () => {
    const { error } = await supabase.from('site_config').upsert({ chave: 'stands_feirinha', valor: stands } as any, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Stands salvos!' });
  };

  const addStand = () => setStands([...stands, { titulo: '', icone: 'circle', descricao: '', contato: '' }]);
  const removeStand = (i: number) => setStands(stands.filter((_, j) => j !== i));
  const updateStand = (i: number, field: string, val: string) => { const u = [...stands]; u[i] = { ...u[i], [field]: val }; setStands(u); };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando stands...</div>;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" />Stands / Feirinha</CardTitle>
        <CardDescription className="text-xs">Configure os stands da landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stands.map((s, i) => (
          <div key={i} className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Título</Label><Input value={s.titulo} onChange={e => updateStand(i, 'titulo', e.target.value)} className="bg-background" /></div>
              <div><Label className="text-xs">Ícone</Label>
                <select value={s.icone} onChange={e => updateStand(i, 'icone', e.target.value)} className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="camera">📷 Câmera</option><option value="scissors">✂️ Tesoura</option><option value="circle">⭕ Círculo</option>
                </select>
              </div>
            </div>
            <Textarea value={s.descricao} onChange={e => updateStand(i, 'descricao', e.target.value)} rows={3} className="bg-background" />
            <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => removeStand(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
          </div>
        ))}
        <div className="flex gap-2">
          <Button variant="outline" onClick={addStand}><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
          <Button onClick={saveStands} className="bg-gradient-gold"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
};
