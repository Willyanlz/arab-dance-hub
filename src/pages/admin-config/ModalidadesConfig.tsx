import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Trash2, Save, Plus } from 'lucide-react';

interface ModalidadeConfig {
  id?: string;
  nome: string;
  tipo: string;
  periodo: string;
  horario: string;
  faixa_etaria: string;
  ativo: boolean;
  ordem: number;
}

export function ModalidadesConfig() {
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModalidades();
  }, []);

  const loadModalidades = async () => {
    setLoading(true);
    const { data } = await supabase.from('modalidades_config').select('*').order('ordem');
    if (data) setModalidades(data as any[]);
    setLoading(false);
  };

  const saveModalidade = async (m: ModalidadeConfig) => {
    if (m.id) {
      await supabase.from('modalidades_config').update({ 
        nome: m.nome, tipo: m.tipo, periodo: m.periodo, 
        horario: m.horario, faixa_etaria: m.faixa_etaria, 
        ativo: m.ativo, ordem: m.ordem 
      }).eq('id', m.id);
      toast({ title: '✅ Modalidade salva!' });
    } else {
      await supabase.from('modalidades_config').insert({ 
        nome: m.nome, tipo: m.tipo, periodo: m.periodo, 
        horario: m.horario, faixa_etaria: m.faixa_etaria, 
        ativo: m.ativo, ordem: m.ordem 
      });
      toast({ title: '✅ Modalidade criada!' });
      loadModalidades();
    }
  };

  const deleteModalidade = async (id: string) => {
    await supabase.from('modalidades_config').delete().eq('id', id);
    toast({ title: 'Modalidade removida' });
    loadModalidades();
  };

  if (loading) return <div className="text-muted-foreground font-sans text-sm">Carregando modalidades...</div>;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
          🎭 Modalidades por Período
        </CardTitle>
        <CardDescription className="font-sans text-muted-foreground">
          Configure modalidades com horário e faixa etária. Separadas por tipo (Competição/Mostra) e período.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {modalidades.map((m, i) => (
          <div key={m.id || i} className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-foreground font-sans text-xs">Nome da Modalidade</Label>
                <Input value={m.nome} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], nome: e.target.value }; setModalidades(u); }} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans text-xs">Tipo</Label>
                <select value={m.tipo} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], tipo: e.target.value }; setModalidades(u); }} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                  <option value="competicao">Competição</option>
                  <option value="mostra">Mostra</option>
                </select>
              </div>
              <div>
                <Label className="text-foreground font-sans text-xs">Período</Label>
                <select value={m.periodo} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], periodo: e.target.value }; setModalidades(u); }} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                  <option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>
              <div>
                <Label className="text-foreground font-sans text-xs">Horário</Label>
                <Input value={m.horario || ''} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], horario: e.target.value }; setModalidades(u); }} placeholder="09:00 - 10:30" className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans text-xs">Faixa Etária</Label>
                <Input value={m.faixa_etaria || ''} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], faixa_etaria: e.target.value }; setModalidades(u); }} placeholder="12 a 17 anos" className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans text-xs">Ordem</Label>
                <Input type="number" value={m.ordem} onChange={e => { const u = [...modalidades]; u[i] = { ...u[i], ordem: Number(e.target.value) }; setModalidades(u); }} className="bg-background border-border text-foreground" />
              </div>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Switch checked={m.ativo} onCheckedChange={v => { const u = [...modalidades]; u[i] = { ...u[i], ativo: v }; setModalidades(u); }} />
                <span className="text-sm font-sans text-muted-foreground">{m.ativo ? 'Ativa' : 'Inativa'}</span>
                <Badge variant="outline" className="text-xs border-border font-sans">{m.tipo === 'competicao' ? '🏆 Comp.' : '⭐ Mostra'}</Badge>
                <Badge variant="outline" className="text-xs border-border font-sans">{m.periodo === 'manha' ? '☀️ Manhã' : '🌇 Tarde'}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveModalidade(modalidades[i])} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-3.5 h-3.5 mr-1" /> Salvar</Button>
                {m.id && <Button size="sm" variant="ghost" onClick={() => deleteModalidade(m.id!)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={() => setModalidades([...modalidades, { nome: '', tipo: 'competicao', periodo: 'manha', horario: '', faixa_etaria: '', ativo: true, ordem: modalidades.length }])} className="border-border text-foreground font-sans w-full">
          <Plus className="w-4 h-4 mr-1" /> Adicionar Modalidade
        </Button>
      </CardContent>
    </Card>
  );
}
