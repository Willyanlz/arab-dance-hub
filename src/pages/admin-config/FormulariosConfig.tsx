import { Link, useLocation, Outlet } from 'react-router-dom';
import { Trophy, Star, BookOpen, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const FormulariosConfig = () => {
  const location = useLocation();
  const currentSubTab = location.pathname.split('/').pop();

  const subTabs = [
    { value: 'competicao', label: 'Competição', icon: Trophy, color: 'text-gold-light' },
    { value: 'mostra', label: 'Mostra', icon: Star, color: 'text-burgundy' },
    { value: 'workshop', label: 'Workshop', icon: BookOpen, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-1 flex gap-1 w-fit">
        {subTabs.map((tab) => {
          const isActive = currentSubTab === tab.value;
          return (
            <Link
              key={tab.value}
              to={`/admin/config/formularios/${tab.value}`}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-sans text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-background shadow-sm text-foreground' 
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${tab.color}`} />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <Outlet />
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-4 flex gap-4">
          <HelpCircle className="w-5 h-5 text-primary shrink-0" />
          <div className="text-xs text-muted-foreground font-sans space-y-2">
            <p className="font-bold text-foreground">Dica sobre Campos Dinâmicos:</p>
            <p>Os campos básicos (CPF, Telefone, etc.) agora podem ser configurados aqui se você desejar mudar o nome ou torná-los opcionais. Caso precise de campos que apareçam apenas em condições especiais (ex: Nome do Pai se menor de idade), use a seção <strong>Lógica Condicional</strong> em cada campo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
