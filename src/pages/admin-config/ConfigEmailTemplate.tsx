import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Save, Eye, EyeOff, Mail, Palette } from 'lucide-react';
import { TicketEmail, defaultTicketTemplate, type TicketTemplateConfig } from '@/components/email-templates/TicketTemplate';
import { InscricaoEmail, defaultInscricaoTemplate, type InscricaoTemplateConfig } from '@/components/email-templates/InscricaoTemplate';

export const ConfigEmailTemplate = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ingresso' | 'inscricao'>('ingresso');
  const [ticketConfig, setTicketConfig] = useState<TicketTemplateConfig>(defaultTicketTemplate);
  const [inscricaoConfig, setInscricaoConfig] = useState<InscricaoTemplateConfig>(defaultInscricaoTemplate);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const getEventMirror = (map: Record<string, any>) => ({
    titulo_email: map.evento_nome || defaultTicketTemplate.titulo_email,
    subtitulo_email: map.evento_subtitulo || defaultTicketTemplate.subtitulo_email,
    rodape_evento: map.evento_edicao || defaultTicketTemplate.rodape_evento,
    rodape_local: map.evento_local || defaultTicketTemplate.rodape_local,
  });

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_config')
      .select('*')
      .in('chave', ['email_template_ingresso', 'email_template_inscricao', 'evento_nome', 'evento_subtitulo', 'evento_edicao', 'evento_local']);

    const map: Record<string, any> = {};
    (data || []).forEach((item: any) => {
      map[item.chave] = item.valor;
    });

    const eventMirror = getEventMirror(map);
    const ticketSaved = map.email_template_ingresso && typeof map.email_template_ingresso === 'object' ? map.email_template_ingresso : {};
    const inscricaoSaved = map.email_template_inscricao && typeof map.email_template_inscricao === 'object' ? map.email_template_inscricao : {};

    setTicketConfig({
      ...defaultTicketTemplate,
      ...ticketSaved,
      ...eventMirror,
    } as TicketTemplateConfig);

    setInscricaoConfig({
      ...defaultInscricaoTemplate,
      ...inscricaoSaved,
      ...eventMirror,
    } as InscricaoTemplateConfig);

    if (!map.email_template_inscricao) {
      await supabase.from('site_config').upsert(
        { chave: 'email_template_inscricao', valor: { ...defaultInscricaoTemplate, ...eventMirror }, descricao: 'Template do email de confirmação de inscrição' } as any,
        { onConflict: 'chave' }
      );
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    const { error } = await supabase.from('site_config').upsert(
      {
        chave: activeTab === 'ingresso' ? 'email_template_ingresso' : 'email_template_inscricao',
        valor: (activeTab === 'ingresso' ? ticketConfig : inscricaoConfig) as any,
        descricao: activeTab === 'ingresso' ? 'Template do email de ingresso' : 'Template do email de confirmação de inscrição',
      },
      { onConflict: 'chave' }
    );
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Template salvo com sucesso!' });
  };

  const updateTicketField = (field: keyof TicketTemplateConfig, value: string) => {
    setTicketConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateInscricaoField = (field: keyof InscricaoTemplateConfig, value: string) => {
    setInscricaoConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando template...</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Templates de E-mail
          </CardTitle>
          <CardDescription className="text-xs">
            A primeira carga espelha dados da Configuração do Evento. Ao alterar o evento, os campos espelhados serão refletidos aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant={activeTab === 'ingresso' ? 'default' : 'outline'} onClick={() => setActiveTab('ingresso')}>
              Ingressos
            </Button>
            <Button variant={activeTab === 'inscricao' ? 'default' : 'outline'} onClick={() => setActiveTab('inscricao')}>
              Inscrições
            </Button>
          </div>

          {/* Textos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">📝 Textos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título do E-mail</Label>
                <Input
                  value={activeTab === 'ingresso' ? ticketConfig.titulo_email : inscricaoConfig.titulo_email}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('titulo_email', e.target.value) : updateInscricaoField('titulo_email', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                <Input
                  value={activeTab === 'ingresso' ? ticketConfig.subtitulo_email : inscricaoConfig.subtitulo_email}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('subtitulo_email', e.target.value) : updateInscricaoField('subtitulo_email', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Mensagem de confirmação</Label>
                <Textarea
                  value={activeTab === 'ingresso' ? ticketConfig.mensagem_confirmacao : inscricaoConfig.mensagem_confirmacao}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('mensagem_confirmacao', e.target.value) : updateInscricaoField('mensagem_confirmacao', e.target.value)}
                  rows={2}
                  className="bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Título da seção de detalhes</Label>
                <Input
                  value={activeTab === 'ingresso' ? ticketConfig.titulo_detalhes : inscricaoConfig.titulo_detalhes}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('titulo_detalhes', e.target.value) : updateInscricaoField('titulo_detalhes', e.target.value)}
                  className="bg-background"
                />
              </div>
              {activeTab === 'ingresso' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground">Título do voucher</Label>
                    <Input value={ticketConfig.titulo_voucher} onChange={e => updateTicketField('titulo_voucher', e.target.value)} className="bg-background" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Instrução do voucher</Label>
                    <Input value={ticketConfig.instrucao_voucher} onChange={e => updateTicketField('instrucao_voucher', e.target.value)} className="bg-background" />
                  </div>
                </>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Rodapé - Evento</Label>
                <Input
                  value={activeTab === 'ingresso' ? ticketConfig.rodape_evento : inscricaoConfig.rodape_evento}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('rodape_evento', e.target.value) : updateInscricaoField('rodape_evento', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rodapé - Local</Label>
                <Input
                  value={activeTab === 'ingresso' ? ticketConfig.rodape_local : inscricaoConfig.rodape_local}
                  onChange={e => activeTab === 'ingresso' ? updateTicketField('rodape_local', e.target.value) : updateInscricaoField('rodape_local', e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Palette className="w-4 h-4" /> Cores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                { key: 'cor_primaria', label: 'Primária (destaque)' },
                { key: 'cor_fundo', label: 'Fundo' },
                { key: 'cor_texto', label: 'Texto' },
                { key: 'cor_subtexto', label: 'Subtexto' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={(activeTab === 'ingresso' ? ticketConfig : inscricaoConfig)[key]}
                      onChange={e => activeTab === 'ingresso' ? updateTicketField(key as keyof TicketTemplateConfig, e.target.value) : updateInscricaoField(key as keyof InscricaoTemplateConfig, e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={(activeTab === 'ingresso' ? ticketConfig : inscricaoConfig)[key]}
                      onChange={e => activeTab === 'ingresso' ? updateTicketField(key as keyof TicketTemplateConfig, e.target.value) : updateInscricaoField(key as keyof InscricaoTemplateConfig, e.target.value)}
                      className="bg-background text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
            </Button>
            <Button onClick={saveConfig} className="bg-gradient-gold">
              <Save className="w-4 h-4 mr-1" /> Salvar Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="font-serif text-foreground text-lg">Preview do E-mail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border border-border">
              {activeTab === 'ingresso' ? (
                <TicketEmail
                  nome="João da Silva"
                  ingresso="Pista Premium"
                  quantidade={2}
                  valorTotal={150.00}
                  qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PREVIEW"
                  config={ticketConfig}
                />
              ) : (
                <InscricaoEmail
                  nome="João da Silva"
                  tipoInscricao="Competição"
                  modalidade="Solo"
                  nomeCoreografia="Noites do Oriente"
                  valorTotal={220}
                  config={inscricaoConfig}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
