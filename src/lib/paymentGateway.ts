import { supabase } from '@/integrations/supabase/client';

type MetodoPagamento = 'pix' | 'cartao';

interface PaymentInitParams {
  metodo: MetodoPagamento;
  valor: number;
  descricao: string;
  referenciaId: string;
}

interface PaymentInitResult {
  gateway: 'pix' | 'mercado_pago';
  externalReference: string;
  instructions?: string;
}

export async function initializePaymentGateway(
  params: PaymentInitParams
): Promise<PaymentInitResult> {
  const { data: config } = await supabase
    .from('site_config')
    .select('chave, valor')
    .in('chave', ['mercado_pago_public_key', 'mercado_pago_access_token', 'pix_chave']);

  const configMap: Record<string, string> = {};
  (config || []).forEach((item: any) => {
    configMap[item.chave] = String(item.valor || '').replace(/"/g, '');
  });

  if (params.metodo === 'pix') {
    return {
      gateway: 'pix',
      externalReference: `pix_${params.referenciaId}`,
      instructions: configMap.pix_chave || 'Configure a chave PIX em site_config (pix_chave).',
    };
  }

  return {
    gateway: 'mercado_pago',
    externalReference: `mp_${params.referenciaId}`,
    instructions: configMap.mercado_pago_public_key
      ? 'Gateway Mercado Pago configurado para iniciar checkout.'
      : 'Configure mercado_pago_public_key e mercado_pago_access_token em site_config para ativar checkout real.',
  };
}
