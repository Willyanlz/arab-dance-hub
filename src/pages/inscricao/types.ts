import { Trophy, Star, BookOpen } from 'lucide-react';
import type { LoteCompetição, LoteMostra, LoteWorkshop, CategoriaType, TipoCompraWorkshop } from '@/lib/pricing';
import type { SystemOptionItem } from '@/lib/systemOptions';
import type { FormFieldConfig } from '../admin-config/components/FormBuilder';

export interface Participante {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
}

export interface WorkshopItem {
  id: string;
  nome: string;
  professor: string;
  periodo: string;
  horario: string;
  ativo: boolean;
}

export type TipoInscricao = 'competicao' | 'mostra' | 'workshop';

export const TIPO_INSCRICAO_OPTIONS = [
  {
    value: 'competicao' as const,
    label: 'Competição',
    desc: 'Inscreva-se para competir nas categorias e modalidades do festival.',
    icon: Trophy,
    color: 'border-gold text-gold-light',
  },
  {
    value: 'mostra' as const,
    label: 'Mostra',
    desc: 'Apresentação não competitiva ou avaliada. Ingresso do dia incluído!',
    icon: Star,
    color: 'border-burgundy text-burgundy',
  },
  {
    value: 'workshop' as const,
    label: 'Workshop',
    desc: 'Participe das aulas com professoras renomadas do cenário árabe.',
    icon: BookOpen,
    color: 'border-primary text-primary',
  },
];

export interface InscricaoState {
  // Step & type
  step: number;
  tipoInscricao: TipoInscricao | null;

  // Pricing data
  lotes: LoteCompetição[];
  loteAtual: LoteCompetição | null;
  lotesMostra: LoteMostra[];
  loteAtualMostra: LoteMostra | null;
  lotesWorkshop: LoteWorkshop[];
  loteAtualWorkshop: LoteWorkshop | null;

  // Config
  modalidadesConfig: any[];
  comoSoubeOpcoes: string[];
  workshopsDisponiveis: WorkshopItem[];
  termosTexto: Record<string, string>;
  inscricoesAbertas: Record<string, boolean>;
  faixaEtaria: string;
  formConfigs: any[];
  dadosAdicionais: Record<string, any>;
  systemOptions: SystemOptionItem[];

  // Profile
  cpf: string;
  telefone: string;
  isJalilete: boolean;
  isAnterior: boolean;

  // Shared
  nomeEscola: string;
  professora: string;
  categoria: CategoriaType;
  participantes: Participante[];
  extraHarem: boolean;
  comoSoube: string;
  metodoPagamento: 'pix' | 'dinheiro' | 'cartao';
  termosAceitos: boolean;
  observacoes: string;
  pixInfo: { chave: string; banco: string };

  // Competicao
  modalidade: string;
  nomeCoreografia: string;
  nomeArtistico: string;
  tipoMusica: 'solta' | 'posicionada';
  periodo: string;
  termoAtraso: boolean;
  termoMusica: boolean;
  termoSemEnsaio: boolean;

  // Mostra
  tipoParticipacao: string;
  modalidadeMostra: string;
  nomeCoreografiaMostra: string;
  tipoMusicaMostra: 'solta' | 'posicionada';
  periodoMostra: string;
  sugestaoHorario: string;
  termoAtrasoM: boolean;
  termoMusicaM: boolean;
  termoSemEnsaioM: boolean;

  // Workshop
  workshopsSelecionados: string[];
  tipoCompraWorkshop: TipoCompraWorkshop;

  // Computed
  precoBase: number;
  desconto: number;
  valorFinal: number;
  numIntegrantes: number;
}
