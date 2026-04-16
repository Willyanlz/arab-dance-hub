import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { isValidCpf, isValidPhoneBR, maskCpf, maskPhone } from '@/lib/inputValidation';
import { TIPO_INSCRICAO_OPTIONS, type TipoInscricao } from './types';

interface Props {
  tipoInscricao: TipoInscricao;
  cpf: string;
  setCpf: (v: string) => void;
  telefone: string;
  setTelefone: (v: string) => void;
  isJalilete: boolean;
  setIsJalilete: (v: boolean) => void;
  isAnterior: boolean;
  setIsAnterior: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepDadosPessoais = ({
  tipoInscricao, cpf, setCpf, telefone, setTelefone,
  isJalilete, setIsJalilete, isAnterior, setIsAnterior,
  onBack, onNext,
}: Props) => {
  const handleNext = () => {
    if (!isValidCpf(cpf)) { toast({ title: 'CPF inválido', variant: 'destructive' }); return; }
    if (!isValidPhoneBR(telefone)) { toast({ title: 'Telefone inválido', description: 'Use DDD + número (ex: 16999999999).', variant: 'destructive' }); return; }
    onNext();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          {TIPO_INSCRICAO_OPTIONS.find(t => t.value === tipoInscricao) && (
            <Badge className="bg-primary/15 text-primary border-0 font-sans text-xs">
              {TIPO_INSCRICAO_OPTIONS.find(t => t.value === tipoInscricao)?.label}
            </Badge>
          )}
        </div>
        <CardTitle className="font-serif text-foreground">1. Dados Pessoais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-foreground font-sans">CPF *</Label>
          <Input value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
        </div>
        <div>
          <Label className="text-foreground font-sans">Telefone / WhatsApp *</Label>
          <Input value={maskPhone(telefone)} onChange={e => setTelefone(e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="jalilete" checked={isJalilete} onCheckedChange={v => setIsJalilete(!!v)} />
          <label htmlFor="jalilete" className="text-sm font-sans text-foreground cursor-pointer">Sou aluna Jalilete <span className="text-primary">(10% desconto em todos os lotes)</span></label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="anterior" checked={isAnterior} onCheckedChange={v => setIsAnterior(!!v)} />
          <label htmlFor="anterior" className="text-sm font-sans text-foreground cursor-pointer">Participei de edições anteriores <span className="text-primary">(5% desconto em todos os lotes)</span></label>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
          <Button onClick={handleNext} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
        </div>
      </CardContent>
    </Card>
  );
};
