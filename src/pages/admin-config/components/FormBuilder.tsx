import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Trash2,
  Save,
  Settings2,
  Info,
  ChevronUp,
  ChevronDown,
  Eye,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import { ModalidadeManager } from './ModalidadeManager';
import { SystemOptionsManager } from './SystemOptionsManager';
import { SYSTEM_OPTION_KEYS, type SystemOptionKey } from '@/lib/systemOptions';

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'modalidade';

export interface FormCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | 'includes';
  value: any;
}

export interface FormFieldConfig {
  id: string;
  name: string;       // interno — nunca exibido ao usuário
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  showIf?: FormCondition;
  isSystem?: boolean; // marca campos adicionados pelo painel de sistema
}

// ── Definição completa dos campos de sistema ────────────────────────────────
interface SystemFieldDef {
  name: string;
  label: string;
  description: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  tipo: string[];
}

const SYSTEM_FIELD_DEFS: SystemFieldDef[] = [
  {
    name: 'periodo',
    label: 'Período de Preferência',
    description: 'Manhã ou tarde — preferência do inscrito',
    type: 'radio',
    required: false,
    options: ['Manhã', 'Tarde'],
    tipo: ['competicao', 'mostra'],
  },
  {
    name: 'modalidade',
    label: 'Modalidade',
    description: 'Lista de modalidades de dança (gerenciada pelo sistema)',
    type: 'modalidade',
    required: true,
    tipo: ['competicao', 'mostra'],
  },
  {
    name: 'nome_coreografia',
    label: 'Nome da Coreografia',
    description: 'Título da coreografia apresentada',
    type: 'text',
    required: true,
    placeholder: 'Ex: Lago dos Cisnes',
    tipo: ['competicao', 'mostra'],
  },
  {
    name: 'tipo_musica',
    label: 'Tipo de Música',
    description: 'Música solta ou posicionada',
    type: 'radio',
    required: true,
    options: ['Solta', 'Posicionada'],
    tipo: ['competicao', 'mostra'],
  },
  {
    name: 'tipo_participacao',
    label: 'Tipo de Participação',
    description: 'Como o inscrito participa da mostra',
    type: 'select',
    required: true,
    options: ['Apresentação', 'Demonstração', 'Convidado'],
    tipo: ['mostra'],
  },
  {
    name: 'categoria',
    label: 'Categoria',
    description: 'Solo, dupla/trio ou grupo',
    type: 'radio',
    required: true,
    options: ['Solo', 'Dupla / Trio', 'Grupo'],
    tipo: ['competicao', 'mostra'],
  },
  {
    name: 'tipo_compra',
    label: 'Tipo de Compra',
    description: '1 aula avulsa, pacote de aulas etc.',
    type: 'select',
    required: true,
    options: ['1 aula avulsa', 'Pacote 4 aulas', 'Pacote 8 aulas'],
    tipo: ['workshop'],
  },
  {
    name: 'workshops',
    label: 'Workshops',
    description: 'Seleção dos workshops disponíveis',
    type: 'select',
    required: true,
    tipo: ['workshop'],
  },
];

interface FormBuilderProps {
  tipo: string;
  title: string;
}

