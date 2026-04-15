export const SYSTEM_OPTION_KEYS = [
  'categoria',
  'periodo',
  'tipo_musica',
  'tipo_participacao',
  'tipo_compra',
] as const;

export type SystemOptionKey = (typeof SYSTEM_OPTION_KEYS)[number];

export interface SystemOptionItem {
  id?: string;
  key: SystemOptionKey | string;
  value: string;
  label: string;
  ordem: number;
}

export const SYSTEM_OPTION_DEFAULTS: Record<SystemOptionKey, Array<{ value: string; label: string }>> = {
  categoria: [
    { value: 'solo', label: 'Solo' },
    { value: 'dupla_trio', label: 'Dupla / Trio' },
    { value: 'grupo', label: 'Grupo' },
  ],
  periodo: [
    { value: 'manha', label: 'Manhã' },
    { value: 'tarde', label: 'Tarde' },
    { value: 'nao_competir', label: 'Sem preferência de período' },
  ],
  tipo_musica: [
    { value: 'solta', label: 'Solta' },
    { value: 'posicionada', label: 'Posicionada' },
  ],
  tipo_participacao: [
    { value: 'mostra', label: 'Mostra' },
    { value: 'avaliada', label: 'Avaliada' },
  ],
  tipo_compra: [
    { value: '1_aula', label: '1 Aula' },
    { value: '2_aulas', label: '2 Aulas' },
    { value: '3_aulas', label: '3 Aulas' },
    { value: '4_aulas', label: '4 Aulas' },
    { value: '5_aulas', label: '5 Aulas' },
    { value: 'pacote_completo', label: 'Pacote Completo' },
  ],
};

export const getSystemOptions = (
  key: SystemOptionKey,
  options: SystemOptionItem[]
) => {
  const fromDb = options
    .filter((option) => option.key === key)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((option) => ({ value: option.value, label: option.label }));

  return fromDb.length > 0 ? fromDb : SYSTEM_OPTION_DEFAULTS[key];
};
