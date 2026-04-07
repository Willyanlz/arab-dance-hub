export const MODALIDADES = [
  'Livre / Inspiração',
  'Moderno / Fusão',
  'Folclórico',
  'Clássico / Tarab',
  'Amador',
  'Semi-profissional',
  'Profissional',
  'Ballet',
  'Tribal',
  'Cigano',
  'Afro',
  'Jazz',
  'Contemporâneo',
  'Dança de salão',
] as const;

export const CATEGORIAS = [
  { value: 'solo' as const, label: 'Solo' },
  { value: 'dupla_trio' as const, label: 'Dupla/Trio' },
  { value: 'grupo' as const, label: 'Grupo' },
] as const;

export const PERIODOS = [
  { value: 'manha' as const, label: 'Manhã' },
  { value: 'tarde' as const, label: 'Tarde' },
  { value: 'nao_competir' as const, label: 'Não competir em determinado período' },
] as const;

export const PONTUACAO = {
  tecnica: 30,
  interpretacao: 20,
  musicalidade: 20,
  figurino: 10,
  presenca_cenica: 20,
};

export const PREMIACOES = [
  { categoria: 'Grupo', valor: 'R$ 1.000' },
  { categoria: 'Solo', valor: 'R$ 500' },
  { categoria: 'Dupla/Trio', valor: 'R$ 500' },
  { categoria: 'Destaque', valor: 'R$ 500' },
  { categoria: 'Melhor Coreógrafo', valor: 'R$ 500' },
];

export const EVENT_DATE = new Date('2026-08-08');
export const EVENT_END_DATE = new Date('2026-08-09');
