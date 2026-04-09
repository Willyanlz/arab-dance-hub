import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

const AdminConfig = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Ticket types
  const [tiposIngresso, setTiposIngresso] = useState<any[]>([]);
  const [novoIngresso, setNovoIngresso] = useState({ nome: '', descricao: '', preco: 0, quantidade_total: 0 });

  // Editable lists
  const [modalidadesComp, setModalidadesComp] = useState<string[]>([]);
  const [modalidadesMostra, setModalidadesMostra] = useState<string[]>([]);
  const [workshops, setWorkshops] = useState<{ nome: string; ativo: boolean }[]>([]);
  const [comoSoubeOpcoes, setComoSoubeOpcoes] = useState<string[]>([]);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/login');
  }, [user, authLoading, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: configData }, { data: ingressoData }] = await Promise.all([
      supabase.from('site_config').select('*'),
      supabase.from('tipos_ingresso').select('*').order('created_at'),
    ]);

    if (configData) {
      const map: Record<string, any> = {};
      configData.forEach((c: any) => { map[c.chave] = c.valor; });
      setConfigs(map);
      setModalidadesComp(JSON.parse(JSON.stringify(map.modalidades_competicao || [])));
      setModalidadesMostra(JSON.parse(JSON.stringify(map.modalidades_mostra || [])));
      setWorkshops(JSON.parse(JSON.stringify(map.workshops || [])));
      setComoSoubeOpcoes(JSON.parse(JSON.stringify(map.como_soube_opcoes || [])));
      setInscricoesAbertas(map.inscricoes_abertas === true || map.inscricoes_abertas === 'true');
    }
    if (ingressoData) setTiposIngresso(ingressoData);
    setLoading(false);
  };

  const saveConfig = async (chave: string, valor: any) => {
    const { error } = await supabase.from('site_config').update({ valor }).eq('chave', chave);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Salvo!' });
    }
  };

  const addToList = (list: string[], setList: (l: string[]) => void) => {
    setList([...list, '']);
  };

  const removeFromList = (list: string[], setList: (l: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const updateList = (list: string[], setList: (l: string[]) => void, index: number, value: string) => {
    const updated = [...list];
    updated[index] = value;
    setList(updated);
  };

  // Ticket CRUD
  const criarIngresso = async () => {
    if (!novoIngresso.nome) return;
    const { error } = await supabase.from('tipos_ingresso').insert(novoIngresso);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Ingresso criado!' });
    setNovoIngresso({ nome: '', descricao: '', preco: 0, quantidade_total: 0 });
    loadData();
  };

  const toggleIngresso = async (id: string, ativo: boolean) => {
    await supabase.from('tipos_ingresso').update({ ativo: !ativo }).eq('id', id);
    loadData();
  };

  const deleteIngresso = async (id: string) => {
    await supabase.from('tipos_ingresso').delete().eq('id', id);
    toast({ title: 'Ingresso removido' });
    loadData();
  };

  const updateIngressoPreco = async (id: string, preco: number) => {
    await supabase.from('tipos_ingresso').update({ preco }).eq('id', id);
    toast({ title: 'Preço atualizado' });
    loadData();
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent text-accent-foreground font-sans">Configurações</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-serif font-bold text-foreground mb-8">Configurações do Sistema</h1>

        <Tabs defaultValue="formularios" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="formularios" className="font-sans">Formulários</TabsTrigger>
            <TabsTrigger value="ingressos" className="font-sans">Ingressos</TabsTrigger>
            <TabsTrigger value="geral" className="font-sans">Geral</TabsTrigger>
          </TabsList>

          {/* FORMULÁRIOS */}
          <TabsContent value="formularios" className="space-y-6">
            {/* Modalidades Competição */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Modalidades - Competição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modalidadesComp.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={m} onChange={e => updateList(modalidadesComp, setModalidadesComp, i, e.target.value)} className="bg-background border-border text-foreground" />
                    <Button variant="ghost" size="icon" onClick={() => removeFromList(modalidadesComp, setModalidadesComp, i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => addToList(modalidadesComp, setModalidadesComp)} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => saveConfig('modalidades_competicao', modalidadesComp)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Modalidades Mostra */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Modalidades - Mostra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {modalidadesMostra.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={m} onChange={e => updateList(modalidadesMostra, setModalidadesMostra, i, e.target.value)} className="bg-background border-border text-foreground" />
                    <Button variant="ghost" size="icon" onClick={() => removeFromList(modalidadesMostra, setModalidadesMostra, i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => addToList(modalidadesMostra, setModalidadesMostra)} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => saveConfig('modalidades_mostra', modalidadesMostra)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Workshops */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Workshops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workshops.map((w, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={w.nome} onChange={e => {
                      const updated = [...workshops];
                      updated[i] = { ...updated[i], nome: e.target.value };
                      setWorkshops(updated);
                    }} className="bg-background border-border text-foreground flex-1" />
                    <Switch checked={w.ativo} onCheckedChange={v => {
                      const updated = [...workshops];
                      updated[i] = { ...updated[i], ativo: v };
                      setWorkshops(updated);
                    }} />
                    <Button variant="ghost" size="icon" onClick={() => setWorkshops(workshops.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setWorkshops([...workshops, { nome: '', ativo: true }])} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => saveConfig('workshops', workshops)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Como soube */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Opções "Como soube do festival?"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comoSoubeOpcoes.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={o} onChange={e => updateList(comoSoubeOpcoes, setComoSoubeOpcoes, i, e.target.value)} className="bg-background border-border text-foreground" />
                    <Button variant="ghost" size="icon" onClick={() => removeFromList(comoSoubeOpcoes, setComoSoubeOpcoes, i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => addToList(comoSoubeOpcoes, setComoSoubeOpcoes)} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => saveConfig('como_soube_opcoes', comoSoubeOpcoes)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INGRESSOS */}
          <TabsContent value="ingressos" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Criar Tipo de Ingresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground font-sans">Nome</Label>
                    <Input value={novoIngresso.nome} onChange={e => setNovoIngresso({ ...novoIngresso, nome: e.target.value })} placeholder="Ex: Ingresso Show de Gala" className="bg-background border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-sans">Descrição</Label>
                    <Input value={novoIngresso.descricao} onChange={e => setNovoIngresso({ ...novoIngresso, descricao: e.target.value })} placeholder="Descrição opcional" className="bg-background border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-sans">Preço (R$)</Label>
                    <Input type="number" value={novoIngresso.preco} onChange={e => setNovoIngresso({ ...novoIngresso, preco: Number(e.target.value) })} className="bg-background border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-sans">Quantidade Total</Label>
                    <Input type="number" value={novoIngresso.quantidade_total} onChange={e => setNovoIngresso({ ...novoIngresso, quantidade_total: Number(e.target.value) })} className="bg-background border-border text-foreground" />
                  </div>
                </div>
                <Button onClick={criarIngresso} className="bg-gradient-gold text-primary-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Criar Ingresso</Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Ingressos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {tiposIngresso.length === 0 ? (
                  <p className="text-muted-foreground font-sans text-sm">Nenhum ingresso cadastrado.</p>
                ) : (
                  <div className="space-y-4">
                    {tiposIngresso.map(t => (
                      <div key={t.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-foreground font-sans">{t.nome}</p>
                          <p className="text-sm text-muted-foreground font-sans">{t.descricao || 'Sem descrição'}</p>
                          <p className="text-sm text-muted-foreground font-sans">Vendidos: {t.quantidade_vendida}/{t.quantidade_total}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" defaultValue={t.preco} onBlur={e => updateIngressoPreco(t.id, Number(e.target.value))} className="w-24 bg-background border-border text-foreground text-sm" />
                          <Switch checked={t.ativo} onCheckedChange={() => toggleIngresso(t.id, t.ativo)} />
                          <Button variant="ghost" size="icon" onClick={() => deleteIngresso(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* GERAL */}
          <TabsContent value="geral" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground font-sans">Inscrições Abertas</p>
                    <p className="text-sm text-muted-foreground font-sans">Controla se o botão de inscrição está ativo</p>
                  </div>
                  <Switch checked={inscricoesAbertas} onCheckedChange={async (v) => {
                    setInscricoesAbertas(v);
                    await saveConfig('inscricoes_abertas', v);
                  }} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminConfig;
