import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Calendar, Trophy, Star, Shield } from 'lucide-react';

export const ConfigEvento = () => {
  const [loading, setLoading] = useState(true);
  const [eventoNome, setEventoNome] = useState('F.A.D.D.A');
  const [eventoData, setEventoData] = useState('');
  const [eventoLocal, setEventoLocal] = useState('');
  const [eventoHorario, setEventoHorario] = useState('');
  const [eventoPix, setEventoPix] = useState('');
  const [pixBanco, setPixBanco] = useState('');
  const [eventoEdicao, setEventoEdicao] = useState('');
  const [eventoSubtitulo, setEventoSubtitulo] = useState('');
  const [eventoDescricao, setEventoDescricao] = useState('');
  const [eventoBackgroundUrl, setEventoBackgroundUrl] = useState('');
  const [rodapeTexto, setRodapeTexto] = useState('');
  
  const [regrasEProibicoes, setRegrasEProibicoes] = useState('');
  const [premiacoes, setPremiacoes] = useState<{categoria:string;valor:string}[]>([]);
  const [pontuacao, setPontuacao] = useState<{criterio:string;percentual:number}[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('site_config').select('*');
    if (data) {
      const map: Record<string, any> = {};
      data.forEach((c: any) => { if (c && c.chave) map[c.chave] = c.valor; });
      setEventoNome(map.evento_nome || 'F.A.D.D.A');
      setEventoData(map.evento_data || '');
      setEventoLocal(map.evento_local || '');
      setEventoHorario(map.evento_horario || '');
      setEventoPix(map.evento_pix || '');
      setPixBanco(map.pix_banco || '');
      setEventoEdicao(map.evento_edicao || '');
      setEventoSubtitulo(map.evento_subtitulo || '');
      setEventoDescricao(map.evento_descricao || '');
      setEventoBackgroundUrl(map.evento_background_url || '');
      setRodapeTexto(map.rodape_texto || '');
      setRegrasEProibicoes(map.regras_e_proibicoes || '');
      
      // Fallback migration if new field is empty but old fields had data
      if (!map.regras_e_proibicoes && (map.regras_musica?.length > 0 || map.regras_proibicoes?.length > 0)) {
        let combined = '';
        if (map.regras_musica?.length > 0) {
          combined += 'REGRAS DE MÚSICA:\n' + map.regras_musica.filter(Boolean).map((r: string) => `• ${r}`).join('\n') + '\n\n';
        }
        if (map.regras_proibicoes?.length > 0) {
          combined += 'PROIBIÇÕES:\n' + map.regras_proibicoes.filter(Boolean).map((r: string) => `• ${r}`).join('\n');
        }
        setRegrasEProibicoes(combined.trim());
      }
      setPremiacoes(map.premiacoes || []);
      setPontuacao(map.pontuacao || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const upsert = async (chave: string, valor: any) => {
    const { error } = await supabase.from('site_config').upsert({ chave, valor } as any, { onConflict: 'chave' });
    if (error) {
      console.error(`[ConfigEvento] Erro ao salvar "${chave}":`, error);
      throw new Error(`Falha ao salvar "${chave}": ${error.message}`);
    }
  };

  const saveAll = async () => {
    const templateMirror = {
      titulo_email: eventoNome || 'F.A.D.D.A',
      subtitulo_email: eventoSubtitulo || 'Festival Araraquarense de Danças Árabes',
      rodape_evento: eventoEdicao || '9º F.A.D.D.A - 2026',
      rodape_local: eventoLocal || 'Araraquara, São Paulo',
    };

    const { data: templateData } = await supabase
      .from('site_config')
      .select('chave,valor')
      .in('chave', ['email_template_ingresso', 'email_template_inscricao']);

    const templateMap: Record<string, any> = {};
    (templateData || []).forEach((item: any) => { templateMap[item.chave] = item.valor; });

    try {
      await Promise.all([
        upsert('evento_nome', eventoNome),
        upsert('evento_data', eventoData),
        upsert('evento_local', eventoLocal),
        upsert('evento_horario', eventoHorario),
        upsert('evento_pix', eventoPix),
        upsert('pix_chave', eventoPix),
        upsert('pix_banco', pixBanco),
        upsert('evento_edicao', eventoEdicao),
        upsert('evento_subtitulo', eventoSubtitulo),
        upsert('evento_descricao', eventoDescricao),
        upsert('evento_background_url', eventoBackgroundUrl),
        upsert('rodape_texto', rodapeTexto),
        upsert('regras_e_proibicoes', regrasEProibicoes),
        upsert('premiacoes', premiacoes),
        upsert('pontuacao', pontuacao),
        upsert('email_template_ingresso', { ...(templateMap.email_template_ingresso || {}), ...templateMirror }),
        upsert('email_template_inscricao', { ...(templateMap.email_template_inscricao || {}), ...templateMirror }),
      ]);
      toast({ title: '✅ Informações do evento salvas com sucesso!' });
    } catch (err: any) {
      toast({ title: '❌ Erro ao salvar', description: err.message, variant: 'destructive' });
    }
  };

  const handleBackgroundUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setEventoBackgroundUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Removed array-based rule handlers

  const addPremiacao = () => setPremiacoes([...premiacoes, { categoria: '', valor: '' }]);
  const addPontuacao = () => setPontuacao([...pontuacao, { criterio: '', percentual: 0 }]);

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando info...</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* ── INFO GERAL ── */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />Informações Gerais
          </CardTitle>
          <CardDescription className="text-xs">Dados básicos do festival exibidos na Landing Page.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Edição</Label><Input value={eventoEdicao} onChange={e => setEventoEdicao(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Nome do Evento</Label><Input value={eventoNome} onChange={e => setEventoNome(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Subtítulo</Label><Input value={eventoSubtitulo} onChange={e => setEventoSubtitulo(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Data</Label><Input value={eventoData} onChange={e => setEventoData(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Local</Label><Input value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Horários</Label><Input value={eventoHorario} onChange={e => setEventoHorario(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Chave PIX</Label><Input value={eventoPix} onChange={e => setEventoPix(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs uppercase font-bold text-muted-foreground">Banco PIX (opcional)</Label><Input value={pixBanco} onChange={e => setPixBanco(e.target.value)} className="bg-background border-border" /></div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3"><Label className="text-xs uppercase font-bold text-muted-foreground">Rodapé (opcional)</Label><Input value={rodapeTexto} onChange={e => setRodapeTexto(e.target.value)} placeholder="Ex: CNPJ, responsável, etc. (se vazio, não aparece)" className="bg-background border-border" /></div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Background principal (Landing)</Label>
              <Input
                value={eventoBackgroundUrl}
                onChange={e => setEventoBackgroundUrl(e.target.value)}
                className="bg-background border-border mb-2"
                placeholder="https://... ou upload abaixo"
              />
              <Input type="file" accept="image/*" onChange={e => handleBackgroundUpload(e.target.files?.[0])} className="bg-background border-border" />
              {eventoBackgroundUrl && (
                <img src={eventoBackgroundUrl} alt="Preview do background" className="mt-3 h-32 w-full object-cover rounded-lg border border-border" />
              )}
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Descrição Principal</Label>
            <Textarea value={eventoDescricao} onChange={e => setEventoDescricao(e.target.value)} rows={4} className="bg-background border-border resize-none" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── REGRAS E PROIBIÇÕES ── */}
        <Card className="bg-card border-border h-fit lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Regras e Proibições
            </CardTitle>
            <CardDescription className="text-xs">
              Todas as regras e proibições do evento. Use quebras de linha para separar os itens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={regrasEProibicoes} 
              onChange={e => setRegrasEProibicoes(e.target.value)} 
              rows={10} 
              placeholder="Ex:&#10;• Não é permitido...&#10;• Músicas devem ter...&#10;• Proibido uso de..."
              className="bg-background border-border resize-y font-sans leading-relaxed" 
            />
          </CardContent>
        </Card>

        {/* ── PREMIAÇÕES ── */}
        <Card className="bg-card border-border h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-light" />Premiações por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiacoes.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Solo/Grupo..." value={p.categoria} onChange={e => { const u=[...premiacoes]; u[i].categoria=e.target.value; setPremiacoes(u); }} className="bg-background border-border h-9 text-sm flex-[2]" />
                <Input placeholder="R$ 500,00..." value={p.valor} onChange={e => { const u=[...premiacoes]; u[i].valor=e.target.value; setPremiacoes(u); }} className="bg-background border-border h-9 text-sm flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setPremiacoes(premiacoes.filter((_, idx) => idx !== i))} className="h-9 w-9 text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPremiacao} className="w-full border-dashed"><Plus className="w-4 h-4 mr-1" /> Adicionar Premiação</Button>
          </CardContent>
        </Card>

        {/* ── PONTUAÇÃO ── */}
        <Card className="bg-card border-border h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2"><Star className="w-5 h-5 text-burgundy" />Critérios de Pontuação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pontuacao.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="Técnica..." value={p.criterio} onChange={e => { const u=[...pontuacao]; u[i].criterio=e.target.value; setPontuacao(u); }} className="bg-background border-border h-9 text-sm flex-[2]" />
                <Input type="number" placeholder="%" value={p.percentual} onChange={e => { const u=[...pontuacao]; u[i].percentual=Number(e.target.value); setPontuacao(u); }} className="bg-background border-border h-9 text-sm w-20" />
                <Button variant="ghost" size="icon" onClick={() => setPontuacao(pontuacao.filter((_, idx) => idx !== i))} className="h-9 w-9 text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPontuacao} className="w-full border-dashed"><Plus className="w-4 h-4 mr-1" /> Adicionar Critério</Button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-8 right-8 z-50">
        <Button onClick={saveAll} size="lg" className="bg-gradient-gold text-primary-foreground font-sans font-bold shadow-xl hover:scale-105 transition-transform">
          <Save className="w-5 h-5 mr-2" /> Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  );
};
