import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { MODALIDADES, CATEGORIAS, PERIODOS } from '@/lib/constants';
import { getLoteAtual, calcularPreco, calcularDesconto } from '@/lib/pricing';
import type { Database } from '@/integrations/supabase/types';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

type Lote = Database['public']['Tables']['lotes']['Row'];
type Categoria = Database['public']['Enums']['categoria_tipo'];

interface Participante {
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
}

const Inscricao = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteAtual, setLoteAtual] = useState<Lote | null>(null);

  // Profile
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isJalilete, setIsJalilete] = useState(false);
  const [isAnterior, setIsAnterior] = useState(false);

  // Inscrição
  const [categoria, setCategoria] = useState<Categoria>('solo');
  const [modalidade, setModalidade] = useState('');
  const [nomeEscola, setNomeEscola] = useState('');
  const [professora, setProfessora] = useState('');
  const [nomeCoreografia, setNomeCoreografia] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [tipoMusica, setTipoMusica] = useState<'solta' | 'posicionada'>('solta');
  const [periodo, setPeriodo] = useState<'manha' | 'tarde' | 'nao_competir'>('manha');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    supabase.from('lotes').select('*').order('numero').then(({ data }) => {
      if (data) {
        setLotes(data);
        setLoteAtual(getLoteAtual(data));
      }
    });
  }, []);

  const numIntegrantes = categoria === 'solo' ? 1 : categoria === 'dupla_trio' ? participantes.length + 1 : participantes.length + 1;

  const isEventDay = (() => {
    const today = new Date().toISOString().split('T')[0];
    return today === '2026-08-08' || today === '2026-08-09';
  })();

  const precoBase = loteAtual ? calcularPreco(loteAtual, categoria, numIntegrantes, isEventDay) : 0;
  const { percentual: desconto, valorFinal } = calcularDesconto(precoBase, isJalilete, isAnterior);

  const addParticipante = () => {
    setParticipantes([...participantes, { nome: '', cpf: '', email: '', telefone: '' }]);
  };

  const removeParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

  const updateParticipante = (index: number, field: keyof Participante, value: string) => {
    const updated = [...participantes];
    updated[index] = { ...updated[index], [field]: value };
    setParticipantes(updated);
  };

  const handleSubmit = async () => {
    if (!user || !loteAtual) return;
    setLoading(true);
    try {
      // Update profile
      await supabase.from('profiles').update({
        cpf, telefone, is_aluna_jalilete: isJalilete, participante_anterior: isAnterior,
      }).eq('user_id', user.id);

      // Create inscription
      const { data: inscricao, error: inscError } = await supabase.from('inscricoes').insert({
        user_id: user.id,
        categoria,
        modalidade,
        nome_escola: nomeEscola || null,
        professora: professora || null,
        nome_coreografia: nomeCoreografia,
        nome_artistico: nomeArtistico || null,
        tipo_musica: tipoMusica,
        periodo,
        lote_id: loteAtual.id,
        valor_total: precoBase,
        desconto_percentual: desconto,
        valor_final: valorFinal,
        num_integrantes: numIntegrantes,
      }).select().single();

      if (inscError) throw inscError;

      // Add participants
      if (participantes.length > 0 && inscricao) {
        const { error: partError } = await supabase.from('participantes').insert(
          participantes.map(p => ({
            inscricao_id: inscricao.id,
            nome: p.nome,
            cpf: p.cpf || null,
            email: p.email || null,
            telefone: p.telefone || null,
          }))
        );
        if (partError) throw partError;
      }

      // Create payment record
      if (inscricao) {
        await supabase.from('pagamentos').insert({
          inscricao_id: inscricao.id,
          metodo: metodoPagamento,
          valor: valorFinal,
        });
      }

      toast({ title: 'Inscrição realizada!', description: 'Aguarde a confirmação do pagamento.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Inscrição</h1>
        <p className="text-muted-foreground font-sans mb-8">9º F.A.D.D.A - Festival Araraquarense de Danças Árabes</p>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-gradient-gold' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: Dados pessoais */}
        {step === 1 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">1. Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-foreground font-sans">CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Telefone</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="jalilete" checked={isJalilete} onCheckedChange={(v) => setIsJalilete(!!v)} />
                <label htmlFor="jalilete" className="text-sm font-sans text-foreground">Sou aluna Jalilete (desconto 10%)</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="anterior" checked={isAnterior} onCheckedChange={(v) => setIsAnterior(!!v)} />
                <label htmlFor="anterior" className="text-sm font-sans text-foreground">Participei em edições anteriores (desconto 5%)</label>
              </div>
              <Button onClick={() => setStep(2)} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Detalhes da apresentação */}
        {step === 2 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">2. Detalhes da Apresentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-foreground font-sans">Categoria</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground font-sans">Modalidade</Label>
                <Select value={modalidade} onValueChange={setModalidade}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {MODALIDADES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground font-sans">Nome da Coreografia *</Label>
                <Input value={nomeCoreografia} onChange={e => setNomeCoreografia(e.target.value)} required className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Nome Artístico</Label>
                <Input value={nomeArtistico} onChange={e => setNomeArtistico(e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Nome da Escola</Label>
                <Input value={nomeEscola} onChange={e => setNomeEscola(e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Professora</Label>
                <Input value={professora} onChange={e => setProfessora(e.target.value)} className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Tipo de Música</Label>
                <Select value={tipoMusica} onValueChange={(v) => setTipoMusica(v as 'solta' | 'posicionada')}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solta">Solta</SelectItem>
                    <SelectItem value="posicionada">Posicionada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground font-sans">Período</Label>
                <Select value={periodo} onValueChange={(v) => setPeriodo(v as any)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Avisos de modalidade */}
              {modalidade === 'Semi-profissional' && (
                <div className="p-3 bg-primary/10 rounded-lg text-sm font-sans text-foreground border border-gold/30">
                  ⚠️ <strong>Semi-profissional:</strong> Tema obrigatório FILMES. Use elementos (espada, asas, etc). NÃO use véu simples.
                </div>
              )}
              {modalidade === 'Profissional' && (
                <div className="p-3 bg-primary/10 rounded-lg text-sm font-sans text-foreground border border-gold/30">
                  ⚠️ <strong>Profissional:</strong> Música sorteada. Uso obrigatório de véu (dependendo do tipo).
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={() => { if (!modalidade || !nomeCoreografia) { toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' }); return; } setStep(3); }} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Participantes (for dupla/trio/grupo) */}
        {step === 3 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">3. Participantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoria === 'solo' ? (
                <p className="text-muted-foreground font-sans">Categoria solo — apenas você.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-sans">
                    Adicione os demais participantes ({categoria === 'dupla_trio' ? 'dupla ou trio' : 'grupo'}).
                  </p>
                  {participantes.map((p, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-foreground font-sans">Participante {i + 2}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeParticipante(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                      <Input placeholder="Nome" value={p.nome} onChange={e => updateParticipante(i, 'nome', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="CPF" value={p.cpf} onChange={e => updateParticipante(i, 'cpf', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="Email" value={p.email} onChange={e => updateParticipante(i, 'email', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="Telefone" value={p.telefone} onChange={e => updateParticipante(i, 'telefone', e.target.value)} className="bg-background border-border text-foreground" />
                    </div>
                  ))}
                  <Button variant="outline" onClick={addParticipante} className="w-full border-border text-foreground font-sans">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Participante
                  </Button>
                </>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Pagamento e resumo */}
        {step === 4 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-serif text-foreground">4. Resumo e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2 font-sans">
                <div className="flex justify-between text-sm text-foreground"><span>Categoria:</span><span className="font-medium">{CATEGORIAS.find(c => c.value === categoria)?.label}</span></div>
                <div className="flex justify-between text-sm text-foreground"><span>Modalidade:</span><span className="font-medium">{modalidade}</span></div>
                <div className="flex justify-between text-sm text-foreground"><span>Coreografia:</span><span className="font-medium">{nomeCoreografia}</span></div>
                <div className="flex justify-between text-sm text-foreground"><span>Período:</span><span className="font-medium">{PERIODOS.find(p => p.value === periodo)?.label}</span></div>
                <div className="flex justify-between text-sm text-foreground"><span>Lote:</span><span className="font-medium">{loteAtual?.nome || 'N/A'}</span></div>
                {numIntegrantes > 1 && <div className="flex justify-between text-sm text-foreground"><span>Integrantes:</span><span className="font-medium">{numIntegrantes}</span></div>}
                <hr className="border-border" />
                <div className="flex justify-between text-sm text-foreground"><span>Valor base:</span><span>R$ {precoBase.toFixed(2)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-sm text-primary"><span>Desconto ({desconto}%):</span><span>- R$ {(precoBase - valorFinal).toFixed(2)}</span></div>}
                <div className="flex justify-between text-lg font-bold text-foreground"><span>Total:</span><span className="text-primary">R$ {valorFinal.toFixed(2)}</span></div>
              </div>

              <div>
                <Label className="text-foreground font-sans">Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={(v) => setMetodoPagamento(v as 'pix' | 'cartao')}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão (simulado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {metodoPagamento === 'pix' && (
                <div className="p-4 bg-muted rounded-lg text-center font-sans">
                  <p className="text-sm text-muted-foreground mb-2">Chave PIX:</p>
                  <p className="font-bold text-foreground text-lg">fadda@festival.com.br</p>
                  <p className="text-xs text-muted-foreground mt-2">Envie o comprovante para confirmação</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
                  {loading ? 'Processando...' : 'Confirmar Inscrição'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inscricao;
