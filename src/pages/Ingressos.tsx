import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Ticket, Minus, Plus, Lock, ShoppingCart } from 'lucide-react';

interface LoteIngresso {
  id: string;
  numero: number;
  nome: string;
  data_inicio: string;
  data_fim: string;
  data_dobro: string | null;
  data_limite: string | null;
  preco: number;
  descricao: string | null;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean | null;
}

const Ingressos = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lotes, setLotes] = useState<LoteIngresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quantidade, setQuantidade] = useState(1);
  const [loteAtivo, setLoteAtivo] = useState<LoteIngresso | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [termos, setTermos] = useState(false);
  const [pixInfo, setPixInfo] = useState({ chave: 'fadda@festival.com.br', banco: 'Nubank' });

  // Auth wall redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/ingressos');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Pre-fill from user
    setEmail(user.email || '');

    Promise.all([
      (supabase.from('lotes_ingresso') as any).select('*').eq('ativo', true).order('numero'),
      supabase.from('site_config').select('*').in('chave', ['pix_chave', 'pix_banco']),
    ]).then(([{ data: lotesData }, { data: configData }]) => {
      if (lotesData) {
        const hoje = new Date();
        const loteValido = (lotesData as LoteIngresso[]).find(l => {
          const ini = new Date(l.data_inicio);
          const fim = new Date(l.data_limite || l.data_fim);
          return hoje >= ini && hoje <= fim && (l.quantidade_total - l.quantidade_vendida) > 0;
        });
        setLotes(lotesData as LoteIngresso[]);
        setLoteAtivo(loteValido || null);
      }
      if (configData) {
        const chave = configData.find(c => c.chave === 'pix_chave');
        const banco = configData.find(c => c.chave === 'pix_banco');
        setPixInfo({
          chave: chave ? String(chave.valor).replace(/"/g, '') : 'fadda@festival.com.br',
          banco: banco ? String(banco.valor).replace(/"/g, '') : 'Nubank',
        });
      }
      setLoading(false);
    });

    // Pre-fill profile
    supabase.from('profiles').select('nome, cpf, telefone').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        if (data.nome) setNome(data.nome);
        if (data.cpf) setCpf(data.cpf);
        if (data.telefone) setTelefone(data.telefone);
      }
    });
  }, [user]);

  const precoFinal = () => {
    if (!loteAtivo) return 0;
    const hoje = new Date();
    const dobro = loteAtivo.data_dobro ? new Date(loteAtivo.data_dobro) : null;
    const preco = dobro && hoje >= dobro ? loteAtivo.preco * 2 : loteAtivo.preco;
    return preco * quantidade;
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
    if (!loteAtivo) {
      toast({ title: 'Nenhum lote ativo disponível', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await (supabase.from('ingressos_vendidos') as any).insert({
        tipo_ingresso_id: loteAtivo.id,
        lote_ingresso_id: loteAtivo.id,
        user_id: user?.id || null,
        nome_comprador: nome,
        cpf,
        email,
        telefone: telefone || null,
        quantidade,
        valor_total: precoFinal(),
        status: 'pendente',
      });
      toast({ title: '🎫 Compra registrada!', description: 'Efetue o pagamento via PIX e aguarde a confirmação.' });
      setShowForm(false);
      setQuantidade(1);
      setTermos(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Lock className="w-10 h-10 text-primary mx-auto" />
        <p className="text-muted-foreground font-sans">Redirecionando para login...</p>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  const hoje = new Date();
  const dobro = loteAtivo?.data_dobro ? new Date(loteAtivo.data_dobro) : null;
  const precoBase = loteAtivo?.preco || 0;
  const isDobro = dobro && hoje >= dobro;
  const precoAtual = isDobro ? precoBase * 2 : precoBase;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm gap-1">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-1 flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" />
            Ingressos — 9º F.A.D.D.A
          </h1>
          <p className="text-muted-foreground font-sans">Compre seu ingresso para o festival</p>
        </div>

        {!loteAtivo ? (
          <Card className="bg-card border-border">
            <CardContent className="p-10 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-sans">Nenhum ingresso disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Lote ativo destaque */}
            <Card className="bg-card border-2 border-gold/40 overflow-hidden">
              {isDobro && (
                <div className="bg-destructive text-destructive-foreground text-center text-xs font-sans py-1 px-3 font-semibold">
                  ⚡ Preço dobrado a partir de {new Date(loteAtivo.data_dobro!).toLocaleDateString('pt-BR')}
                </div>
              )}
              <div className="flex items-center gap-2 bg-gradient-gold px-5 py-3">
                <Ticket className="w-5 h-5 text-primary-foreground" />
                <p className="font-serif font-bold text-primary-foreground">{loteAtivo.nome} — Ativo</p>
              </div>
              <CardContent className="p-5 space-y-4">
                {loteAtivo.descricao && <p className="text-sm text-muted-foreground font-sans">{loteAtivo.descricao}</p>}

                <div className="flex items-center justify-between">
                  <div>
                    {isDobro && <p className="text-xs text-muted-foreground font-sans line-through">R$ {precoBase.toFixed(2)}</p>}
                    <p className="text-3xl font-bold text-primary font-sans">R$ {precoAtual.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground font-sans">por ingresso • {loteAtivo.quantidade_total - loteAtivo.quantidade_vendida} disponíveis</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="border-border">
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold text-foreground font-sans w-8 text-center">{quantidade}</span>
                    <Button variant="outline" size="icon" onClick={() => setQuantidade(q => Math.min(q + 1, loteAtivo.quantidade_total - loteAtivo.quantidade_vendida))} className="border-border">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border pt-3">
                  <span className="font-sans text-foreground">{quantidade} ingresso{quantidade > 1 ? 's' : ''}</span>
                  <span className="font-bold text-xl text-primary font-sans">Total: R$ {precoFinal().toFixed(2)}</span>
                </div>

                <Button onClick={() => setShowForm(true)} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shimmer">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Comprar Agora
                </Button>
              </CardContent>
            </Card>

            {/* Todos os lotes (info) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-sans">Histórico de lotes</p>
              {lotes.map(l => {
                const isAtivo = l.id === loteAtivo.id;
                return (
                  <div key={l.id} className={`flex justify-between items-center p-3 rounded-lg border font-sans text-sm ${isAtivo ? 'border-gold/40 bg-primary/5' : 'border-border bg-muted/30 opacity-60'}`}>
                    <span className={isAtivo ? 'text-foreground font-semibold' : 'text-muted-foreground'}>{l.nome}</span>
                    <span className={isAtivo ? 'text-primary font-bold' : 'text-muted-foreground'}>R$ {Number(l.preco).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulário de compra */}
        {showForm && loteAtivo && (
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
                  <p className="text-muted-foreground">{quantidade}x {loteAtivo.nome} — R$ {precoAtual.toFixed(2)} cada</p>
                  <p className="text-primary font-bold text-base">Total: R$ {precoFinal().toFixed(2)}</p>
                </div>

                {/* PIX */}
                <div className="rounded-xl border-2 border-gold/40 bg-primary/5 p-4 text-center font-sans space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Pagamento via PIX</p>
                  <p className="text-foreground font-bold text-lg">{pixInfo.chave}</p>
                  <p className="text-xs text-muted-foreground">{pixInfo.banco} — Envie o comprovante após a compra</p>
                </div>

                <label htmlFor="termos_ingresso" className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <Checkbox id="termos_ingresso" checked={termos} onCheckedChange={v => setTermos(!!v)} className="mt-0.5 shrink-0" />
                  <span className="text-sm font-sans text-foreground">Declaro que li e aceito os termos e condições de compra de ingressos do 9º F.A.D.D.A.</span>
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
