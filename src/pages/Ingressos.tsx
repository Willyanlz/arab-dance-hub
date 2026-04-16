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
import { ArrowLeft, Ticket, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { isValidCpf, isValidEmail, isValidPhoneBR, maskCpf, maskPhone } from '@/lib/inputValidation';

interface LoteIngresso {
  id: string;
  grupo_id: string | null;
  numero: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean | null;
}

interface TipoIngresso {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  grupo_id: string | null;
}

interface CartItem {
  tipo: TipoIngresso;
  lote: LoteIngresso;
  quantidade: number;
}

const Ingressos = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [lotes, setLotes] = useState<LoteIngresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [termos, setTermos] = useState(false);
  const [termosTexto, setTermosTexto] = useState('');
  const [pixInfo, setPixInfo] = useState({ chave: '', banco: '' });
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?redirect=/ingressos');
  }, [authLoading, user, navigate]);

  const loadData = async () => {
    const [{ data: tiposData }, { data: lotesData }, { data: configData }, { data: termosData }] = await Promise.all([
      supabase.from('tipos_ingresso').select('*').eq('ativo', true),
      supabase.from('lotes_ingresso').select('*'),
      supabase.from('site_config').select('*').in('chave', ['pix_chave', 'pix_banco']),
      (supabase.from('termos_config') as any).select('tipo,conteudo').eq('tipo', 'ingressos').maybeSingle(),
    ]);
    if (tiposData) setTipos(tiposData as any[]);
    if (lotesData) setLotes(lotesData as any[]);
    if (configData) {
      const pix = configData.find(c => c.chave === 'pix_chave');
      const banco = configData.find(c => c.chave === 'pix_banco');
      if (pix) setPixInfo(prev => ({ ...prev, chave: String(pix.valor).replace(/"/g, '') }));
      if (banco) setPixInfo(prev => ({ ...prev, banco: String(banco.valor).replace(/"/g, '') }));
    }
    if (termosData?.conteudo) setTermosTexto(String(termosData.conteudo || ''));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    supabase.from('profiles').select('nome, cpf, telefone').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        if (data.nome) setNome(data.nome);
        if (data.cpf) setCpf(data.cpf);
        if (data.telefone) setTelefone(data.telefone);
      }
    });
  }, [user]);

  useEffect(() => {
    const channel = supabase
      .channel('ingressos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tipos_ingresso' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes_ingresso' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lote_ingresso_grupos' }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const todayISO = new Date().toISOString().split('T')[0];

  const getLoteAtual = (grupoId: string | null): LoteIngresso | null => {
    if (!grupoId) return null;
    const grupoLotes = lotes
      .filter(l => l.grupo_id === grupoId && (l.ativo ?? true))
      .filter(l => todayISO >= l.data_inicio && todayISO <= l.data_fim)
      .filter(l => (l.quantidade_total - (l.quantidade_vendida || 0)) > 0)
      .sort((a, b) => a.numero - b.numero);
    return grupoLotes[0] || null;
  };

  const availableTipos = tipos.filter(t => !!getLoteAtual(t.grupo_id));

  // Cart helpers
  const addToCart = (tipo: TipoIngresso) => {
    const lote = getLoteAtual(tipo.grupo_id);
    if (!lote) return;
    const existing = cart.find(c => c.tipo.id === tipo.id);
    const disponivel = lote.quantidade_total - (lote.quantidade_vendida || 0);
    if (existing) {
      if (existing.quantidade >= disponivel) {
        toast({ title: 'Limite atingido', description: `Apenas ${disponivel} disponíveis.`, variant: 'destructive' });
        return;
      }
      setCart(cart.map(c => c.tipo.id === tipo.id ? { ...c, quantidade: c.quantidade + 1 } : c));
    } else {
      setCart([...cart, { tipo, lote, quantidade: 1 }]);
    }
  };

  const updateCartQty = (tipoId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.tipo.id !== tipoId) return c;
      const disponivel = c.lote.quantidade_total - (c.lote.quantidade_vendida || 0);
      const newQty = Math.max(1, Math.min(c.quantidade + delta, disponivel));
      return { ...c, quantidade: newQty };
    }));
  };

  const removeFromCart = (tipoId: string) => {
    setCart(prev => prev.filter(c => c.tipo.id !== tipoId));
  };

  const cartTotal = cart.reduce((s, c) => s + Number(c.lote.preco || 0) * c.quantidade, 0);
  const cartItemCount = cart.reduce((s, c) => s + c.quantidade, 0);

  const handleOpenForm = () => {
    if (!user) {
      toast({ title: 'Login Necessário', description: 'Você precisa estar logado para comprar ingressos.' });
      navigate('/login?redirect=/ingressos');
      return;
    }
    if (cart.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione ingressos ao carrinho.', variant: 'destructive' });
      return;
    }
    setShowForm(true);
  };

  const handleCompra = async () => {
    if (!nome || !cpf || !email) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (!isValidCpf(cpf)) { toast({ title: 'CPF inválido', variant: 'destructive' }); return; }
    if (!isValidEmail(email)) { toast({ title: 'E-mail inválido', variant: 'destructive' }); return; }
    if (telefone && !isValidPhoneBR(telefone)) { toast({ title: 'Telefone inválido', variant: 'destructive' }); return; }
    if (!termos) { toast({ title: 'Aceite os termos para continuar', variant: 'destructive' }); return; }

    setSubmitting(true);
    try {
      // Validate via edge function
      const { data: validation, error: valErr } = await supabase.functions.invoke('validate-ticket-purchase', {
        body: {
          items: cart.map(c => ({ tipo_ingresso_id: c.tipo.id, lote_id: c.lote.id, quantidade: c.quantidade })),
        }
      });
      if (valErr) throw valErr;
      if (validation?.error) {
        toast({ title: 'Erro de validação', description: validation.error, variant: 'destructive' });
        setSubmitting(false);
        loadData();
        return;
      }

      // Insert one record per cart item
      const descParts: string[] = [];
      for (const item of cart) {
        const serverItem = validation?.items?.find((v: any) => v.tipo_ingresso_id === item.tipo.id);
        const valorTotal = serverItem ? serverItem.valor_total : Number(item.lote.preco) * item.quantidade;

        const { error: saleError } = await supabase.from('ingressos_vendidos').insert({
          tipo_ingresso_id: item.tipo.id,
          user_id: user?.id || null,
          nome_comprador: nome,
          cpf,
          email,
          telefone: telefone || null,
          quantidade: item.quantidade,
          valor_total: valorTotal,
          status: 'pendente',
        } as any);

        if (saleError) throw saleError;
        descParts.push(`${item.quantidade}x ${item.tipo.nome} (${item.lote.nome})`);
      }

      supabase.functions.invoke('send-pending-payment', {
        body: { email, nome, contexto: 'ingresso', descricao: descParts.join(', '), valor: cartTotal, metodo: metodoPagamento }
      }).catch(console.error);

      toast({ title: '🎫 Compra registrada!', description: 'Aguardando confirmação do pagamento.' });
      setShowForm(false);
      setCart([]);
      setTermos(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" /> Ingressos
          </h1>
          <p className="text-muted-foreground font-sans">Selecione seus ingressos e adicione ao carrinho</p>
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
              const loteAtual = getLoteAtual(tipo.grupo_id);
              const restante = loteAtual ? (loteAtual.quantidade_total - (loteAtual.quantidade_vendida || 0)) : 0;
              const inCart = cart.find(c => c.tipo.id === tipo.id);
              return (
                <Card key={tipo.id} className={`bg-card transition-colors ${inCart ? 'border-2 border-primary/60' : 'border-border hover:border-primary/30'}`}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-serif font-bold text-foreground">{tipo.nome}</p>
                        {tipo.descricao && <p className="text-sm text-muted-foreground font-sans">{tipo.descricao}</p>}
                        <p className="text-xs text-muted-foreground font-sans mt-1">
                          {loteAtual ? loteAtual.nome : 'Sem lote ativo'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <p className="text-xl sm:text-2xl font-bold text-primary font-sans whitespace-nowrap">R$ {Number(loteAtual?.preco || 0).toFixed(2)}</p>
                        {inCart ? (
                          <div className="flex items-center gap-1.5">
                            <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateCartQty(tipo.id, -1)}>
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-lg font-bold text-foreground font-sans w-6 text-center">{inCart.quantidade}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-border" onClick={() => updateCartQty(tipo.id, 1)}>
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(tipo.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(tipo)} className="bg-gradient-gold text-primary-foreground font-sans text-xs whitespace-nowrap">
                            <Plus className="w-3 h-3 mr-1" /> Adicionar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="bg-card border-2 border-primary/40 sticky bottom-4">
                <CardContent className="p-5 space-y-3">
                  <p className="font-serif font-semibold text-foreground flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" /> Carrinho ({cartItemCount} ingresso{cartItemCount > 1 ? 's' : ''})
                  </p>
                  <div className="space-y-1">
                    {cart.map(item => (
                      <div key={item.tipo.id} className="flex justify-between text-sm font-sans">
                        <span className="text-foreground">{item.quantidade}x {item.tipo.nome}</span>
                        <span className="text-muted-foreground">R$ {(Number(item.lote.preco) * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="font-bold text-xl text-primary font-sans">Total: R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  <Button onClick={handleOpenForm} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shimmer">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Finalizar Compra
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase Form Modal */}
        {showForm && cart.length > 0 && (
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
                  <Input value={maskPhone(telefone)} onChange={e => setTelefone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2 font-sans text-sm">
                  <p className="font-semibold text-foreground">Resumo do Pedido</p>
                  {cart.map(item => (
                    <div key={item.tipo.id} className="flex justify-between text-foreground">
                      <span>{item.quantidade}x {item.tipo.nome} — {item.lote.nome}</span>
                      <span>R$ {(Number(item.lote.preco) * item.quantidade).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-primary font-bold text-base text-right">Total: R$ {cartTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 text-center font-sans space-y-1">
                  <Select value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as any)}>
                    <SelectTrigger className="bg-background border-border text-foreground mb-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Mercado Pago (Checkout Pro)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                    {metodoPagamento === 'pix' ? 'Pagamento via PIX' : metodoPagamento === 'dinheiro' ? 'Pagamento em dinheiro' : 'Checkout Online'}
                  </p>
                  {metodoPagamento === 'pix' && pixInfo.chave && <p className="text-foreground font-bold text-lg">{pixInfo.chave}</p>}
                  <p className="text-xs text-muted-foreground">
                    {metodoPagamento === 'pix' ? `${pixInfo.banco} — Envie o comprovante após a compra` : metodoPagamento === 'dinheiro' ? 'Confirmação manual pela organização.' : 'Redirecionado ao Mercado Pago.'}
                  </p>
                </div>

                {termosTexto && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-left font-sans space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Termos de compra</p>
                    <div className="text-sm text-foreground whitespace-pre-line leading-relaxed">{termosTexto}</div>
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
