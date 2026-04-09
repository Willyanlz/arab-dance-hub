import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Ticket, Minus, Plus } from 'lucide-react';

interface TipoIngresso {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  quantidade_total: number;
  quantidade_vendida: number;
  ativo: boolean;
}

const Ingressos = () => {
  const { user } = useAuth();
  const [tipos, setTipos] = useState<TipoIngresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cart
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});

  // Buyer info
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.from('tipos_ingresso').select('*').eq('ativo', true).then(({ data }) => {
      if (data) setTipos(data as TipoIngresso[]);
      setLoading(false);
    });
  }, []);

  const updateQtd = (id: string, delta: number) => {
    setCarrinho(prev => {
      const current = prev[id] || 0;
      const novo = Math.max(0, current + delta);
      const tipo = tipos.find(t => t.id === id);
      if (tipo && novo > (tipo.quantidade_total - tipo.quantidade_vendida)) return prev;
      if (novo === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: novo };
    });
  };

  const totalCarrinho = Object.entries(carrinho).reduce((sum, [id, qtd]) => {
    const tipo = tipos.find(t => t.id === id);
    return sum + (tipo ? tipo.preco * qtd : 0);
  }, 0);

  const totalItens = Object.values(carrinho).reduce((s, q) => s + q, 0);

  const handleCompra = async () => {
    if (!nome || !cpf || !email) {
      toast({ title: 'Preencha os dados obrigatórios', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      for (const [tipoId, qtd] of Object.entries(carrinho)) {
        const tipo = tipos.find(t => t.id === tipoId);
        if (!tipo) continue;
        await supabase.from('ingressos_vendidos').insert({
          tipo_ingresso_id: tipoId,
          user_id: user?.id || null,
          nome_comprador: nome,
          cpf,
          email,
          telefone: telefone || null,
          quantidade: qtd,
          valor_total: tipo.preco * qtd,
        });
      }
      toast({ title: 'Compra registrada!', description: 'Aguarde confirmação do pagamento.' });
      setCarrinho({});
      setShowForm(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
          <Ticket className="inline-block w-8 h-8 text-primary mr-2 mb-1" />
          Ingressos
        </h1>
        <p className="text-muted-foreground font-sans mb-8">9º F.A.D.D.A - Compre seus ingressos</p>

        {tipos.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground font-sans">Nenhum ingresso disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-8">
            {tipos.map(tipo => {
              const disponivel = tipo.quantidade_total - tipo.quantidade_vendida;
              const qtd = carrinho[tipo.id] || 0;
              return (
                <Card key={tipo.id} className="bg-card border-border">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-foreground text-lg">{tipo.nome}</h3>
                      {tipo.descricao && <p className="text-sm text-muted-foreground font-sans">{tipo.descricao}</p>}
                      <p className="text-primary font-bold text-xl font-sans mt-1">R$ {Number(tipo.preco).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground font-sans">{disponivel} disponíveis</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="icon" onClick={() => updateQtd(tipo.id, -1)} disabled={qtd === 0} className="border-border"><Minus className="w-4 h-4" /></Button>
                      <span className="text-lg font-bold text-foreground font-sans w-8 text-center">{qtd}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQtd(tipo.id, 1)} disabled={disponivel <= 0} className="border-border"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {totalItens > 0 && !showForm && (
          <Card className="bg-card border-border sticky bottom-4">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-foreground font-sans font-medium">{totalItens} ingresso(s)</p>
                <p className="text-primary font-bold text-xl font-sans">R$ {totalCarrinho.toFixed(2)}</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="bg-gradient-gold text-primary-foreground font-sans">Finalizar Compra</Button>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="bg-card border-border">
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
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-foreground font-sans font-medium">Resumo</p>
                {Object.entries(carrinho).map(([id, qtd]) => {
                  const tipo = tipos.find(t => t.id === id);
                  if (!tipo) return null;
                  return <p key={id} className="text-sm text-muted-foreground font-sans">{qtd}x {tipo.nome} — R$ {(tipo.preco * qtd).toFixed(2)}</p>;
                })}
                <hr className="border-border my-2" />
                <p className="text-primary font-bold font-sans">Total: R$ {totalCarrinho.toFixed(2)}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={handleCompra} disabled={submitting} className="flex-1 bg-gradient-gold text-primary-foreground font-sans">
                  {submitting ? 'Processando...' : 'Confirmar Compra'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Ingressos;
