import type { Database } from '@/integrations/supabase/types';

type Lote = Database['public']['Tables']['lotes']['Row'];
type Categoria = Database['public']['Enums']['categoria_tipo'];

export function getLoteAtual(lotes: Lote[]): Lote | null {
  const today = new Date().toISOString().split('T')[0];
  return lotes.find(l => today >= l.data_inicio && today <= l.data_fim) || null;
}

export function calcularPreco(
  lote: Lote,
  categoria: Categoria,
  numIntegrantes: number = 1,
  isEventDay: boolean = false
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
  if (isEventDay) preco *= 2;
  return preco;
}

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
