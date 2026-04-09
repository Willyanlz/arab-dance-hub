// Pricing utilities for all registration types (Competição, Mostra, Workshop)

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type LoteBase = {
  id: string;
  numero: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  ativo?: boolean | null;
};

export type LoteCompetição = LoteBase & {
  preco_solo: number;
  preco_dupla_trio: number;
  preco_grupo_por_integrante: number;
};

export type LoteMostra = LoteBase & {
  preco_solo: number;
  preco_dupla_trio: number;
  preco_grupo_por_integrante: number;
};

export type LoteWorkshop = LoteBase & {
  preco_pacote_completo: number;
  preco_1_aula: number;
  preco_2_aulas: number;
  preco_3_aulas: number;
  preco_4_aulas: number;
  preco_5_aulas: number;
};

export type CategoriaType = 'solo' | 'dupla_trio' | 'grupo';
export type TipoCompraWorkshop = 'pacote_completo' | '1_aula' | '2_aulas' | '3_aulas' | '4_aulas' | '5_aulas';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getLoteAtual<T extends LoteBase>(lotes: T[]): T | null {
  const today = new Date().toISOString().split('T')[0];
  return lotes.find((l) => today >= l.data_inicio && today <= l.data_fim) ?? null;
}

export function isEventDay(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return today === '2026-08-08' || today === '2026-08-09';
}

// ─── COMPETIÇÃO ───────────────────────────────────────────────────────────────

export function calcularPreco(
  lote: LoteCompetição,
  categoria: CategoriaType,
  numIntegrantes: number = 1,
  eventoDay: boolean = false
): number {
  let preco: number;
  switch (categoria) {
    case 'solo':
      preco = Number(lote.preco_solo);
      break;
    case 'dupla_trio':
      preco = Number(lote.preco_dupla_trio);
      break;
    case 'grupo':
      preco = Number(lote.preco_grupo_por_integrante) * numIntegrantes;
      break;
    default:
      preco = 0;
  }
  if (eventoDay) preco *= 2;
  return preco;
}

// ─── MOSTRA ───────────────────────────────────────────────────────────────────

export function calcularPrecoMostra(
  lote: LoteMostra,
  categoria: CategoriaType,
  numIntegrantes: number = 1,
  eventoDay: boolean = false
): number {
  let preco: number;
  switch (categoria) {
    case 'solo':
      preco = Number(lote.preco_solo);
      break;
    case 'dupla_trio':
      // Price per person for dupla/trio
      preco = Number(lote.preco_dupla_trio) * numIntegrantes;
      break;
    case 'grupo':
      preco = Number(lote.preco_grupo_por_integrante) * numIntegrantes;
      break;
    default:
      preco = 0;
  }
  // Double on event day (base: 5th lot)
  if (eventoDay) preco *= 2;
  return preco;
}

// ─── WORKSHOP ─────────────────────────────────────────────────────────────────

export function calcularPrecoWorkshop(
  lote: LoteWorkshop,
  tipoCompra: TipoCompraWorkshop,
  eventoDay: boolean = false
): number {
  let preco: number;
  switch (tipoCompra) {
    case 'pacote_completo':
      preco = Number(lote.preco_pacote_completo);
      break;
    case '1_aula':
      preco = Number(lote.preco_1_aula);
      break;
    case '2_aulas':
      preco = Number(lote.preco_2_aulas);
      break;
    case '3_aulas':
      preco = Number(lote.preco_3_aulas);
      break;
    case '4_aulas':
      preco = Number(lote.preco_4_aulas);
      break;
    case '5_aulas':
      preco = Number(lote.preco_5_aulas);
      break;
    default:
      preco = 0;
  }
  if (eventoDay) preco *= 2;
  return preco;
}

// ─── DESCONTO ─────────────────────────────────────────────────────────────────

export function calcularDesconto(
  preco: number,
  isAlunaJalilete: boolean,
  isParticipanteAnterior: boolean
): { percentual: number; valorFinal: number } {
  let percentual = 0;
  if (isAlunaJalilete) percentual += 10;
  if (isParticipanteAnterior) percentual += 5;
  const valorFinal = preco * (1 - percentual / 100);
  return { percentual, valorFinal };
}

// ─── LOTE LABEL ───────────────────────────────────────────────────────────────

export function getLoteLabel(numero: number): string {
  const labels: Record<number, string> = {
    1: '1º Lote (Abril)',
    2: '2º Lote (Maio)',
    3: '3º Lote (Junho)',
    4: '4º Lote (Julho)',
    5: '5º e Último Lote (Agosto)',
  };
  return labels[numero] || `Lote ${numero}`;
}

// ─── WORKSHOP TIPO LABELS ─────────────────────────────────────────────────────

export const WORKSHOP_TIPO_COMPRA = [
  { value: 'pacote_completo', label: 'Todas as aulas (Pacote Completo)' },
  { value: '1_aula', label: '1 Aula' },
  { value: '2_aulas', label: '2 Aulas' },
  { value: '3_aulas', label: '3 Aulas' },
  { value: '4_aulas', label: '4 Aulas' },
  { value: '5_aulas', label: '5 Aulas' },
] as const;

export const TIPO_PARTICIPACAO_MOSTRA = [
  { value: 'mostra', label: 'Mostra (Não Competitiva)' },
  { value: 'mostra_avaliada', label: 'Mostra Avaliada' },
  { value: 'so_competir', label: 'Só Competir' },
] as const;
