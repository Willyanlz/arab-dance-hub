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
import { initializePaymentGateway } from '@/lib/paymentGateway';

interface TipoIngresso {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean;
  lote_ingresso_id: string | null;
}

const Ingressos = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngresso | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [termos, setTermos] = useState(false);
  const [pixInfo, setPixInfo] = useState({ chave: 'fadda@festival.com.br', banco: 'Nubank' });
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/ingressos');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    Promise.all([
      supabase.from('tipos_ingresso').select('*').eq('ativo', true),
      supabase.from('site_config').select('*').in('chave', ['evento_pix', 'pix_chave', 'pix_banco']),
    ]).then(([{ data: tiposData }, { data: configData }]) => {
      if (tiposData) {
        const available = (tiposData as TipoIngresso[]).filter(t => (t.quantidade_total - t.quantidade_vendida) > 0);
        setTipos(available);
        if (available.length > 0) setSelectedTipo(available[0]);
      }
      if (configData) {
        const pix = configData.find(c => c.chave === 'evento_pix' || c.chave === 'pix_chave');
        const banco = configData.find(c => c.chave === 'pix_banco');
        if (pix) setPixInfo(prev => ({ ...prev, chave: String(pix.valor).replace(/"/g, '') }));
        if (banco) setPixInfo(prev => ({ ...prev, banco: String(banco.valor).replace(/"/g, '') }));
      }
      setLoading(false);
    });
  }, []);

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
        // Refresh all tipos to stay synced
        supabase.from('tipos_ingresso').select('*').eq('ativo', true).then(({ data }) => {
          if (data) {
            const available = (data as TipoIngresso[]).filter(t => (t.quantidade_total - t.quantidade_vendida) > 0);
            setTipos(available);
            // If the selected one changed or became unavailable
            if (selectedTipo) {
              const updated = data.find(t => t.id === selectedTipo.id);
              if (!updated || updated.quantidade_total - updated.quantidade_vendida <= 0) {
                setSelectedTipo(null);
                setShowForm(false);
                toast({ title: 'Ingresso Esgotado', description: 'O ingresso que você selecionou acabou de se esgotar.', variant: 'destructive' });
              } else {
                setSelectedTipo(updated as TipoIngresso);
              }
            }
          }
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTipo]);

  const precoFinal = () => {
    if (!selectedTipo) return 0;
    return selectedTipo.preco * quantidade;
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
    if (!termos) {
      toast({ title: 'Aceite os termos para continuar', variant: 'destructive' });
      return;
    }
    if (!selectedTipo) return;

    setSubmitting(true);
    try {
      // ── "Verifica no envio" ────────────────────────────────────────────────
      const { data: currentTipo, error: checkError } = await supabase
        .from('tipos_ingresso')
        .select('quantidade_total, quantidade_vendida, ativo')
        .eq('id', selectedTipo.id)
        .single();

      if (checkError || !currentTipo || !currentTipo.ativo || (currentTipo.quantidade_total - currentTipo.quantidade_vendida) < quantidade) {
        toast({ 
          title: 'Não foi possível finalizar', 
          description: 'O estoque mudou ou o ingresso não está mais disponível. Por favor, recomece a seleção.', 
          variant: 'destructive' 
        });
        setSubmitting(false);
        // Refresh
        const { data: freshTipos } = await supabase.from('tipos_ingresso').select('*').eq('ativo', true);
        if (freshTipos) setTipos(freshTipos as TipoIngresso[]);
        setSelectedTipo(null);
        setShowForm(false);
        return;
      }

      const isAutomaticPayment = metodoPagamento === 'cartao';
      const gatewayResult = await initializePaymentGateway({
        metodo: metodoPagamento,
        valor: precoFinal(),
        descricao: `Compra de ingresso: ${selectedTipo.nome}`,
        referenciaId: selectedTipo.id,
      });

      const { data: saleData, error: saleError } = await supabase.from('ingressos_vendidos').insert({
        tipo_ingresso_id: selectedTipo.id,
        lote_ingresso_id: selectedTipo.lote_ingresso_id, // Added this relationship
        user_id: user?.id || null,
        nome_comprador: nome,
        cpf,
        email,
        telefone: telefone || null,
        quantidade,
        valor_total: precoFinal(),
        status: isAutomaticPayment ? 'confirmado' : 'pendente',
      }).select().single();

      if (saleError) throw saleError;

      // Update manual stock if not confirmed by trigger (trigger handles confirmados)
      if (!isAutomaticPayment) {
        // We don't update quantidade_vendida here yet because it's 'pendente'
        // But the business logic might want to reserve it? 
        // For now, following the trigger logic which updates only on confirm/pagamento
      }

      if (isAutomaticPayment && saleData) {
        supabase.functions.invoke('send-ticket', {
          body: {
            email,
            nome_comprador: nome,
            quantidade,
            tipo_ingresso_nome: selectedTipo.nome,
            ingresso_id: saleData.id,
            valor_total: precoFinal(),
          },
        }).catch(console.error);
      }
      toast({
        title: '🎫 Compra registrada!',
        description: isAutomaticPayment
          ? 'Pagamento confirmado automaticamente e ingresso enviado por e-mail.'
          : (gatewayResult.instructions || 'Aguarde a confirmação do pagamento.'),
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

  const disponivel = selectedTipo ? selectedTipo.quantidade_total - selectedTipo.quantidade_vendida : 0;

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

        {tipos.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-10 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sans">Nenhum ingresso disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tipos.map(tipo => {
              const isSelected = selectedTipo?.id === tipo.id;
              const restante = tipo.quantidade_total - tipo.quantidade_vendida;
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
                        <p className="text-xs text-muted-foreground font-sans mt-1">{restante} disponíveis</p>
                      </div>
                      <p className="text-2xl font-bold text-primary font-sans">R$ {Number(tipo.preco).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {selectedTipo && (
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
                  <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Email *</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background border-border text-foreground" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-1 font-sans text-sm">
                  <p className="font-semibold text-foreground">Resumo</p>
                  <p className="text-muted-foreground">{quantidade}x {selectedTipo.nome} — R$ {Number(selectedTipo.preco).toFixed(2)} cada</p>
                  <p className="text-primary font-bold text-base">Total: R$ {precoFinal().toFixed(2)}</p>
                </div>

                <div className="rounded-xl border-2 border-gold/40 bg-primary/5 p-4 text-center font-sans space-y-1">
                  <Select value={metodoPagamento} onValueChange={(value) => setMetodoPagamento(value as 'pix' | 'cartao')}>
                    <SelectTrigger className="bg-background border-border text-foreground mb-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Mercado Pago (cartão)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Pagamento via PIX</p>
                  <p className="text-foreground font-bold text-lg">{pixInfo.chave}</p>
                  <p className="text-xs text-muted-foreground">
                    {metodoPagamento === 'pix'
                      ? `${pixInfo.banco} — Envie o comprovante após a compra`
                      : 'Mercado Pago pré-configurado. Finalização de checkout pode ser ativada em produção.'}
                  </p>
                </div>

                <label htmlFor="termos_ingresso" className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <Checkbox id="termos_ingresso" checked={termos} onCheckedChange={v => setTermos(!!v)} className="mt-0.5 shrink-0" />
                  <span className="text-sm font-sans text-foreground">Declaro que li e aceito os termos e condições de compra de ingressos do F.A.D.D.A.</span>
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