// ── Mini preview de cada campo ──────────────────────────────────────────────
const FieldPreview = ({ field }: { field: FormFieldConfig }) => {
  const base =
    'w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none';
  return (
    <div className="space-y-1 mt-3 pt-3 border-t border-border/40">
      <p className="text-[10px] font-bold uppercase text-muted-foreground/50 flex items-center gap-1.5 font-sans">
        <Eye className="w-3 h-3" /> Preview
      </p>
      <div className="p-3 rounded-lg bg-muted/30 space-y-1.5">
        <label className="text-xs font-sans text-foreground/80">
          {field.label || 'Campo sem nome'}
          {field.required ? <span className="text-destructive ml-0.5">*</span> : ''}
        </label>
        {field.type === 'text' || field.type === 'email' || field.type === 'date' ? (
          <input
            disabled
            type={field.type}
            placeholder={field.placeholder || `Digite ${field.label?.toLowerCase() || ''}...`}
            className={base}
          />
        ) : field.type === 'number' ? (
          <input disabled type="number" placeholder="0" className={base} />
        ) : field.type === 'select' ? (
          <select disabled className={base}>
            <option>Selecione...</option>
            {field.options?.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : field.type === 'checkbox' ? (
          <label className="flex items-center gap-2 cursor-not-allowed opacity-60">
            <input type="checkbox" disabled className="w-4 h-4 accent-primary" />
            <span className="text-xs font-sans">{field.label || 'Sim / Não'}</span>
          </label>
        ) : field.type === 'radio' ? (
          <div className="flex flex-wrap gap-3">
            {(field.options?.length ? field.options : ['Opção A', 'Opção B']).map((o) => (
              <label key={o} className="flex items-center gap-1.5 cursor-not-allowed opacity-60">
                <input type="radio" disabled className="w-3 h-3 accent-primary" />
                <span className="text-xs font-sans">{o}</span>
              </label>
            ))}
          </div>
        ) : field.type === 'modalidade' ? (
          <div className={`${base} text-muted-foreground`}>
            🎭 Lista de Modalidades (gerenciada pelo sistema)
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ── Input de opções com estado local ──────────────────────────────────────
const OptionsInput = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (opts: string[]) => void;
}) => {
  const [raw, setRaw] = useState(value.join(', '));
  const prevValue = useRef(value);

  useEffect(() => {
    if (JSON.stringify(prevValue.current) !== JSON.stringify(value)) {
      setRaw(value.join(', '));
      prevValue.current = value;
    }
  }, [value]);

  const handleBlur = () => {
    const parsed = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
    onChange(parsed);
    setRaw(parsed.join(', '));
  };

  return (
    <div className="space-y-1.5 animate-in fade-in duration-300">
      <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">
        Opções{' '}
        <span className="normal-case text-muted-foreground/60">(separadas por vírgula)</span>
      </Label>
      <Input
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        placeholder="Opção 1, Opção 2, Opção 3"
        className="bg-background border-border h-9"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((o) => (
            <span
              key={o}
              className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-sans"
            >
              {o}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Painel de campos de sistema como botões de adição ─────────────────────
const SystemFieldsPanel = ({
  tipo,
  existingNames,
  onAdd,
}: {
  tipo: string;
  existingNames: Set<string>;
  onAdd: (field: FormFieldConfig) => void;
}) => {
  const available = SYSTEM_FIELD_DEFS.filter((s) => s.tipo.includes(tipo));

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-primary/10">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold font-sans text-foreground">
          Campos prontos do sistema
        </span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-sans">
          clique para adicionar
        </span>
      </div>

      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {available.map((def) => {
          const alreadyAdded = existingNames.has(def.name);
          return (
            <button
              key={def.name}
              onClick={() => {
                if (alreadyAdded) return;
                onAdd({
                  id: Math.random().toString(36).substring(7),
                  name: def.name,
                  label: def.label,
                  type: def.type,
                  required: def.required,
                  options: def.options,
                  placeholder: def.placeholder,
                  isSystem: true,
                });
              }}
              disabled={alreadyAdded}
              className={`
                flex items-start gap-3 p-3 rounded-lg border text-left transition-all
                ${alreadyAdded
                  ? 'border-green-500/30 bg-green-500/5 opacity-60 cursor-default'
                  : 'border-primary/15 bg-background hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]'
                }
              `}
            >
              <div className="mt-0.5 shrink-0">
                {alreadyAdded
                  ? <Check className="w-4 h-4 text-green-500" />
                  : <Plus className="w-4 h-4 text-primary" />
                }
              </div>
              <div>
                <p className="text-xs font-bold font-sans text-foreground leading-tight">
                  {def.label}
                </p>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-snug">
                  {def.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FormBuilder = ({ tipo, title }: FormBuilderProps) => {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadCampos();
  }, [tipo]);

  useEffect(() => {
    const allNames = fields.map((f) => f.name);
    const warns: string[] = [];

    fields.forEach((f) => {
      if (f.showIf?.field && !allNames.includes(f.showIf.field)) {
        warns.push(`Campo "${f.label}" referencia "${f.showIf.field}" que não existe mais.`);
      }
    });

    const seen = new Map<string, string[]>();
    fields.forEach((f) => {
      if (!f.name) return;
      seen.set(f.name, [...(seen.get(f.name) ?? []), f.label || f.id]);
    });
    seen.forEach((labels) => {
      if (labels.length > 1) {
        warns.push(
          `Campo duplicado: "${labels.join('" e "')}" estão usando o mesmo identificador interno. Remova um deles.`
        );
      }
    });

    setWarnings(warns);
  }, [fields]);

  const loadCampos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('form_config')
      .select('fields')
      .eq('tipo_inscricao', tipo)
      .maybeSingle();
    if (data?.fields) setFields((data.fields as unknown as FormFieldConfig[]) || []);
    else setFields([]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (warnings.length > 0) {
      toast({ title: '⚠️ Corrija os avisos antes de salvar', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('form_config')
      .upsert(
        { tipo_inscricao: tipo, fields: fields as unknown as any },
        { onConflict: 'tipo_inscricao' }
      );
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Layout salvo!' });
    setSaving(false);
  };

  const addCustomField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: `campo_${Date.now()}`,
        label: 'Novo Campo',
        type: 'text',
        required: false,
        isSystem: false,
      },
    ]);
  };

  const addSystemField = (field: FormFieldConfig) =>
    setFields((prev) => [...prev, field]);

  const removeField = (id: string) =>
    setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, updates: Partial<FormFieldConfig>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));

  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const genName = (label: string, currentId: string) => {
    const base = label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    const systemNames = new Set(SYSTEM_FIELD_DEFS.map((s) => s.name));
    const candidate = systemNames.has(base) ? `custom_${base}` : base || `campo_${currentId}`;
    const exists = fields.some((f) => f.name === candidate && f.id !== currentId);
    return exists ? `${candidate}_2` : candidate;
  };

  const existingNames = new Set(fields.map((f) => f.name));

  if (loading)
    return (
      <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">
        Carregando formulário...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground font-sans">
            Customize todos os campos e lógicas deste formulário.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || warnings.length > 0}
          className="bg-gradient-gold text-primary-foreground font-sans shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* ── Avisos ── */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-1">
          <div className="flex items-center gap-2 text-yellow-600 font-sans font-bold text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            Atenção — Problemas encontrados no formulário
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-700 font-sans">• {w}</p>
          ))}
          <p className="text-[10px] text-yellow-600/70 font-sans mt-1">
            Corrija os problemas apontados antes de salvar.
          </p>
        </div>
      )}

      {/* ── Campos prontos do sistema ── */}
      <SystemFieldsPanel
        tipo={tipo}
        existingNames={existingNames}
        onAdd={addSystemField}
      />

      <div className="space-y-3">
        <div>
          <h3 className="text-base font-serif font-bold text-foreground">Opções globais do sistema</h3>
          <p className="text-xs text-muted-foreground font-sans">
            Mobile-first: essas opções alimentam os campos reservados (categoria, período, tipo de música etc.).
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SYSTEM_OPTION_KEYS.map((optionKey) => (
            <SystemOptionsManager key={optionKey} field={optionKey as SystemOptionKey} />
          ))}
        </div>
      </div>

      {/* ── Lista de campos configurados ── */}
      <div className="space-y-4">
        {fields.length === 0 && (
          <div className="text-center py-12 text-muted-foreground font-sans text-sm border-2 border-dashed border-border rounded-xl">
            Nenhum campo adicionado ainda.
            <br />
            <span className="text-xs opacity-60">
              Use os campos prontos acima ou adicione um personalizado.
            </span>
          </div>
        )}

        {fields.map((field, index) => {
          const isDuplicate = fields.filter((f) => f.name === field.name).length > 1;

          return (
            <Card
              key={field.id}
              className={`bg-card transition-colors ${isDuplicate
                  ? 'border-yellow-500/50'
                  : 'border-border hover:border-primary/20'
                }`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* ── BASIC INFO ── */}
                  <div className="flex-1 space-y-4">
                    {/* Topo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`font-sans text-[10px] uppercase ${field.isSystem
                              ? 'border-primary/30 text-primary bg-primary/5'
                              : 'border-border text-muted-foreground'
                            }`}
                        >
                          {field.isSystem ? '⚡ Sistema' : `Campo #${index + 1}`}
                        </Badge>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => moveField(index, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-colors"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                        {isDuplicate && (
                          <span className="flex items-center gap-1 text-[10px] text-yellow-600 font-sans">
                            <AlertTriangle className="w-3 h-3" /> campo duplicado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(v) => updateField(field.id, { required: v })}
                            className="scale-90"
                          />
                          <span className="text-xs font-sans text-muted-foreground">
                            Obrigatório
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                          className="text-destructive h-8 w-8 hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Label + Tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">
                          Nome do campo (exibido ao inscrito)
                        </Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, {
                              label: e.target.value,
                              // Campos de sistema mantêm o name fixo
                              ...(field.isSystem
                                ? {}
                                : { name: genName(e.target.value, field.id) }),
                            })
                          }
                          className="bg-background border-border h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">
                          Tipo de Campo
                        </Label>
                        <Select
                          value={field.type}
                          disabled={field.isSystem}
                          onValueChange={(v: FieldType) => updateField(field.id, { type: v })}
                        >
                          <SelectTrigger className="bg-background border-border h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto Curto</SelectItem>
                            <SelectItem value="number">Número / Idade</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="date">Data de Nascimento</SelectItem>
                            <SelectItem value="select">Lista de Seleção (Dropdown)</SelectItem>
                            <SelectItem value="radio">Múltipla Escolha</SelectItem>
                            <SelectItem value="checkbox">Sim / Não (Checkbox)</SelectItem>
                            <SelectItem value="modalidade">🎭 Lista de Modalidades</SelectItem>
                          </SelectContent>
                        </Select>
                        {field.isSystem && (
                          <p className="text-[10px] text-muted-foreground/60 font-sans">
                            Tipo fixo — definido pelo sistema
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Placeholder */}
                    {(field.type === 'text' ||
                      field.type === 'email' ||
                      field.type === 'number') && (
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <Label className="text-xs text-muted-foreground uppercase font-sans font-bold">
                            Texto de exemplo (opcional)
                          </Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) =>
                              updateField(field.id, { placeholder: e.target.value })
                            }
                            placeholder="Ex: Digite seu nome completo..."
                            className="bg-background border-border h-9"
                          />
                        </div>
                      )}

                    {/* ModalidadeManager */}
                    {field.type === 'modalidade' && (
                      <div className="mt-4 p-4 border rounded-xl bg-primary/5 border-primary/10">
                        <ModalidadeManager
                          tipo={tipo === 'mostra' ? 'mostra' : 'competicao'}
                        />
                      </div>
                    )}

                    {/* Opções para select/radio */}
                    {(field.type === 'select' || field.type === 'radio') && (
                      <OptionsInput
                        value={field.options ?? []}
                        onChange={(opts) => updateField(field.id, { options: opts })}
                      />
                    )}

                    <FieldPreview field={field} />
                  </div>

                  {/* ── LOGIC / CONDITIONS ── */}
                  <div className="lg:w-80 p-4 bg-muted/40 rounded-xl border border-border/50 space-y-4 self-start">
                    <div className="flex items-center gap-2 text-primary">
                      <Settings2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase font-sans">
                        Exibição Condicional
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-sans">
                          Mostrar apenas se...
                        </span>
                        <Switch
                          checked={!!field.showIf}
                          onCheckedChange={(v) =>
                            updateField(field.id, {
                              showIf: v
                                ? { field: '', operator: '==', value: '' }
                                : undefined,
                            })
                          }
                          className="scale-75"
                        />
                      </div>

                      {field.showIf && (
                        <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                          <Select
                            value={field.showIf.field}
                            onValueChange={(v) =>
                              updateField(field.id, {
                                showIf: { ...field.showIf!, field: v },
                              })
                            }
                          >
                            <SelectTrigger
                              className={`h-8 text-[11px] bg-background ${field.showIf.field &&
                                  !fields.some(
                                    (f) =>
                                      f.name === field.showIf!.field && f.id !== field.id
                                  )
                                  ? 'border-yellow-500'
                                  : ''
                                }`}
                            >
                              <SelectValue placeholder="Qual campo controla este?" />
                            </SelectTrigger>
                            <SelectContent>
                              {fields
                                .filter((f) => f.id !== field.id)
                                .map((f) => (
                                  <SelectItem
                                    key={f.id}
                                    value={f.name}
                                    className="text-[11px]"
                                  >
                                    {f.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <div className="flex gap-1">
                            <Select
                              value={field.showIf.operator}
                              onValueChange={(v: any) =>
                                updateField(field.id, {
                                  showIf: { ...field.showIf!, operator: v },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-[11px] bg-background flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="text-[11px]">
                                <SelectItem value="==">for igual a</SelectItem>
                                <SelectItem value="!=">for diferente de</SelectItem>
                                <SelectItem value=">">for maior que</SelectItem>
                                <SelectItem value="<">for menor que</SelectItem>
                                <SelectItem value="includes">contiver</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={field.showIf.value}
                              onChange={(e) =>
                                updateField(field.id, {
                                  showIf: { ...field.showIf!, value: e.target.value },
                                })
                              }
                              placeholder="Valor"
                              className="h-8 text-[11px] bg-background flex-1"
                            />
                          </div>

                          {field.showIf.field &&
                            !fields.some(
                              (f) =>
                                f.name === field.showIf!.field && f.id !== field.id
                            ) && (
                              <p className="text-[10px] text-yellow-600 flex items-center gap-1 font-sans">
                                <AlertTriangle className="w-3 h-3" />
                                Campo de referência não encontrado
                              </p>
                            )}

                          {field.showIf.field && field.showIf.value && (
                            <p className="text-[10px] text-muted-foreground font-sans italic bg-background rounded p-2">
                              Exibe quando{' '}
                              <strong>
                                {fields.find((f) => f.name === field.showIf!.field)?.label ||
                                  field.showIf.field}
                              </strong>{' '}
                              {field.showIf.operator}{' '}
                              <strong>{field.showIf.value}</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {!field.showIf && (
                        <div className="flex items-center gap-2 text-muted-foreground/30">
                          <Info className="w-3 h-3" />
                          <span className="text-[10px] font-sans italic">
                            Sempre visível para o inscrito
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="outline"
          onClick={addCustomField}
          className="w-full border-dashed border-2 py-10 hover:bg-primary/5 text-primary border-primary/20 hover:border-primary/40 transition-all rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Campo Personalizado
        </Button>
      </div>
    </div>
  );
};

const Badge = ({ children, className }: any) => (
  <span
    className={`px-2 py-0.5 rounded text-[10px] border tracking-wider font-bold ${className}`}
  >
    {children}
  </span>
);