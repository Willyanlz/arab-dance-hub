import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Ticket, Minus, Plus, ShoppingCart } from 'lucide-react';
import { isValidCpf, isValidEmail, isValidPhoneBR, maskCpf, normalizePhoneBR } from '@/lib/inputValidation';
// import { initializePaymentGateway } from '@/lib/paymentGateway';

interface TipoIngresso {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean;
  lote_grupo_id: string | null;
}

interface LoteIngresso {
  id: string;
  grupo_id: string | null;
  numero: number;
  nome: string;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  data_inicio: string;
  data_fim: string;
  ativo: boolean | null;
}

const Ingressos = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [lotes, setLotes] = useState<LoteIngresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngresso | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteIngresso | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [termos, setTermos] = useState(false);
  const [termosTexto, setTermosTexto] = useState('');
  const [pixInfo, setPixInfo] = useState({ chave: 'fadda@festival.com.br', banco: 'Nubank' });
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/ingressos');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    Promise.all([
      supabase.from('tipos_ingresso').select('*').eq('ativo', true),
      (supabase.from('lotes_ingresso') as any).select('*'),
      supabase.from('site_config').select('*').in('chave', ['evento_pix', 'pix_chave', 'pix_banco']),
      (supabase.from('termos_config') as any).select('tipo,conteudo').eq('tipo', 'ingressos').maybeSingle(),
    ]).then(([{ data: tiposData }, { data: lotesData }, { data: configData }, { data: termosData }]) => {
      if (lotesData) setLotes(lotesData as any);

      if (tiposData) {
        setTipos(tiposData as TipoIngresso[]);
      }

      if (configData) {
        const pix = configData.find(c => c.chave === 'evento_pix' || c.chave === 'pix_chave');
        const banco = configData.find(c => c.chave === 'pix_banco');
        if (pix) setPixInfo(prev => ({ ...prev, chave: String(pix.valor).replace(/"/g, '') }));
        if (banco) setPixInfo(prev => ({ ...prev, banco: String(banco.valor).replace(/"/g, '') }));
      }
      if ((termosData as any)?.conteudo) setTermosTexto(String((termosData as any).conteudo || ''));

      setLoading(false);
    });
  }, []);

  const todayISO = new Date().toISOString().split('T')[0];
  const getLoteAtual = (grupoId: string | null) => {
    if (!grupoId) return null;
    const valid = lotes
      .filter(l =>
        l.grupo_id === grupoId &&
        (l.ativo ?? true) &&
        todayISO >= l.data_inicio &&
        todayISO <= l.data_fim &&
        (l.quantidade_total === 0 ? true : (l.quantidade_total - l.quantidade_vendida) > 0)
      )
      .sort((a, b) => a.numero - b.numero);
    return valid[0] || null;
  };

  const availableTipos = tipos
    .filter(t => (t.quantidade_total - t.quantidade_vendida) > 0)
    .filter(t => !!getLoteAtual(t.lote_grupo_id));

  useEffect(() => {
    if (!selectedTipo && availableTipos.length > 0) {
      setSelectedTipo(availableTipos[0]);
    }
    if (selectedTipo && availableTipos.length > 0 && !availableTipos.some(t => t.id === selectedTipo.id)) {
      setSelectedTipo(availableTipos[0]);
      setShowForm(false);
    }
  }, [availableTipos, selectedTipo]);

  useEffect(() => {
    if (!selectedTipo) {
      setSelectedLote(null);
      return;
    }
    setSelectedLote(getLoteAtual(selectedTipo.lote_grupo_id));
  }, [selectedTipo, lotes]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    // Pre-fill profile
    supabase.from('profiles').select('nome, cpf, telefone').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        if (data.nome) setNome(data.nome);
        if (data.cpf) setCpf(data.cpf);
        if (data.telefone) setTelefone(data.telefone);
      }
    });
  }, [user]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('tipos-ingresso-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tipos_ingresso' }, (payload) => {
        console.log('Change detected:', payload);
        Promise.all([
          supabase.from('tipos_ingresso').select('*').eq('ativo', true),
          (supabase.from('lotes_ingresso') as any).select('*'),
        ]).then(([{ data }, { data: lotesData }]) => {
          if (data) setTipos(data as TipoIngresso[]);
          if (lotesData) setLotes(lotesData as any);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes_ingresso' }, () => {
        (supabase.from('lotes_ingresso') as any).select('*').then(({ data }) => {
          if (data) setLotes(data as any);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTipo]);

  const precoFinal = () => {
    if (!selectedLote) return 0;
    return Number(selectedLote.preco || 0) * quantidade;
  };

  const handleOpenForm = () => {
    if (!user) {
      toast({ title: 'Login Necessário', description: 'Você precisa estar logado para comprar ingressos.' });
      navigate('/login?redirect=/ingressos');
      return;
    }
    setShowForm(true);
  };

  const handleCompra = async () => {
    if (!nome || !cpf || !email) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (!isValidCpf(cpf)) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    if (!isValidEmail(email)) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    if (telefone && !isValidPhoneBR(telefone)) {
      toast({ title: 'Telefone inválido', description: 'Use DDD + número (ex: 16999999999).', variant: 'destructive' });
      return;
    }
    if (!termos) {
      toast({ title: 'Aceite os termos para continuar', variant: 'destructive' });
      return;
    }
    if (!selectedTipo || !selectedLote) return;

    setSubmitting(true);
    try {
      // ── "Verifica no envio" ────────────────────────────────────────────────
      const [{ data: currentTipo }, { data: currentLote }] = await Promise.all([
        supabase.from('tipos_ingresso').select('quantidade_total, quantidade_vendida, ativo, lote_grupo_id').eq('id', selectedTipo.id).single(),
        (supabase.from('lotes_ingresso') as any).select('*').eq('id', selectedLote.id).single(),
      ]);

      const loteOk = currentLote
        && (currentLote.ativo ?? true)
        && todayISO >= currentLote.data_inicio
        && todayISO <= currentLote.data_fim
        && (Number(currentLote.quantidade_total) - Number(currentLote.quantidade_vendida)) >= quantidade;

      if (!currentTipo || !currentTipo.ativo || (currentTipo.quantidade_total - currentTipo.quantidade_vendida) < quantidade || !loteOk) {
        toast({
          title: 'Não foi possível finalizar',
          description: 'O estoque mudou ou o ingresso não está mais disponível. Por favor, recomece a seleção.',
          variant: 'destructive'
        });
        setSubmitting(false);
        // Refresh
        const [{ data: freshTipos }, { data: freshLotes }] = await Promise.all([
          supabase.from('tipos_ingresso').select('*').eq('ativo', true),
          (supabase.from('lotes_ingresso') as any).select('*'),
        ]);
        if (freshTipos) setTipos(freshTipos as TipoIngresso[]);
        if (freshLotes) setLotes(freshLotes as any);
        setSelectedTipo(null);
        setSelectedLote(null);
        setShowForm(false);
        return;
      }

      const isGateway = metodoPagamento === 'cartao';

      const { data: saleData, error: saleError } = await supabase.from('ingressos_vendidos').insert({
        tipo_ingresso_id: selectedTipo.id,
        lote_ingresso_id: selectedLote.id,
        user_id: user?.id || null,
        nome_comprador: nome,
        cpf,
        email,
        telefone: telefone || null,
        quantidade,
        valor_total: precoFinal(),
        status: 'pendente',
        metodo_pagamento: metodoPagamento,
      }).select().single();

      if (saleError) throw saleError;

      if (isGateway && saleData) {
        const { data: mpData, error: mpErr } = await supabase.functions.invoke('create-mp-checkout', {
          body: {
            external_reference: saleData.id,
            valor: precoFinal(),
            descricao: `Ingresso: ${selectedTipo.nome} (${selectedLote.nome})`,
            email,
            nome,
            back_urls: {
              success: `${window.location.origin}/ingressos?mp=success`,
              pending: `${window.location.origin}/ingressos?mp=pending`,
              failure: `${window.location.origin}/ingressos?mp=failure`,
            }
          }
        });
        if (mpErr) throw mpErr;
        if (mpData?.preference_id) {
          await supabase.from('ingressos_vendidos').update({ preference_id: mpData.preference_id }).eq('id', saleData.id);
        }
        if (mpData?.init_point) {
          window.location.href = mpData.init_point;
          return;
        }
        throw new Error('Não foi possível iniciar o checkout do Mercado Pago.');
      }

      supabase.functions.invoke('send-pending-payment', {
        body: {
          email,
          nome,
          contexto: 'ingresso',
          descricao: `${quantidade}x ${selectedTipo.nome} (${selectedLote.nome})`,
          valor: precoFinal(),
          metodo: metodoPagamento,
        }
      }).catch(console.error);
      toast({
        title: '🎫 Compra registrada!',
        description: 'Aguardando confirmação do pagamento.',
      });
      setShowForm(false);
      setQuantidade(1);
      setTermos(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  const disponivel = selectedLote ? (selectedLote.quantidade_total - selectedLote.quantidade_vendida) : 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            Ingressos
          </h1>
          <p className="text-muted-foreground font-sans">Compre seu ingresso para o festival</p>
        </div>

        {availableTipos.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-10 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sans">Nenhum ingresso disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {availableTipos.map(tipo => {
              const isSelected = selectedTipo?.id === tipo.id;
              const loteAtual = getLoteAtual(tipo.lote_grupo_id);
              const restante = loteAtual ? (loteAtual.quantidade_total - loteAtual.quantidade_vendida) : 0;
              return (
                <Card
                  key={tipo.id}
                  className={`bg-card cursor-pointer transition-colors ${isSelected ? 'border-2 border-gold/60' : 'border-border hover:border-gold/30'}`}
                  onClick={() => { setSelectedTipo(tipo); setQuantidade(1); }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-serif font-bold text-foreground">{tipo.nome}</p>
                        {tipo.descricao && <p className="text-sm text-muted-foreground font-sans">{tipo.descricao}</p>}
                        <p className="text-xs text-muted-foreground font-sans mt-1">
                          {loteAtual ? `${loteAtual.nome} • ${restante} disponíveis` : 'Sem lote ativo'}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary font-sans">R$ {Number(loteAtual?.preco || 0).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedTipo && selectedLote && (
              <Card className="bg-card border-2 border-gold/40">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-serif font-semibold text-foreground">{selectedTipo.nome}</p>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="border-border">
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-xl font-bold text-foreground font-sans w-8 text-center">{quantidade}</span>
                      <Button variant="outline" size="icon" onClick={() => setQuantidade(q => Math.min(q + 1, disponivel))} className="border-border">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="font-sans text-foreground">{quantidade} ingresso{quantidade > 1 ? 's' : ''}</span>
                    <span className="font-bold text-xl text-primary font-sans">Total: R$ {precoFinal().toFixed(2)}</span>
                  </div>
                  <Button onClick={handleOpenForm} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shimmer">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Comprar Agora
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase Form Modal */}
        {showForm && selectedTipo && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <Card className="bg-card border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="font-serif text-foreground">Dados do Comprador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground font-sans">Nome Completo *</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">CPF *</Label>
                  <Input value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Email *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(normalizePhoneBR(e.target.value))} placeholder="16999999999" className="bg-background border-border text-foreground" />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-1 font-sans text-sm">
                  <p className="font-semibold text-foreground">Resumo</p>
                  <p className="text-muted-foreground">{quantidade}x {selectedTipo.nome} — {selectedLote?.nome} — R$ {Number(selectedLote?.preco || 0).toFixed(2)} cada</p>
                  <p className="text-primary font-bold text-base">Total: R$ {precoFinal().toFixed(2)}</p>
                </div>

                <div className="rounded-xl border-2 border-gold/40 bg-primary/5 p-4 text-center font-sans space-y-1">
                  <Select value={metodoPagamento} onValueChange={(value) => setMetodoPagamento(value as 'pix' | 'cartao')}>
                    <SelectTrigger className="bg-background border-border text-foreground mb-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Mercado Pago (Checkout Pro)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Pagamento via PIX</p>
                  <p className="text-foreground font-bold text-lg">{pixInfo.chave}</p>
                  <p className="text-xs text-muted-foreground">
                    {metodoPagamento === 'pix'
                      ? `${pixInfo.banco} — Envie o comprovante após a compra`
                      : metodoPagamento === 'dinheiro'
                        ? 'Pagamento em dinheiro: confirmação manual pela organização.'
                        : 'Você será redirecionado para o checkout do Mercado Pago.'}
                  </p>
                </div>

                {termosTexto && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-left font-sans space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Termos de compra</p>
                    <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                      {termosTexto}
                    </div>
                  </div>
                )}

                <label htmlFor="termos_ingresso" className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <Checkbox id="termos_ingresso" checked={termos} onCheckedChange={v => setTermos(!!v)} className="mt-0.5 shrink-0" />
                  <span className="text-sm font-sans text-foreground">Declaro que li e aceito os termos e condições de compra de ingressos.</span>
                </label>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground font-sans">Cancelar</Button>
                  <Button onClick={handleCompra} disabled={submitting || !termos} className="flex-1 bg-gradient-gold text-primary-foreground font-sans">
                    {submitting ? 'Processando...' : 'Confirmar Compra'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ingressos;
