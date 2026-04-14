import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Trophy, Star, BookOpen } from 'lucide-react';

export const ConfigInscricoes = () => {
  const [loading, setLoading] = useState(true);
  const [abrirCompeticao, setAbrirCompeticao] = useState(true);
  const [abrirMostra, setAbrirMostra] = useState(true);
  const [abrirWorkshop, setAbrirWorkshop] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_config').select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((c: any) => { if (c && c.chave) map[c.chave] = c.valor; });
      setAbrirCompeticao(map.inscricoes_abertas_competicao !== false);
      setAbrirMostra(map.inscricoes_abertas_mostra !== false);
      setAbrirWorkshop(map.inscricoes_abertas_workshop !== false);
    }
    setLoading(false);
  };

  const saveToggle = async (chave: string, val: boolean) => {
    const { error } = await supabase.from('site_config').upsert({ chave, valor: val } as any, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Salvo!' });
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando controle...</div>;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-foreground text-lg">Controle de Inscrições</CardTitle>
        <CardDescription className="font-sans text-muted-foreground">Ative ou desative inscrições por tipo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { icon: Trophy, label: 'Competição', state: abrirCompeticao, setState: setAbrirCompeticao, chave: 'inscricoes_abertas_competicao' },
          { icon: Star, label: 'Mostra', state: abrirMostra, setState: setAbrirMostra, chave: 'inscricoes_abertas_mostra' },
          { icon: BookOpen, label: 'Workshop', state: abrirWorkshop, setState: setAbrirWorkshop, chave: 'inscricoes_abertas_workshop' },
        ].map(({ icon: Icon, label, state, setState, chave }) => (
          <div key={chave} className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground font-sans">{label}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-sans ${state ? 'text-green-600' : 'text-red-500'}`}>{state ? 'Aberto' : 'Fechado'}</span>
              <Switch checked={state} onCheckedChange={async (v) => { setState(v); await saveToggle(chave, v); }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
