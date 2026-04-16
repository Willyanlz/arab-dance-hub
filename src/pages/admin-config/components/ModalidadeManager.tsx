import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Trash2, Save, Plus, Layers, Clock, Users } from 'lucide-react';

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

interface ModalidadeManagerProps {
  tipo: string; // 'competicao' | 'mostra'
}

export const ModalidadeManager = ({ tipo }: ModalidadeManagerProps) => {
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModalidades();
  }, [tipo]);

  const loadModalidades = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('modalidades_config')
      .select('*')
      .eq('tipo', tipo)
      .order('ordem');
    if (data) setModalidades(data as any[]);
    setLoading(false);
  };

  const saveModalidade = async (m: ModalidadeConfig, index: number) => {
    const payload = { 
      nome: m.nome, 
      tipo: tipo, 
      periodo: m.periodo, 
      faixa_etaria_label: m.faixa_etaria, 
      ativo: m.ativo, 
      ordem: m.ordem 
    } as any;

    if (m.id) {
      await supabase.from('modalidades_config').update(payload).eq('id', m.id);
      toast({ title: '✅ Modalidade atualizada!' });
    } else {
      const { data, error } = await supabase.from('modalidades_config').insert(payload).select().single();
      if (!error && data) {
        const u = [...modalidades];
        u[index] = data as any;
        setModalidades(u);
        toast({ title: '✅ Modalidade criada!' });
      }
    }
  };

  const deleteModalidade = async (id: string) => {
    const { error } = await supabase.from('modalidades_config').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Modalidade removida' });
      setModalidades(prev => prev.filter(m => m.id !== id));
    }
  };

  const addModalidade = () => {
    setModalidades([...modalidades, { 
      nome: '', 
      tipo: tipo, 
      periodo: 'manha', 
      horario: '', 
      faixa_etaria: '', 
      ativo: true, 
      ordem: modalidades.length 
    }]);
  };

  if (loading) return <div className="text-muted-foreground font-sans text-xs italic p-4">Carregando modalidades...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-l-2 border-primary pl-3 py-1">
        <div>
          <h3 className="text-sm font-bold uppercase font-sans text-foreground flex items-center gap-2">
             <Layers className="w-4 h-4 text-primary" /> Opções de Modalidade
          </h3>
          <p className="text-[11px] text-muted-foreground font-sans">Específicas para {tipo === 'competicao' ? 'Competição' : 'Mostra'}.</p>
        </div>
        <Button size="sm" variant="outline" onClick={addModalidade} className="h-7 text-[10px] border-primary/30 text-primary hover:bg-primary/5">
          <Plus className="w-3 h-3 mr-1" /> Nova Opção
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {modalidades.map((m, i) => (
          <div key={m.id || i} className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-3 relative group transition-all hover:border-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">Nome</Label>
                <Input 
                   value={m.nome} 
                   onChange={e => { const u = [...modalidades]; u[i].nome = e.target.value; setModalidades(u); }} 
                   className="h-8 text-xs bg-background border-border" 
                   placeholder="Ex: Solo Profissional"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Período</Label>
                <select 
                  value={m.periodo} 
                  onChange={e => { const u = [...modalidades]; u[i].periodo = e.target.value; setModalidades(u); }} 
                  className="w-full h-8 rounded-md border border-border bg-background text-foreground px-2 text-[11px] font-sans"
                >
                  <option value="manha">☀️ Manhã</option>
                  <option value="tarde">🌇 Tarde</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Faixa Etária</Label>
                <Input 
                  value={m.faixa_etaria || ''} 
                  onChange={e => { const u = [...modalidades]; u[i].faixa_etaria = e.target.value; setModalidades(u); }} 
                  placeholder="Ex: 12 a 17 anos" 
                  className="h-8 text-xs bg-background border-border" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={m.ativo} onCheckedChange={v => { const u = [...modalidades]; u[i].ativo = v; setModalidades(u); }} className="scale-75" />
                    <span className="text-[10px] uppercase font-sans font-medium text-muted-foreground">{m.ativo ? 'Ativa' : 'Inativa'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                     <Label className="text-[10px] uppercase font-bold text-muted-foreground">Ordem:</Label>
                     <input 
                       type="number" 
                       value={m.ordem} 
                       onChange={e => { const u = [...modalidades]; u[i].ordem = Number(e.target.value); setModalidades(u); }} 
                       className="w-10 bg-transparent border-none text-[10px] focus:ring-0 px-0 h-4"
                     />
                  </div>
               </div>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Button size="icon" variant="ghost" onClick={() => saveModalidade(m, i)} className="h-7 w-7 text-primary hover:bg-primary/5 hover:text-primary"><Save className="w-3.5 h-3.5" /></Button>
                 {m.id && <Button size="icon" variant="ghost" onClick={() => deleteModalidade(m.id!)} className="h-7 w-7 text-destructive hover:bg-destructive/5 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>}
               </div>
            </div>
          </div>
        ))}
        {modalidades.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
             <p className="text-[11px] text-muted-foreground font-sans">Nenhuma modalidade configurada para este formulário.</p>
          </div>
        )}
      </div>
    </div>
  );
};
