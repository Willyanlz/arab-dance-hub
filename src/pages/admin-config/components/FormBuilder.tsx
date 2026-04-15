import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Settings2, Info, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { ModalidadeManager } from './ModalidadeManager';

export type FieldType = 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'radio' | 'date' | 'modalidade';

export interface FormCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | 'includes';
  value: any;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  showIf?: FormCondition;
}

interface FormBuilderProps {
  tipo: string;
  title: string;
}

export const FormBuilder = ({ tipo, title }: FormBuilderProps) => {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCampos();
  }, [tipo]);

  const loadCampos = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('form_config').select('fields').eq('tipo_inscricao', tipo).single();
    if (data && data.fields) {
      setFields((data.fields as unknown as FormFieldConfig[]) || []);
    } else {
      setFields([]);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from('form_config').upsert({
      tipo_inscricao: tipo,
      fields: fields as any,
    }, { onConflict: 'tipo_inscricao' });

    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Layout salvo!' });
    setSaving(false);
  };

  const addField = () => {
    setFields([...fields, { 
      id: Math.random().toString(36).substring(7), 
      name: `campo_${Date.now()}`,
      label: 'Novo Campo', 
      type: 'text', 
      required: false 
    }]);
  };

  const removeField = (id: string) => setFields(fields.filter(f => f.id !== id));
  const updateField = (id: string, updates: Partial<FormFieldConfig>) => setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando formulário...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground font-sans">Customize todos os campos e lógicas deste formulário.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground font-sans shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
          <Save className="w-4 h-4 mr-2" /> Salvar Alterações
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border-border bg-card hover:border-primary/20 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* ── BASIC INFO ── */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-sans text-[10px] uppercase border-primary/20 text-primary/80">Campo #{index + 1}</Badge>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                         <Switch checked={field.required} onCheckedChange={v => updateField(field.id, { required: v })} className="scale-90" />
                         <span className="text-xs font-sans text-muted-foreground">Obrigatório</span>
                       </div>
                       <Button variant="ghost" size="icon" onClick={() => removeField(field.id)} className="text-destructive h-8 w-8 hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">Label (Rótulo)</Label>
                      <Input value={field.label} onChange={e => updateField(field.id, { label: e.target.value, name: e.target.value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') })} className="bg-background border-border h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">Tipo de Dado</Label>
                      <Select value={field.type} onValueChange={(v: FieldType) => updateField(field.id, { type: v })}>
                        <SelectTrigger className="bg-background border-border h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto Curto</SelectItem>
                          <SelectItem value="number">Número / Idade</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="date">Data de Nascimento</SelectItem>
                          <SelectItem value="select">Lista de Seleção (Dropdown)</SelectItem>
                          <SelectItem value="radio">Múltipla Escolha</SelectItem>
                          <SelectItem value="checkbox">Sim / Não (Checkbox)</SelectItem>
                          <SelectItem value="modalidade">🎭 Lista de Modalidades (Sistema)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {field.type === 'modalidade' && (
                    <div className="mt-4 p-4 border rounded-xl bg-primary/5 border-primary/10">
                      <ModalidadeManager tipo={tipo === 'mostra' ? 'mostra' : 'competicao'} />
                    </div>
                  )}

                  {(field.type === 'select' || field.type === 'radio') && (
                    <div className="space-y-1.5 animate-in fade-in duration-300">
                      <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">Opções (Separadas por vírgula)</Label>
                      <Input value={field.options?.join(', ') || ''} onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') })} placeholder="Opção 1, Opção 2, Opção 3" className="bg-background border-border h-9" />
                    </div>
                  )}
                </div>

                {/* ── LOGIC / CONDITIONS ── */}
                <div className="lg:w-80 p-4 bg-muted/40 rounded-xl border border-border/50 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase font-sans">Lógica Condicional</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-sans">Exibir apenas se...</span>
                      <Switch checked={!!field.showIf} onCheckedChange={v => updateField(field.id, { showIf: v ? { field: '', operator: '==', value: '' } : undefined })} className="scale-75" />
                    </div>

                    {field.showIf && (
                      <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                        <Select value={field.showIf.field} onValueChange={v => updateField(field.id, { showIf: { ...field.showIf!, field: v } })}>
                          <SelectTrigger className="h-8 text-[11px] bg-background"><SelectValue placeholder="Selecione o campo..." /></SelectTrigger>
                          <SelectContent>
                             {fields.filter(f => f.id !== field.id).map(f => (
                               <SelectItem key={f.id} value={f.name} className="text-[11px]">{f.label}</SelectItem>
                             ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-1">
                          <Select value={field.showIf.operator} onValueChange={(v: any) => updateField(field.id, { showIf: { ...field.showIf!, operator: v } })}>
                            <SelectTrigger className="h-8 text-[11px] bg-background flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="text-[11px]">
                              <SelectItem value="==">é igual a</SelectItem>
                              <SelectItem value="!=">é diferente de</SelectItem>
                              <SelectItem value=">">maior que</SelectItem>
                              <SelectItem value="<">menor que</SelectItem>
                              <SelectItem value="includes">contém</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input value={field.showIf.value} onChange={e => updateField(field.id, { showIf: { ...field.showIf!, value: e.target.value } })} placeholder="Valor" className="h-8 text-[11px] bg-background flex-1" />
                        </div>
                      </div>
                    )}

                    {!field.showIf && (
                      <div className="flex items-center gap-2 text-muted-foreground/30">
                        <Info className="w-3 h-3" />
                        <span className="text-[10px] font-sans italic">Sempre visível para o usuário</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addField} className="w-full border-dashed border-2 py-10 hover:bg-primary/5 text-primary border-primary/20 hover:border-primary/40 transition-all rounded-xl">
          <Plus className="w-5 h-5 mr-2" /> Adicionar Novo Campo ao Formulário
        </Button>
      </div>
    </div>
  );
};

const Badge = ({ children, variant, className }: any) => (
  <span className={`px-2 py-0.5 rounded text-[10px] border tracking-wider font-bold ${className}`}>{children}</span>
);
