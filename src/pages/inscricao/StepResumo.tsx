import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WORKSHOP_TIPO_COMPRA } from '@/lib/pricing';
import type { TipoInscricao, Participante, WorkshopItem } from './types';

interface Props {
  tipoInscricao: TipoInscricao;
  categoria: string;
  categoriasOptions: { value: string; label: string }[];
  modalidade: string;
  nomeCoreografia: string;
  numIntegrantes: number;
  participantes: Participante[];
  precoBase: number;
  desconto: number;
  valorFinal: number;
  loteNome: string;
  // Workshop
  workshopsSelecionados: string[];
  workshopsDisponiveis: WorkshopItem[];
  tipoCompraWorkshop: string;
  // Shared
  comoSoubeOpcoes: string[];
  comoSoube: string;
  setComoSoube: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
  metodoPagamento: 'pix' | 'dinheiro' | 'cartao';
  setMetodoPagamento: (v: 'pix' | 'dinheiro' | 'cartao') => void;
  pixInfo: { chave: string; banco: string };
  termosTexto: Record<string, string>;
  termosAceitos: boolean;
  setTermosAceitos: (v: boolean) => void;
  loading: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export const StepResumo = ({
  tipoInscricao, categoria, categoriasOptions, modalidade, nomeCoreografia,
  numIntegrantes, participantes, precoBase, desconto, valorFinal, loteNome,
  workshopsSelecionados, workshopsDisponiveis, tipoCompraWorkshop,
  comoSoubeOpcoes, comoSoube, setComoSoube,
  observacoes, setObservacoes,
  metodoPagamento, setMetodoPagamento, pixInfo,
  termosTexto, termosAceitos, setTermosAceitos,
  loading, onBack, onSubmit,
}: Props) => {
  const isWorkshop = tipoInscricao === 'workshop';
  const stepNum = isWorkshop ? 3 : 4;

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="font-serif text-foreground">{stepNum}. Resumo e Pagamento</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-muted p-4 rounded-lg space-y-2 font-sans text-sm">
          <p className="font-semibold text-foreground mb-2">{isWorkshop ? 'Resumo' : 'Resumo da Inscrição'}</p>

          {isWorkshop ? (
            <>
              {workshopsSelecionados.map(id => {
                const w = workshopsDisponiveis.find(wd => wd.id === id);
                return w ? <p key={id} className="text-muted-foreground">• {w.nome} ({w.professor})</p> : null;
              })}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-foreground"><span>Tipo:</span><span>{WORKSHOP_TIPO_COMPRA.find(t => t.value === tipoCompraWorkshop)?.label}</span></div>
                <div className="flex justify-between text-foreground"><span>Lote atual:</span><span>{loteNome || 'N/A'}</span></div>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-foreground"><span>Tipo:</span><span className="capitalize">{tipoInscricao}</span></div>
              <div className="flex justify-between text-foreground"><span>Categoria:</span><span>{categoriasOptions.find(c => c.value === categoria)?.label}</span></div>
              <div className="flex justify-between text-foreground"><span>Modalidade:</span><span>{modalidade}</span></div>
              <div className="flex justify-between text-foreground"><span>Coreografia:</span><span>{nomeCoreografia}</span></div>
              {numIntegrantes > 1 && <div className="flex justify-between text-foreground"><span>Integrantes:</span><span>{numIntegrantes}</span></div>}
              {participantes.length > 0 && (
                <div>
                  <p className="text-primary font-medium mt-1">Participantes:</p>
                  {participantes.map((p, i) => <p key={i} className="text-muted-foreground pl-2">• {p.nome} {p.cpf ? `(${p.cpf})` : ''}</p>)}
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between text-foreground"><span>Lote:</span><span>{loteNome || 'N/A'}</span></div>
                <div className="flex justify-between text-foreground"><span>Valor base:</span><span>R$ {precoBase.toFixed(2)}</span></div>
                {desconto > 0 && <div className="flex justify-between text-primary"><span>Desconto ({desconto}%):</span><span>- R$ {(precoBase - valorFinal).toFixed(2)}</span></div>}
              </div>
            </>
          )}

          <div className="flex justify-between font-bold text-lg text-foreground mt-1"><span>Total:</span><span className="text-primary">R$ {valorFinal.toFixed(2)}</span></div>
          {desconto > 0 && isWorkshop && <p className="text-primary text-xs">Desconto de {desconto}% aplicado</p>}
        </div>

        {/* Termos */}
        {termosTexto[tipoInscricao] && (
          <div className="rounded-xl border-2 border-gold/40 bg-primary/5 overflow-hidden">
            <div className="flex items-center gap-2 bg-gradient-gold px-4 py-3">
              <span className="text-lg">📋</span>
              <p className="font-serif font-bold text-primary-foreground text-base">
                Regulamento — {tipoInscricao === 'competicao' ? 'Competição' : tipoInscricao === 'mostra' ? 'Mostra' : 'Workshop'}
              </p>
            </div>
            <div className="px-4 pt-4 pb-3 space-y-3">
              <div className="max-h-48 overflow-y-auto text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">
                {termosTexto[tipoInscricao]}
              </div>
              <div className="border-t border-gold/20 pt-3">
                <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                  <Checkbox checked={termosAceitos} onCheckedChange={v => setTermosAceitos(!!v)} className="mt-0.5 shrink-0" />
                  <span className="text-sm font-sans text-foreground font-medium">✅ Declaro que li e aceitei os termos e regulamento do 9º F.A.D.D.A.</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {!termosTexto[tipoInscricao] && (
          <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors border border-border">
            <Checkbox checked={termosAceitos} onCheckedChange={v => setTermosAceitos(!!v)} className="mt-0.5 shrink-0" />
            <span className="text-sm font-sans text-foreground">Li e aceito os termos e condições de participação.</span>
          </label>
        )}

        {/* Como soube */}
        {comoSoubeOpcoes.length > 0 && (
          <div>
            <Label className="text-foreground font-sans">Como soube do festival?</Label>
            <Select value={comoSoube} onValueChange={setComoSoube}>
              <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {comoSoubeOpcoes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isWorkshop && (
          <div>
            <Label className="text-foreground font-sans">Observações (opcional)</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="bg-background border-border text-foreground" placeholder="Comentários, dúvidas..." />
          </div>
        )}

        <div>
          <Label className="text-foreground font-sans">Método de Pagamento</Label>
          <Select value={metodoPagamento} onValueChange={v => setMetodoPagamento(v as any)}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="cartao">Mercado Pago (Checkout Pro)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {metodoPagamento === 'pix' && (
          <div className="p-4 bg-muted rounded-lg text-center font-sans">
            <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
            <p className="font-bold text-foreground text-lg">{pixInfo.chave}</p>
            <p className="text-xs text-muted-foreground mt-1">Envie o comprovante para confirmação</p>
          </div>
        )}
        {metodoPagamento === 'dinheiro' && (
          <div className="p-4 bg-muted rounded-lg text-center font-sans">
            <p className="text-sm text-muted-foreground mb-1">Pagamento em dinheiro</p>
            <p className="text-xs text-muted-foreground mt-1">A confirmação será feita manualmente pela organização.</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
          <Button onClick={onSubmit} disabled={loading || !termosAceitos} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shimmer">
            {loading ? 'Processando...' : 'Confirmar Inscrição'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
