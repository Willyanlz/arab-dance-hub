import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { TIPO_INSCRICAO_OPTIONS, type TipoInscricao } from './types';

interface Props {
  inscricoesAbertas: Record<string, boolean>;
  onSelect: (tipo: TipoInscricao) => void;
}

export const StepTipoSelector = ({ inscricoesAbertas, onSelect }: Props) => (
  <div className="space-y-4">
    <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Como deseja participar?</h2>
    {TIPO_INSCRICAO_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => {
      const aberta = inscricoesAbertas[value] !== false;
      return (
        <button
          key={value}
          disabled={!aberta}
          onClick={() => onSelect(value)}
          className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${aberta ? 'hover:border-gold/60 hover:bg-card cursor-pointer' : 'opacity-50 cursor-not-allowed'} bg-card border-border flex items-start gap-4 group`}
        >
          <div className={`p-2 rounded-lg bg-primary/10 ${color} mt-0.5`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-serif font-semibold text-foreground">{label}</p>
              {!aberta && <Badge variant="outline" className="text-xs border-border text-muted-foreground font-sans">Encerrado</Badge>}
              {aberta && value === 'mostra' && <Badge className="text-xs bg-primary/15 text-primary border-0 font-sans">🎟️ Ingresso incluso</Badge>}
            </div>
            <p className="text-sm text-muted-foreground font-sans mt-1">{desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1 shrink-0" />
        </button>
      );
    })}
  </div>
);
