import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { maskCpf, maskPhone } from '@/lib/inputValidation';
import type { Participante, TipoInscricao } from './types';
import type { CategoriaType } from '@/lib/pricing';

interface Props {
  tipoInscricao: TipoInscricao;
  categoria: CategoriaType;
  participantes: Participante[];
  setParticipantes: (p: Participante[]) => void;
  extraHarem: boolean;
  setExtraHarem: (v: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const StepParticipantes = ({
  tipoInscricao, categoria, participantes, setParticipantes,
  extraHarem, setExtraHarem, onBack, onNext,
}: Props) => {
  const addParticipante = () => setParticipantes([...participantes, { nome: '', cpf: '' }]);
  const removeParticipante = (i: number) => setParticipantes(participantes.filter((_, idx) => idx !== i));
  const updateParticipante = (i: number, field: keyof Participante, value: string) => {
    const u = [...participantes];
    u[i] = { ...u[i], [field]: value };
    setParticipantes(u);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="font-serif text-foreground">3. Participantes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {categoria === 'solo' ? (
          <p className="text-muted-foreground font-sans text-sm">Categoria solo — apenas você participa desta inscrição.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-sans">
              Adicione todos os participantes. <strong className="text-foreground">Nome e CPF são obrigatórios</strong> para cada integrante.
            </p>
            {participantes.map((p, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground font-sans">Participante {i + 2}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeParticipante(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
                <Input placeholder="Nome completo *" value={p.nome} onChange={e => updateParticipante(i, 'nome', e.target.value)} className="bg-background border-border text-foreground" />
                <Input placeholder="CPF *" value={p.cpf} onChange={e => updateParticipante(i, 'cpf', maskCpf(e.target.value))} className="bg-background border-border text-foreground" />
                <Input placeholder="E-mail" value={p.email || ''} onChange={e => updateParticipante(i, 'email', e.target.value)} className="bg-background border-border text-foreground" />
                <Input placeholder="Telefone (16) 99999-9999" value={maskPhone(p.telefone || '')} onChange={e => updateParticipante(i, 'telefone', e.target.value.replace(/\D/g, '').slice(0, 11))} className="bg-background border-border text-foreground" />
              </div>
            ))}
            <Button variant="outline" onClick={addParticipante} className="w-full border-border text-foreground font-sans">
              <Plus className="w-4 h-4 mr-2" /> Adicionar Participante
            </Button>
          </>
        )}
        {tipoInscricao === 'mostra' && (
          <div className="flex items-center space-x-2">
            <Checkbox id="harem_m" checked={extraHarem} onCheckedChange={v => setExtraHarem(!!v)} />
            <label htmlFor="harem_m" className="text-sm font-sans text-foreground cursor-pointer">Participar do Harem das Fadas?</label>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
          <Button onClick={onNext} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
        </div>
      </CardContent>
    </Card>
  );
};
