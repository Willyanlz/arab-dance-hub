import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Save, Trophy, Star, BookOpen, Ticket, Settings2, FileText } from 'lucide-react';

const AdminConfig = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // ── Registration toggles ──────────────────────────────────────────────────
  const [abrirCompetição, setAbrirCompetição] = useState(true);
  const [abrirMostra, setAbrirMostra] = useState(true);
  const [abrirWorkshop, setAbrirWorkshop] = useState(true);

  // ── Modality lists ────────────────────────────────────────────────────────
  const [modalidadesComp, setModalidadesComp] = useState<string[]>([]);
  const [modalidadesMostra, setModalidadesMostra] = useState<string[]>([]);
  const [comoSoubeOpcoes, setComoSoubeOpcoes] = useState<string[]>([]);

  // ── Workshops ─────────────────────────────────────────────────────────────
  const [workshops, setWorkshops] = useState<any[]>([]);

  // ── Lotes (preços) ────────────────────────────────────────────────────────
  const [lotesComp, setLotesComp] = useState<any[]>([]);
  const [lotesMostra, setLotesMostra] = useState<any[]>([]);
  const [lotesWorkshop, setLotesWorkshop] = useState<any[]>([]);

  // ── Terms ─────────────────────────────────────────────────────────────────
  const [termoCompetição, setTermoCompetição] = useState('');
  const [termoMostra, setTermoMostra] = useState('');
  const [termoWorkshop, setTermoWorkshop] = useState('');

  // ── Ingressos ─────────────────────────────────────────────────────────────
  const [tiposIngresso, setTiposIngresso] = useState<any[]>([]);
  const [novoIngresso, setNovoIngresso] = useState({ nome: '', descricao: '', preco: 0, quantidade_total: 0 });

  // ── Landing page config ───────────────────────────────────────────────────
  const [eventoData, setEventoData] = useState('08 e 09 de Agosto de 2026');
  const [eventoLocal, setEventoLocal] = useState('Araraquara, São Paulo');
  const [eventoPix, setEventoPix] = useState('fadda@festival.com.br');

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/login');
  }, [user, authLoading, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadAll();
  }, [user, isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: configData },
      { data: ingressoData },
      { data: workshopsData },
      { data: lotesCompData },
      { data: lotesMostraData },
      { data: lotesWorkshopData },
      { data: termosData },
    ] = await Promise.all([
      supabase.from('site_config').select('*'),
      supabase.from('tipos_ingresso').select('*').order('created_at'),
      supabase.from('workshops_config').select('*').order('nome'),
      supabase.from('lotes').select('*').order('numero'),
      supabase.from('lotes_mostra').select('*').order('numero'),
      supabase.from('lotes_workshop').select('*').order('numero'),
      supabase.from('termos_config').select('*'),
    ]);

    if (configData) {
      const map: Record<string, any> = {};
      configData.forEach((c: any) => { map[c.chave] = c.valor; });
      setModalidadesComp(Array.isArray(map.modalidades_competicao) ? map.modalidades_competicao : []);
      setModalidadesMostra(Array.isArray(map.modalidades_mostra) ? map.modalidades_mostra : []);
      setComoSoubeOpcoes(Array.isArray(map.como_soube_opcoes) ? map.como_soube_opcoes : []);
      setAbrirCompetição(map.inscricoes_abertas_competicao !== false);
      setAbrirMostra(map.inscricoes_abertas_mostra !== false);
      setAbrirWorkshop(map.inscricoes_abertas_workshop !== false);
      if (typeof map.evento_data === 'string') setEventoData(map.evento_data);
      if (typeof map.evento_local === 'string') setEventoLocal(map.evento_local);
      if (typeof map.evento_pix === 'string') setEventoPix(map.evento_pix);
    }
    if (ingressoData) setTiposIngresso(ingressoData);
    if (workshopsData) setWorkshops(workshopsData);
    if (lotesCompData) setLotesComp(lotesCompData);
    if (lotesMostraData) setLotesMostra(lotesMostraData);
    if (lotesWorkshopData) setLotesWorkshop(lotesWorkshopData);
    if (termosData) {
      termosData.forEach((t: any) => {
        if (t.tipo === 'competicao') setTermoCompetição(t.conteudo);
        if (t.tipo === 'mostra') setTermoMostra(t.conteudo);
        if (t.tipo === 'workshop') setTermoWorkshop(t.conteudo);
      });
    }
    setLoading(false);
  }, []);

  // ── Save helpers ──────────────────────────────────────────────────────────
  const upsertConfig = async (chave: string, valor: any) => {
    const { error } = await supabase
      .from('site_config')
      .upsert({ chave, valor }, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Salvo!' });
  };

  const saveToggle = async (chave: string, val: boolean) => {
    await upsertConfig(chave, val);
  };

  const saveTermo = async (tipo: string, conteudo: string) => {
    const { error } = await supabase
      .from('termos_config')
      .upsert({ tipo, conteudo }, { onConflict: 'tipo' });
    if (error) toast({ title: 'Erro ao salvar termo', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Termo atualizado!' });
  };

  // ── List helpers ──────────────────────────────────────────────────────────
  const listAdd = (list: string[], setList: (l: string[]) => void) => setList([...list, '']);
  const listRemove = (list: string[], setList: (l: string[]) => void, i: number) => setList(list.filter((_, j) => j !== i));
  const listUpdate = (list: string[], setList: (l: string[]) => void, i: number, val: string) => {
    const u = [...list]; u[i] = val; setList(u);
  };

  // ── Workshop helpers ──────────────────────────────────────────────────────
  const saveWorkshop = async (w: any) => {
    if (w.id) {
      const { error } = await supabase.from('workshops_config').update({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo }).eq('id', w.id);
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      else toast({ title: '✅ Workshop salvo!' });
    } else {
      const { error } = await supabase.from('workshops_config').insert({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo });
      if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      else { toast({ title: '✅ Workshop criado!' }); loadAll(); }
    }
  };

  const deleteWorkshop = async (id: string) => {
    await supabase.from('workshops_config').delete().eq('id', id);
    toast({ title: 'Workshop removido' });
    loadAll();
  };

  // ── Lote price update ─────────────────────────────────────────────────────
  const updateLoteComp = async (id: string, field: string, val: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('lotes') as any).update({ [field]: val }).eq('id', id);
    toast({ title: '✅ Preço atualizado' });
  };

  const updateLoteMostra = async (id: string, field: string, val: number) => {
    await (supabase.from('lotes_mostra') as any).update({ [field]: val }).eq('id', id);
    toast({ title: '✅ Preço atualizado' });
  };

  const updateLoteWorkshop = async (id: string, field: string, val: number) => {
    await (supabase.from('lotes_workshop') as any).update({ [field]: val }).eq('id', id);
    toast({ title: '✅ Preço atualizado' });
  };

  // ── Ticket CRUD ───────────────────────────────────────────────────────────
  const criarIngresso = async () => {
    if (!novoIngresso.nome) return;
    const { error } = await supabase.from('tipos_ingresso').insert(novoIngresso);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Ingresso criado!' });
    setNovoIngresso({ nome: '', descricao: '', preco: 0, quantidade_total: 0 });
    loadAll();
  };

  const toggleIngresso = async (id: string, ativo: boolean) => {
    await supabase.from('tipos_ingresso').update({ ativo: !ativo }).eq('id', id);
    loadAll();
  };

  const deleteIngresso = async (id: string) => {
    await supabase.from('tipos_ingresso').delete().eq('id', id);
    toast({ title: 'Ingresso removido' });
    loadAll();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-sans">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent text-accent-foreground font-sans">Configurações</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-serif font-bold text-foreground mb-8">Configurações do Sistema</h1>

        <Tabs defaultValue="inscricoes" className="space-y-6">
          <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="inscricoes" className="font-sans text-xs md:text-sm"><Settings2 className="w-3.5 h-3.5 mr-1" />Inscrições</TabsTrigger>
            <TabsTrigger value="precos" className="font-sans text-xs md:text-sm">💰 Preços</TabsTrigger>
            <TabsTrigger value="formularios" className="font-sans text-xs md:text-sm">📋 Formulários</TabsTrigger>
            <TabsTrigger value="termos" className="font-sans text-xs md:text-sm"><FileText className="w-3.5 h-3.5 mr-1" />Termos</TabsTrigger>
            <TabsTrigger value="workshops" className="font-sans text-xs md:text-sm"><BookOpen className="w-3.5 h-3.5 mr-1" />Workshops</TabsTrigger>
            <TabsTrigger value="ingressos" className="font-sans text-xs md:text-sm"><Ticket className="w-3.5 h-3.5 mr-1" />Ingressos</TabsTrigger>
            <TabsTrigger value="landpage" className="font-sans text-xs md:text-sm">🌐 Evento</TabsTrigger>
          </TabsList>

          {/* ── INSCRIÇÕES: Toggles por tipo ─────────────────────────────── */}
          <TabsContent value="inscricoes" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Controle de Inscrições</CardTitle>
                <CardDescription className="font-sans text-muted-foreground">Ative ou desative inscrições de forma independente por tipo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Trophy, label: 'Competição', desc: 'Formulário de competição com categorias e modalidades', state: abrirCompetição, setState: setAbrirCompetição, chave: 'inscricoes_abertas_competicao', color: 'text-gold-light' },
                  { icon: Star, label: 'Mostra', desc: 'Formulário de mostra com tipos de participação', state: abrirMostra, setState: setAbrirMostra, chave: 'inscricoes_abertas_mostra', color: 'text-burgundy' },
                  { icon: BookOpen, label: 'Workshop', desc: 'Inscrição em aulas com professoras convidadas', state: abrirWorkshop, setState: setAbrirWorkshop, chave: 'inscricoes_abertas_workshop', color: 'text-primary' },
                ].map(({ icon: Icon, label, desc, state, setState, chave, color }) => (
                  <div key={chave} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <div>
                        <p className="font-medium text-foreground font-sans">{label}</p>
                        <p className="text-xs text-muted-foreground font-sans">{desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-sans ${state ? 'text-green-600' : 'text-red-500'}`}>
                        {state ? 'Aberto' : 'Fechado'}
                      </span>
                      <Switch
                        checked={state}
                        onCheckedChange={async (v) => {
                          setState(v);
                          await saveToggle(chave, v);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PREÇOS: Lotes por tipo ────────────────────────────────────── */}
          <TabsContent value="precos" className="space-y-6">
            {/* Competição */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-light" />Lotes — Competição</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Edite os preços de cada lote · Clique no campo e pressione Tab para salvar</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Lote</th>
                    <th className="text-left py-2 pr-3">Período</th>
                    <th className="text-left py-2 pr-3">Solo</th>
                    <th className="text-left py-2 pr-3">Dupla/Trio</th>
                    <th className="text-left py-2">Grupo (p/int.)</th>
                  </tr></thead>
                  <tbody>
                    {lotesComp.map(l => (
                      <tr key={l.id} className="border-b border-border/50">
                        <td className="py-2 pr-3 text-foreground font-medium">{l.nome}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{l.data_inicio} → {l.data_fim}</td>
                        {(['preco_solo', 'preco_dupla_trio', 'preco_grupo_por_integrante'] as const).map(field => (
                          <td key={field} className="py-2 pr-3">
                            <Input
                              type="number"
                              defaultValue={l[field]}
                              onBlur={e => updateLoteComp(l.id, field, Number(e.target.value))}
                              className="w-24 h-8 bg-background border-border text-foreground text-sm"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 font-sans">⚠️ No dia do evento (08/08/2026) todos os valores são dobrados automaticamente.</p>
              </CardContent>
            </Card>

            {/* Mostra */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Star className="w-5 h-5 text-burgundy" />Lotes — Mostra</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Jaliletes: 10% · Edições anteriores: 5%</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Lote</th>
                    <th className="text-left py-2 pr-3">Período</th>
                    <th className="text-left py-2 pr-3">Solo</th>
                    <th className="text-left py-2 pr-3">Dupla/Trio (p/p)</th>
                    <th className="text-left py-2">Grupo (p/int.)</th>
                  </tr></thead>
                  <tbody>
                    {lotesMostra.map(l => (
                      <tr key={l.id} className="border-b border-border/50">
                        <td className="py-2 pr-3 text-foreground font-medium">{l.nome}</td>
                        <td className="py-2 pr-3 text-muted-foreground text-xs">{l.data_inicio} → {l.data_fim}</td>
                        {(['preco_solo', 'preco_dupla_trio', 'preco_grupo_por_integrante'] as const).map(field => (
                          <td key={field} className="py-2 pr-3">
                            <Input type="number" defaultValue={l[field]} onBlur={e => updateLoteMostra(l.id, field, Number(e.target.value))} className="w-24 h-8 bg-background border-border text-foreground text-sm" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Workshop */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Lotes — Workshop</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead><tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-2">Lote</th>
                    <th className="text-left py-2 pr-2">Pacote</th>
                    <th className="text-left py-2 pr-2">1 Aula</th>
                    <th className="text-left py-2 pr-2">2 Aulas</th>
                    <th className="text-left py-2 pr-2">3 Aulas</th>
                    <th className="text-left py-2 pr-2">4 Aulas</th>
                    <th className="text-left py-2">5 Aulas</th>
                  </tr></thead>
                  <tbody>
                    {lotesWorkshop.map(l => (
                      <tr key={l.id} className="border-b border-border/50">
                        <td className="py-2 pr-2 text-foreground font-medium">{l.nome}</td>
                        {(['preco_pacote_completo', 'preco_1_aula', 'preco_2_aulas', 'preco_3_aulas', 'preco_4_aulas', 'preco_5_aulas'] as const).map(field => (
                          <td key={field} className="py-2 pr-2">
                            <Input type="number" defaultValue={l[field]} onBlur={e => updateLoteWorkshop(l.id, field, Number(e.target.value))} className="w-20 h-8 bg-background border-border text-foreground text-sm" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 font-sans">⚠️ No dia do evento (08/08/2026) todos os valores são dobrados automaticamente.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FORMULÁRIOS: Listas editáveis ─────────────────────────────── */}
          <TabsContent value="formularios" className="space-y-6">
            {([
              { label: 'Modalidades — Competição', icon: Trophy, list: modalidadesComp, setList: setModalidadesComp, chave: 'modalidades_competicao' },
              { label: 'Modalidades — Mostra', icon: Star, list: modalidadesMostra, setList: setModalidadesMostra, chave: 'modalidades_mostra' },
              { label: '"Como soube do festival?" — Opções', icon: Settings2, list: comoSoubeOpcoes, setList: setComoSoubeOpcoes, chave: 'como_soube_opcoes' },
            ] as const).map(({ label, icon: Icon, list, setList, chave }) => (
              <Card key={chave} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />{label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(list as string[]).map((m, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={m} onChange={e => listUpdate(list as string[], setList as any, i, e.target.value)} className="bg-background border-border text-foreground" />
                      <Button variant="ghost" size="icon" onClick={() => listRemove(list as string[], setList as any, i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => listAdd(list as string[], setList as any)} className="border-border text-foreground font-sans">
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                    <Button onClick={() => upsertConfig(chave, list)} className="bg-gradient-gold text-primary-foreground font-sans">
                      <Save className="w-4 h-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── TERMOS ───────────────────────────────────────────────────── */}
          <TabsContent value="termos" className="space-y-6">
            {[
              { tipo: 'competicao', label: 'Termos — Competição', icon: Trophy, state: termoCompetição, setState: setTermoCompetição },
              { tipo: 'mostra', label: 'Termos — Mostra', icon: Star, state: termoMostra, setState: setTermoMostra },
              { tipo: 'workshop', label: 'Termos — Workshop', icon: BookOpen, state: termoWorkshop, setState: setTermoWorkshop },
            ].map(({ tipo, label, icon: Icon, state, setState }) => (
              <Card key={tipo} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
                    <Icon className="w-5 h-5 text-primary" />{label}
                  </CardTitle>
                  <CardDescription className="font-sans text-muted-foreground text-xs">Este texto aparecerá no formulário de inscrição antes do aceite.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={state}
                    onChange={e => setState(e.target.value)}
                    rows={4}
                    className="bg-background border-border text-foreground font-sans text-sm"
                  />
                  <Button onClick={() => saveTermo(tipo, state)} className="bg-gradient-gold text-primary-foreground font-sans">
                    <Save className="w-4 h-4 mr-1" /> Salvar Termos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── WORKSHOPS ─────────────────────────────────────────────────── */}
          <TabsContent value="workshops" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Gerenciar Workshops</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Configure as aulas disponíveis para inscrição. Edite e clique em Salvar para atualizar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {workshops.map((w, i) => (
                  <div key={w.id || i} className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-foreground font-sans text-xs">Nome do Workshop</Label>
                        <Input value={w.nome} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], nome: e.target.value }; setWorkshops(u); }} className="bg-background border-border text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground font-sans text-xs">Professor(a)</Label>
                        <Input value={w.professor || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], professor: e.target.value }; setWorkshops(u); }} className="bg-background border-border text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground font-sans text-xs">Horário</Label>
                        <Input value={w.horario || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], horario: e.target.value }; setWorkshops(u); }} placeholder="09:00" className="bg-background border-border text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground font-sans text-xs">Período</Label>
                        <select value={w.periodo || 'manha'} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], periodo: e.target.value }; setWorkshops(u); }} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                          <option value="manha">Manhã</option>
                          <option value="tarde">Tarde</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={w.ativo} onCheckedChange={v => { const u = [...workshops]; u[i] = { ...u[i], ativo: v }; setWorkshops(u); }} />
                        <span className="text-sm font-sans text-muted-foreground">{w.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveWorkshop(workshops[i])} className="bg-gradient-gold text-primary-foreground font-sans">
                          <Save className="w-3.5 h-3.5 mr-1" /> Salvar
                        </Button>
                        {w.id && (
                          <Button size="sm" variant="ghost" onClick={() => deleteWorkshop(w.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => setWorkshops([...workshops, { nome: '', professor: '', horario: '', periodo: 'manha', ativo: true }])} className="border-border text-foreground font-sans w-full">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Workshop
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── INGRESSOS ─────────────────────────────────────────────────── */}
          <TabsContent value="ingressos" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Criar Tipo de Ingresso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground font-sans">Nome *</Label>
                    <Input value={novoIngresso.nome} onChange={e => setNovoIngresso({ ...novoIngresso, nome: e.target.value })} placeholder="Ex: Ingresso Show de Gala" className="bg-background border-border text-foreground" />
                  </div>
                  <div>
                    <Label className="text-foreground font-sans">Descrição</Label>
                    <Input value={novoIngresso.descricao} onChange={e => setNovoIngresso({ ...novoIngresso, descricao: e.target.value })} placeholder="Opcional" className="bg-background border-border text-foreground" />
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
                <Button onClick={criarIngresso} className="bg-gradient-gold text-primary-foreground font-sans">
                  <Plus className="w-4 h-4 mr-1" /> Criar Ingresso
                </Button>
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
                  <div className="space-y-3">
                    {tiposIngresso.map(t => (
                      <div key={t.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground font-sans">{t.nome}</p>
                          <p className="text-sm text-muted-foreground font-sans">{t.descricao || 'Sem descrição'}</p>
                          <p className="text-xs text-muted-foreground font-sans">Vendidos: {t.quantidade_vendida}/{t.quantidade_total}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground font-sans mb-1">Preço</p>
                            <Input type="number" defaultValue={t.preco} onBlur={async e => { await supabase.from('tipos_ingresso').update({ preco: Number(e.target.value) }).eq('id', t.id); toast({ title: '✅ Preço atualizado' }); }} className="w-24 h-8 bg-background border-border text-foreground text-sm" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-sans mb-1">Ativo</p>
                            <Switch checked={t.ativo} onCheckedChange={() => toggleIngresso(t.id, t.ativo)} />
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteIngresso(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── LANDPAGE / EVENTO ─────────────────────────────────────────── */}
          <TabsContent value="landpage" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Informações do Evento</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Estes dados aparecem na página inicial do site.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground font-sans">Data do Evento</Label>
                  <Input value={eventoData} onChange={e => setEventoData(e.target.value)} className="bg-background border-border text-foreground" placeholder="08 e 09 de Agosto de 2026" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Local</Label>
                  <Input value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} className="bg-background border-border text-foreground" placeholder="Araraquara, São Paulo" />
                </div>
                <div>
                  <Label className="text-foreground font-sans">Chave PIX para Pagamentos</Label>
                  <Input value={eventoPix} onChange={e => setEventoPix(e.target.value)} className="bg-background border-border text-foreground" placeholder="fadda@festival.com.br" />
                </div>
                <Button
                  onClick={async () => {
                    await Promise.all([
                      upsertConfig('evento_data', eventoData),
                      upsertConfig('evento_local', eventoLocal),
                      upsertConfig('evento_pix', eventoPix),
                    ]);
                  }}
                  className="bg-gradient-gold text-primary-foreground font-sans"
                >
                  <Save className="w-4 h-4 mr-1" /> Salvar Informações do Evento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminConfig;
