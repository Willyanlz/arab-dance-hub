import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Settings2 } from 'lucide-react';

type FieldType = 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'radio' | 'date';

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // Comma separated for editing, but used as array
}

export const FormulariosConfig = () => {
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('competicao');
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCampos = async (tipo: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('form_config').select('fields').eq('tipo_inscricao', tipo).single();
    if (data && data.fields) {
      // Parse JSON
      let parsedFields = data.fields;
      if (typeof parsedFields === 'string') parsedFields = JSON.parse(parsedFields as string);
      setFields((parsedFields as unknown as FormFieldConfig[]) || []);
    } else {
      setFields([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCampos(tipoSelecionado);
  }, [tipoSelecionado]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('form_config').upsert({
      tipo_inscricao: tipoSelecionado,
      fields: fields as any,
    }, { onConflict: 'tipo_inscricao' });

    if (error) {
      toast({ title: 'Erro ao salvar campos', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Campos salvos com sucesso!' });
    }
    setSaving(false);
  };

  const addField = () => {
    setFields([...fields, { 
      id: Math.random().toString(36).substring(7), 
      name: `campo_${fields.length + 1}`,
      label: 'Novo Campo', 
      type: 'text', 
      required: false 
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<FormFieldConfig>) => {
    setFields(fields.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-xl font-serif text-foreground mb-4">Construtor de Formulários</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Defina dinamicamente quais campos serão solicitados na hora da inscrição para cada modalidade. O sistema gerará o formulário automaticamente.
        </p>

        <div className="flex gap-4 items-center mb-6">
          <Label className="text-foreground shrink-0 font-sans">Tipo de Inscrição:</Label>
          <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
            <SelectTrigger className="w-[200px] border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="competicao">Competição</SelectItem>
              <SelectItem value="mostra">Mostra</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1"></div>
          <Button onClick={handleSave} disabled={saving || loading} className="bg-gradient-gold text-primary-foreground font-sans">
            <Save className="w-4 h-4 mr-2" />
            Salvar Layout
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando campos...</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-border">
                <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="w-12 text-center text-muted-foreground font-sans shrink-0 pb-2">
                    #{index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-muted-foreground">Label (Exibido para o usuário)</Label>
                    <Input 
                      value={field.label} 
                      onChange={e => {
                        updateField(field.id, { 
                          label: e.target.value,
                          name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_') // auto sync name
                        });
                      }} 
                      className="border-border text-foreground"
                    />
                  </div>

                  <div className="w-full sm:w-32 space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo de Campo</Label>
                    <Select value={field.type} onValueChange={(v: FieldType) => updateField(field.id, { type: v })}>
                      <SelectTrigger className="border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="select">Lista (Select)</SelectItem>
                        <SelectItem value="radio">Múltipla Escolha</SelectItem>
                        <SelectItem value="checkbox">Caixa (Sim/Não)</SelectItem>
                        <SelectItem value="date">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(field.type === 'select' || field.type === 'radio') && (
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs text-muted-foreground">Opções (Separadas por vírgula)</Label>
                      <Input 
                        value={field.options?.join(', ') || ''} 
                        onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="Ex: Opção 1, Opção 2"
                        className="border-border text-foreground"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pb-2">
                    <Switch id={`req-${field.id}`} checked={field.required} onCheckedChange={v => updateField(field.id, { required: v })} />
                    <Label htmlFor={`req-${field.id}`} className="text-xs text-muted-foreground cursor-pointer">Obrigatório</Label>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 pb-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {fields.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum campo configurado para {tipoSelecionado}. O formulário ficará vazio (pedindo apenas Modalidade, se aplicável).</p>
            )}

            <Button variant="outline" onClick={addField} className="w-full border-dashed border-border border-2 text-primary hover:bg-primary/5 mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo Campo
            </Button>
          </div>
        )}
      </div>

      <div className="bg-primary/5 p-4 rounded-lg flex items-start gap-4">
        <Settings2 className="w-6 h-6 text-primary shrink-0 mt-1" />
        <div className="text-sm text-foreground font-sans">
          <p className="font-semibold mb-1">Como funciona o construtor?</p>
          <p className="text-muted-foreground">
            Os campos estáticos principais como "Modalidade", "Música" (se houver), e "Lote" são automaticamente tratados pelo sistema com base na categoria. Estes campos aqui são lidos para as perguntas dinâmicas e informações extras pertinentes apenas ao evento F.A.D.D.A (ex: Nome da Coreografia, Tempo de Música, Como Soube, etc).
          </p>
        </div>
      </div>
    </div>
  );
};
