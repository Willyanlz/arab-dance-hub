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

export const ConfigEmailTemplate = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<TicketTemplateConfig>(defaultTicketTemplate);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from('site_config').select('*').eq('chave', 'email_template_ingresso').single();
    if (data?.valor && typeof data.valor === 'object' && !Array.isArray(data.valor)) {
      setConfig({ ...defaultTicketTemplate, ...(data.valor as Record<string, any>) } as TicketTemplateConfig);
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    const { error } = await supabase.from('site_config').upsert(
      { chave: 'email_template_ingresso', valor: config as any, descricao: 'Template do email de ingresso' },
      { onConflict: 'chave' }
    );
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Template salvo com sucesso!' });
  };

  const updateField = (field: keyof TicketTemplateConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando template...</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" /> Template do E-mail de Ingresso
          </CardTitle>
          <CardDescription className="text-xs">
            Edite os textos e cores do e-mail enviado ao comprador de ingresso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Textos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">📝 Textos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Título do E-mail</Label>
                <Input value={config.titulo_email} onChange={e => updateField('titulo_email', e.target.value)} className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subtítulo</Label>
                <Input value={config.subtitulo_email} onChange={e => updateField('subtitulo_email', e.target.value)} className="bg-background" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Mensagem de confirmação</Label>
                <Textarea value={config.mensagem_confirmacao} onChange={e => updateField('mensagem_confirmacao', e.target.value)} rows={2} className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Título da seção de detalhes</Label>
                <Input value={config.titulo_detalhes} onChange={e => updateField('titulo_detalhes', e.target.value)} className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Título do voucher</Label>
                <Input value={config.titulo_voucher} onChange={e => updateField('titulo_voucher', e.target.value)} className="bg-background" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground">Instrução do voucher</Label>
                <Input value={config.instrucao_voucher} onChange={e => updateField('instrucao_voucher', e.target.value)} className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rodapé - Evento</Label>
                <Input value={config.rodape_evento} onChange={e => updateField('rodape_evento', e.target.value)} className="bg-background" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Rodapé - Local</Label>
                <Input value={config.rodape_local} onChange={e => updateField('rodape_local', e.target.value)} className="bg-background" />
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
                      value={config[key]}
                      onChange={e => updateField(key, e.target.value)}
                      className="w-10 h-10 rounded border border-border cursor-pointer"
                    />
                    <Input value={config[key]} onChange={e => updateField(key, e.target.value)} className="bg-background text-xs font-mono" />
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
              <TicketEmail
                nome="João da Silva"
                ingresso="Pista Premium"
                quantidade={2}
                valorTotal={150.00}
                qrCodeUrl="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PREVIEW"
                config={config}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
