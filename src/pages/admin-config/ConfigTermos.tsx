import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Trophy, Star, BookOpen, FileText, Save } from 'lucide-react';

export const ConfigTermos = () => {
  const [loading, setLoading] = useState(true);
  const [termoCompeticao, setTermoCompeticao] = useState('');
  const [termoMostra, setTermoMostra] = useState('');
  const [termoWorkshop, setTermoWorkshop] = useState('');
  const [termoIngressos, setTermoIngressos] = useState('');

  useEffect(() => {
    loadTermos();
  }, []);

  const loadTermos = async () => {
    setLoading(true);
    const { data } = await (supabase.from('termos_config') as any).select('*');
    if (data) {
      data.forEach((t: any) => {
        if (t.tipo === 'competicao') setTermoCompeticao(t.conteudo || '');
        if (t.tipo === 'mostra') setTermoMostra(t.conteudo || '');
        if (t.tipo === 'workshop') setTermoWorkshop(t.conteudo || '');
        if (t.tipo === 'ingressos') setTermoIngressos(t.conteudo || '');
      });
    }
    setLoading(false);
  };

  const saveTermo = async (tipo: string, conteudo: string) => {
    const { error } = await (supabase.from('termos_config') as any).upsert({ tipo, conteudo }, { onConflict: 'tipo' });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Termo atualizado!' });
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando termos...</div>;

  return (
    <div className="space-y-6">
      {[
        { tipo: 'competicao', label: 'Competição', icon: Trophy, state: termoCompeticao, setState: setTermoCompeticao },
        { tipo: 'mostra', label: 'Mostra', icon: Star, state: termoMostra, setState: setTermoMostra },
        { tipo: 'workshop', label: 'Workshop', icon: BookOpen, state: termoWorkshop, setState: setTermoWorkshop },
        { tipo: 'ingressos', label: 'Ingressos', icon: FileText, state: termoIngressos, setState: setTermoIngressos },
      ].map(({ tipo, label, icon: Icon, state, setState }) => (
        <Card key={tipo} className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Icon className="w-5 h-5 text-primary" />Termos — {label}</CardTitle>
            <CardDescription className="font-sans text-muted-foreground text-xs">Texto que aparece antes do aceite "Declaro que li e aceitei os termos".</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={state} onChange={e => setState(e.target.value)} rows={6} className="bg-background border-border text-foreground font-sans text-sm" />
            <Button onClick={() => saveTermo(tipo, state)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
