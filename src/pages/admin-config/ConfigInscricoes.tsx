import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Trophy, Star, BookOpen, Clock } from 'lucide-react';

export const ConfigInscricoes = () => {
  const [loading, setLoading] = useState(true);
  const [abrirCompeticao, setAbrirCompeticao] = useState(true);
  const [abrirMostra, setAbrirMostra] = useState(true);
  const [abrirWorkshop, setAbrirWorkshop] = useState(true);
  const [configDobro, setConfigDobro] = useState<Record<string, { ativo: boolean; data: string; hora: string }>>({
    competicao: { ativo: false, data: '', hora: '00:00' },
    mostra: { ativo: false, data: '', hora: '00:00' },
    workshop: { ativo: false, data: '', hora: '00:00' },
  });

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
      
      setConfigDobro({
        competicao: map.config_dobro_competicao || { ativo: false, data: '', hora: '00:00' },
        mostra: map.config_dobro_mostra || { ativo: false, data: '', hora: '00:00' },
        workshop: map.config_dobro_workshop || { ativo: false, data: '', hora: '00:00' },
      });
    }
    setLoading(false);
  };

  const saveToggle = async (chave: string, val: boolean) => {
    const { error } = await supabase.from('site_config').upsert({ chave, valor: val } as any, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Salvo!' });
  };

  const saveDobroConfig = async (tipo: string, val: any) => {
    const chave = `config_dobro_${tipo}`;
    const { error } = await supabase.from('site_config').upsert({ chave, valor: val } as any, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
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

      <CardHeader className="pt-8 border-t border-border mt-4">
        <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Regras de Preço Dobrado
        </CardTitle>
        <CardDescription className="font-sans text-muted-foreground">Configure quando os valores das inscrições devem dobrar automaticamente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { id: 'competicao', label: 'Competição', icon: Trophy },
          { id: 'mostra', label: 'Mostra', icon: Star },
          { id: 'workshop', label: 'Workshop', icon: BookOpen },
        ].map(({ id, label, icon: Icon }) => {
          const config = configDobro[id];
          return (
            <div key={id} className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-primary" />
                  <p className="font-medium text-foreground font-sans text-sm">{label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Dobrar Preço?</span>
                  <Switch 
                    checked={config.ativo} 
                    onCheckedChange={(v) => {
                      const next = { ...config, ativo: v };
                      setConfigDobro({ ...configDobro, [id]: next });
                      saveDobroConfig(id, next);
                    }} 
                  />
                </div>
              </div>

              {config.ativo && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Data de Início</Label>
                    <Input 
                      type="date" 
                      value={config.data} 
                      onChange={(e) => {
                        const next = { ...config, data: e.target.value };
                        setConfigDobro({ ...configDobro, [id]: next });
                        saveDobroConfig(id, next);
                      }}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Horário de Início</Label>
                    <Input 
                      type="time" 
                      value={config.hora} 
                      onChange={(e) => {
                        const next = { ...config, hora: e.target.value };
                        setConfigDobro({ ...configDobro, [id]: next });
                        saveDobroConfig(id, next);
                      }}
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                  <p className="col-span-2 text-[10px] text-muted-foreground italic font-sans">
                    A partir desta data e hora, todos os valores para {label} serão multiplicados por 2.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
