import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { SystemOptionItem, SystemOptionKey } from '@/lib/systemOptions';

interface SystemOptionsManagerProps {
  field: SystemOptionKey;
}

export const SystemOptionsManager = ({ field }: SystemOptionsManagerProps) => {
  const [options, setOptions] = useState<SystemOptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOptions();
  }, [field]);

  const loadOptions = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('system_options' as any) as any)
      .select('*')
      .eq('key', field)
      .order('ordem');

    if (error) {
      toast({ title: 'Erro ao carregar opções', description: error.message, variant: 'destructive' });
    } else {
      setOptions((data as SystemOptionItem[]) || []);
    }
    setLoading(false);
  };

  const saveOption = async (option: SystemOptionItem, index: number) => {
    const payload = {
      key: field,
      value: option.value,
      label: option.label,
      ordem: option.ordem,
    };

    if (!option.value || !option.label) {
      toast({ title: 'Preencha valor e label', variant: 'destructive' });
      return;
    }

    if (option.id) {
      const { error } = await (supabase.from('system_options' as any) as any)
        .update(payload)
        .eq('id', option.id);

      if (error) {
        toast({ title: 'Erro ao atualizar opção', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Opção atualizada' });
      }
      return;
    }

    const { data, error } = await (supabase.from('system_options' as any) as any)
      .insert(payload)
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro ao criar opção', description: error.message, variant: 'destructive' });
      return;
    }

    const next = [...options];
    next[index] = data as SystemOptionItem;
    setOptions(next);
    toast({ title: 'Opção criada' });
  };

  const removeOption = async (id?: string) => {
    if (!id) return;
    const { error } = await (supabase.from('system_options' as any) as any).delete().eq('id', id);

    if (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
      return;
    }

    setOptions((prev) => prev.filter((option) => option.id !== id));
    toast({ title: 'Opção removida' });
  };

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        key: field,
        value: '',
        label: '',
        ordem: prev.length,
      },
    ]);
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground font-sans py-2">Carregando opções...</p>;
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold font-sans uppercase text-foreground">Opções: {field}</h4>
          <p className="text-xs text-muted-foreground font-sans">Gerencie opções globais usadas no formulário.</p>
        </div>
        <Button variant="outline" size="sm" onClick={addOption} className="border-primary/30 text-primary w-full sm:w-auto">
          <Plus className="w-3 h-3 mr-1" />
          Nova opção
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id || `${field}-${index}`} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase">Value</Label>
                <Input
                  value={option.value}
                  onChange={(event) => {
                    const next = [...options];
                    next[index].value = event.target.value;
                    setOptions(next);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase">Label</Label>
                <Input
                  value={option.label}
                  onChange={(event) => {
                    const next = [...options];
                    next[index].label = event.target.value;
                    setOptions(next);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase">Ordem</Label>
                <Input
                  type="number"
                  value={option.ordem}
                  onChange={(event) => {
                    const next = [...options];
                    next[index].ordem = Number(event.target.value);
                    setOptions(next);
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => saveOption(option, index)} className="text-xs">
                <Save className="w-3 h-3 mr-1" />
                Salvar
              </Button>
              {option.id && (
                <Button size="sm" variant="ghost" onClick={() => removeOption(option.id)} className="text-destructive text-xs">
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              )}
            </div>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-muted-foreground font-sans py-2">Nenhuma opção cadastrada para este campo.</p>
        )}
      </div>
    </div>
  );
};
