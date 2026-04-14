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
import { ArrowLeft, Plus, Trash2, Save, Trophy, Star, BookOpen, Ticket, Settings2, FileText, MapPin, Calendar, Store } from 'lucide-react';

import { FormulariosConfig } from './admin-config/FormulariosConfig';
import { AdminRoles } from './admin-config/AdminRoles';
import { ModalidadesConfig } from './admin-config/ModalidadesConfig';

interface ModalidadeConfig {
  id?: string;
  nome: string;
  tipo: string;
  periodo: string;
  horario: string;
  faixa_etaria: string;
  ativo: boolean;
  ordem: number;
}

const AdminConfig = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // ── Registration toggles
  const [abrirCompetição, setAbrirCompetição] = useState(true);
  const [abrirMostra, setAbrirMostra] = useState(true);
  const [abrirWorkshop, setAbrirWorkshop] = useState(true);

  // ── Como soube
  const [comoSoubeOpcoes, setComoSoubeOpcoes] = useState<string[]>([]);

  // ── Workshops
  const [workshops, setWorkshops] = useState<any[]>([]);

  // ── Lotes (all categories)
  const [lotesComp, setLotesComp] = useState<any[]>([]);
  const [lotesMostra, setLotesMostra] = useState<any[]>([]);
  const [lotesWorkshop, setLotesWorkshop] = useState<any[]>([]);
  const [lotesIngresso, setLotesIngresso] = useState<any[]>([]);

  // ── Terms
  const [termoCompetição, setTermoCompetição] = useState('');
  const [termoMostra, setTermoMostra] = useState('');
  const [termoWorkshop, setTermoWorkshop] = useState('');

  // ── Ingressos
  const [tiposIngresso, setTiposIngresso] = useState<any[]>([]);
  const [novoIngresso, setNovoIngresso] = useState({ nome: '', descricao: '', preco: 0, quantidade_total: 0, lote_ingresso_id: '' });

  // ── Landing page config
  const [eventoNome, setEventoNome] = useState('F.A.D.D.A');
  const [eventoData, setEventoData] = useState('08 e 09 de Agosto de 2026');
  const [eventoLocal, setEventoLocal] = useState('Araraquara, São Paulo');
  const [eventoHorario, setEventoHorario] = useState('9h às 22h');
  const [eventoPix, setEventoPix] = useState('fadda@festival.com.br');
  const [eventoEdicao, setEventoEdicao] = useState('9ª Edição');
  const [eventoSubtitulo, setEventoSubtitulo] = useState('Festival Araraquarense de Danças Árabes');
  const [eventoDescricao, setEventoDescricao] = useState('Competições • Mostras • Workshops • Premiações');
  const [regrasMusica, setRegrasMusica] = useState<string[]>(['Formato MP3 via pen drive', 'Entregar antes da apresentação', 'Solo/Dupla/Trio: até 3 minutos', 'Grupo: até 4 minutos']);
  const [regrasProibicoes, setRegrasProibicoes] = useState<string[]>(['Uso de fogo', 'Uso de água', 'Elementos perigosos', 'Atrasos desclassificam']);
  const [premiacoes, setPremiacoes] = useState<{categoria:string;valor:string}[]>([]);
  const [pontuacao, setPontuacao] = useState<{criterio:string;percentual:number}[]>([]);
  const [standsFeirinha, setStandsFeirinha] = useState<{titulo:string;icone:string;descricao:string;contato:string}[]>([]);

  // ── New lote form state
  const [novoLoteComp, setNovoLoteComp] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
  const [novoLoteMostra, setNovoLoteMostra] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
  const [novoLoteWorkshop, setNovoLoteWorkshop] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_pacote_completo: 0, preco_1_aula: 0, preco_2_aulas: 0, preco_3_aulas: 0, preco_4_aulas: 0, preco_5_aulas: 0 });
  const [novoLoteIngresso, setNovoLoteIngresso] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '' });

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
      { data: lotesIngressoData },
      { data: termosData },
      { data: modalidadesData },
    ] = await Promise.all([
      supabase.from('site_config').select('*'),
      supabase.from('tipos_ingresso').select('*').order('created_at'),
      (supabase.from('workshops_config') as any).select('*').order('nome'),
      supabase.from('lotes').select('*').order('numero'),
      (supabase.from('lotes_mostra') as any).select('*').order('numero'),
      (supabase.from('lotes_workshop') as any).select('*').order('numero'),
      (supabase.from('lotes_ingresso') as any).select('*').order('numero'),
      (supabase.from('termos_config') as any).select('*'),
    ]);

    if (configData) {
      const map: Record<string, any> = {};
      configData.forEach((c: any) => { map[c.chave] = c.valor; });
      setComoSoubeOpcoes(Array.isArray(map.como_soube_opcoes) ? map.como_soube_opcoes : []);
      setAbrirCompetição(map.inscricoes_abertas_competicao !== false);
      setAbrirMostra(map.inscricoes_abertas_mostra !== false);
      setAbrirWorkshop(map.inscricoes_abertas_workshop !== false);
      if (typeof map.evento_nome === 'string') setEventoNome(map.evento_nome);
      if (typeof map.evento_data === 'string') setEventoData(map.evento_data);
      if (typeof map.evento_local === 'string') setEventoLocal(map.evento_local);
      if (typeof map.evento_horario === 'string') setEventoHorario(map.evento_horario);
      if (typeof map.evento_pix === 'string') setEventoPix(map.evento_pix);
      if (typeof map.evento_edicao === 'string') setEventoEdicao(map.evento_edicao);
      if (typeof map.evento_subtitulo === 'string') setEventoSubtitulo(map.evento_subtitulo);
      if (typeof map.evento_descricao === 'string') setEventoDescricao(map.evento_descricao);
      if (Array.isArray(map.regras_musica)) setRegrasMusica(map.regras_musica);
      if (Array.isArray(map.regras_proibicoes)) setRegrasProibicoes(map.regras_proibicoes);
      if (Array.isArray(map.premiacoes)) setPremiacoes(map.premiacoes);
      if (Array.isArray(map.pontuacao)) setPontuacao(map.pontuacao);
      if (Array.isArray(map.stands_feirinha)) setStandsFeirinha(map.stands_feirinha);
    }
    if (ingressoData) setTiposIngresso(ingressoData);
    if (workshopsData) setWorkshops(workshopsData);
    if (lotesCompData) setLotesComp(lotesCompData);
    if (lotesMostraData) setLotesMostra(lotesMostraData);
    if (lotesWorkshopData) setLotesWorkshop(lotesWorkshopData);
    if (lotesIngressoData) setLotesIngresso(lotesIngressoData);
    if (termosData) {
      termosData.forEach((t: any) => {
        if (t.tipo === 'competicao') setTermoCompetição(t.conteudo);
        if (t.tipo === 'mostra') setTermoMostra(t.conteudo);
        if (t.tipo === 'workshop') setTermoWorkshop(t.conteudo);
      });
    }
    setLoading(false);
  }, []);

  // ── Save helpers
  const upsertConfig = async (chave: string, valor: any) => {
    const { error } = await supabase.from('site_config').upsert({ chave, valor } as any, { onConflict: 'chave' });
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Salvo!' });
  };

  const saveToggle = async (chave: string, val: boolean) => { await upsertConfig(chave, val); };

  const saveTermo = async (tipo: string, conteudo: string) => {
    const { error } = await (supabase.from('termos_config') as any).upsert({ tipo, conteudo }, { onConflict: 'tipo' });
    if (error) toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    else toast({ title: '✅ Termo atualizado!' });
  };

  // ── Como soube list helpers
  const listAdd = (list: string[], setList: (l: string[]) => void) => setList([...list, '']);
  const listRemove = (list: string[], setList: (l: string[]) => void, i: number) => setList(list.filter((_, j) => j !== i));
  const listUpdate = (list: string[], setList: (l: string[]) => void, i: number, val: string) => { const u = [...list]; u[i] = val; setList(u); };

  // ── Workshop helpers
  const saveWorkshop = async (w: any) => {
    if (w.id) {
      await (supabase.from('workshops_config') as any).update({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo }).eq('id', w.id);
      toast({ title: '✅ Workshop salvo!' });
    } else {
      await (supabase.from('workshops_config') as any).insert({ nome: w.nome, professor: w.professor, horario: w.horario, periodo: w.periodo, ativo: w.ativo });
      toast({ title: '✅ Workshop criado!' });
      loadAll();
    }
  };
  const deleteWorkshop = async (id: string) => { await (supabase.from('workshops_config') as any).delete().eq('id', id); toast({ title: 'Workshop removido' }); loadAll(); };

  // ── Lote CRUD helpers
  const updateLoteField = async (table: string, id: string, field: string, val: any) => {
    await (supabase.from(table as any) as any).update({ [field]: val }).eq('id', id);
    toast({ title: '✅ Atualizado' });
  };
  const deleteLote = async (table: string, id: string) => {
    await (supabase.from(table as any) as any).delete().eq('id', id);
    toast({ title: 'Lote removido' });
    loadAll();
  };
  const createLoteComp = async () => {
    if (!novoLoteComp.nome || !novoLoteComp.data_inicio) return;
    await supabase.from('lotes').insert(novoLoteComp as any);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteComp({ numero: lotesComp.length + 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
    loadAll();
  };
  const createLoteMostra = async () => {
    if (!novoLoteMostra.nome || !novoLoteMostra.data_inicio) return;
    await (supabase.from('lotes_mostra') as any).insert(novoLoteMostra);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteMostra({ numero: lotesMostra.length + 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
    loadAll();
  };
  const createLoteWorkshop = async () => {
    if (!novoLoteWorkshop.nome || !novoLoteWorkshop.data_inicio) return;
    await (supabase.from('lotes_workshop') as any).insert(novoLoteWorkshop);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteWorkshop({ numero: lotesWorkshop.length + 1, nome: '', data_inicio: '', data_fim: '', preco_pacote_completo: 0, preco_1_aula: 0, preco_2_aulas: 0, preco_3_aulas: 0, preco_4_aulas: 0, preco_5_aulas: 0 });
    loadAll();
  };
  const createLoteIngresso = async () => {
    if (!novoLoteIngresso.nome || !novoLoteIngresso.data_inicio) return;
    await (supabase.from('lotes_ingresso') as any).insert(novoLoteIngresso);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteIngresso({ numero: lotesIngresso.length + 1, nome: '', data_inicio: '', data_fim: '' });
    loadAll();
  };

  // ── Ticket CRUD
  const criarIngresso = async () => {
    if (!novoIngresso.nome) return;
    const payload: any = { nome: novoIngresso.nome, descricao: novoIngresso.descricao, preco: novoIngresso.preco, quantidade_total: novoIngresso.quantidade_total };
    if (novoIngresso.lote_ingresso_id) payload.lote_ingresso_id = novoIngresso.lote_ingresso_id;
    await supabase.from('tipos_ingresso').insert(payload);
    toast({ title: '✅ Ingresso criado!' });
    setNovoIngresso({ nome: '', descricao: '', preco: 0, quantidade_total: 0, lote_ingresso_id: '' });
    loadAll();
  };
  const toggleIngresso = async (id: string, ativo: boolean) => { await supabase.from('tipos_ingresso').update({ ativo: !ativo }).eq('id', id); loadAll(); };
  const deleteIngresso = async (id: string) => { await supabase.from('tipos_ingresso').delete().eq('id', id); toast({ title: 'Ingresso removido' }); loadAll(); };

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

  // Helper for premiacoes
  const addPremiacao = () => setPremiacoes([...premiacoes, { categoria: '', valor: '' }]);
  const removePremiacao = (i: number) => setPremiacoes(premiacoes.filter((_, j) => j !== i));
  const updatePremiacao = (i: number, field: string, val: string) => { const u = [...premiacoes]; u[i] = { ...u[i], [field]: val }; setPremiacoes(u); };

  // Helper for pontuacao
  const addPontuacao = () => setPontuacao([...pontuacao, { criterio: '', percentual: 0 }]);
  const removePontuacao = (i: number) => setPontuacao(pontuacao.filter((_, j) => j !== i));
  const updatePontuacao = (i: number, field: string, val: any) => { const u = [...pontuacao]; u[i] = { ...u[i], [field]: val }; setPontuacao(u); };

  // Helper for stands
  const addStand = () => setStandsFeirinha([...standsFeirinha, { titulo: '', icone: 'circle', descricao: '', contato: '' }]);
  const removeStand = (i: number) => setStandsFeirinha(standsFeirinha.filter((_, j) => j !== i));
  const updateStand = (i: number, field: string, val: string) => { const u = [...standsFeirinha]; u[i] = { ...u[i], [field]: val }; setStandsFeirinha(u); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent text-accent-foreground font-sans">Configurações</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-serif font-bold text-foreground mb-8">Configurações do Sistema</h1>

        <Tabs defaultValue="inscricoes" className="space-y-6">
            <TabsList className="bg-muted flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="inscricoes" className="font-sans text-xs"><Settings2 className="w-3.5 h-3.5 mr-1" />Inscrições</TabsTrigger>
              <TabsTrigger value="modalidades" className="font-sans text-xs">🎭 Modalidades</TabsTrigger>
              <TabsTrigger value="precos" className="font-sans text-xs">💰 Lotes/Preços</TabsTrigger>
              <TabsTrigger value="formularios" className="font-sans text-xs">📋 Formulários</TabsTrigger>
              <TabsTrigger value="termos" className="font-sans text-xs"><FileText className="w-3.5 h-3.5 mr-1" />Termos</TabsTrigger>
              <TabsTrigger value="workshops" className="font-sans text-xs"><BookOpen className="w-3.5 h-3.5 mr-1" />Workshops</TabsTrigger>
              <TabsTrigger value="ingressos" className="font-sans text-xs"><Ticket className="w-3.5 h-3.5 mr-1" />Ingressos</TabsTrigger>
              <TabsTrigger value="stands" className="font-sans text-xs"><Store className="w-3.5 h-3.5 mr-1" />Stands</TabsTrigger>
              <TabsTrigger value="landpage" className="font-sans text-xs">🌐 Evento</TabsTrigger>
              <TabsTrigger value="admins" className="font-sans text-xs">🛡️ Admins</TabsTrigger>
            </TabsList>

          {/* ── INSCRIÇÕES ── */}
          <TabsContent value="inscricoes" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Controle de Inscrições</CardTitle>
                <CardDescription className="font-sans text-muted-foreground">Ative ou desative inscrições por tipo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: Trophy, label: 'Competição', state: abrirCompetição, setState: setAbrirCompetição, chave: 'inscricoes_abertas_competicao' },
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
          </TabsContent>

          {/* ── ADMIN ROLES ── */}
          <TabsContent value="admins" className="space-y-4">
            <AdminRoles />
          </TabsContent>

          {/* ── MODALIDADES ── */}
          <TabsContent value="modalidades" className="space-y-4">
            <ModalidadesConfig />
          </TabsContent>

          {/* ── FORMULÁRIOS DINÂMICOS ── */}
          <TabsContent value="formularios" className="space-y-4">
            <FormulariosConfig />
          </TabsContent>

          {/* ── LOTES / PREÇOS ── */}
          <TabsContent value="precos" className="space-y-6">
            {/* Competição */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-light" />Lotes — Competição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead><tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3">Lote</th><th className="text-left py-2 pr-3">Período</th><th className="text-left py-2 pr-3">Solo</th><th className="text-left py-2 pr-3">Dupla/Trio</th><th className="text-left py-2 pr-3">Grupo</th><th></th>
                    </tr></thead>
                    <tbody>
                      {lotesComp.map(l => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-foreground font-medium">{l.nome}</td>
                          <td className="py-2 pr-3 text-muted-foreground text-xs">{l.data_inicio} → {l.data_fim}</td>
                          {(['preco_solo', 'preco_dupla_trio', 'preco_grupo_por_integrante'] as const).map(field => (
                            <td key={field} className="py-2 pr-3">
                              <Input type="number" defaultValue={l[field]} onBlur={e => updateLoteField('lotes', l.id, field, Number(e.target.value))} className="w-24 h-8 bg-background border-border text-foreground text-sm" />
                            </td>
                          ))}
                          <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-foreground font-sans">Adicionar Lote</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Nome" value={novoLoteComp.nome} onChange={e => setNovoLoteComp({ ...novoLoteComp, nome: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteComp.data_inicio} onChange={e => setNovoLoteComp({ ...novoLoteComp, data_inicio: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteComp.data_fim} onChange={e => setNovoLoteComp({ ...novoLoteComp, data_fim: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Nº" value={novoLoteComp.numero} onChange={e => setNovoLoteComp({ ...novoLoteComp, numero: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Solo" value={novoLoteComp.preco_solo} onChange={e => setNovoLoteComp({ ...novoLoteComp, preco_solo: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Dupla/Trio" value={novoLoteComp.preco_dupla_trio} onChange={e => setNovoLoteComp({ ...novoLoteComp, preco_dupla_trio: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Grupo" value={novoLoteComp.preco_grupo_por_integrante} onChange={e => setNovoLoteComp({ ...novoLoteComp, preco_grupo_por_integrante: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Button onClick={createLoteComp} className="bg-gradient-gold text-primary-foreground font-sans text-sm"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mostra */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Star className="w-5 h-5 text-burgundy" />Lotes — Mostra</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead><tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3">Lote</th><th className="text-left py-2 pr-3">Período</th><th className="text-left py-2 pr-3">Solo</th><th className="text-left py-2 pr-3">Dupla/Trio</th><th className="text-left py-2 pr-3">Grupo</th><th></th>
                    </tr></thead>
                    <tbody>
                      {lotesMostra.map(l => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 pr-3 text-foreground font-medium">{l.nome}</td>
                          <td className="py-2 pr-3 text-muted-foreground text-xs">{l.data_inicio} → {l.data_fim}</td>
                          {(['preco_solo', 'preco_dupla_trio', 'preco_grupo_por_integrante'] as const).map(field => (
                            <td key={field} className="py-2 pr-3">
                              <Input type="number" defaultValue={l[field]} onBlur={e => updateLoteField('lotes_mostra', l.id, field, Number(e.target.value))} className="w-24 h-8 bg-background border-border text-foreground text-sm" />
                            </td>
                          ))}
                          <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes_mostra', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-foreground font-sans">Adicionar Lote</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Nome" value={novoLoteMostra.nome} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, nome: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteMostra.data_inicio} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, data_inicio: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteMostra.data_fim} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, data_fim: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Solo" value={novoLoteMostra.preco_solo} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, preco_solo: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Dupla/Trio" value={novoLoteMostra.preco_dupla_trio} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, preco_dupla_trio: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Grupo" value={novoLoteMostra.preco_grupo_por_integrante} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, preco_grupo_por_integrante: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Button onClick={createLoteMostra} className="bg-gradient-gold text-primary-foreground font-sans text-sm"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workshop */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Lotes — Workshop</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead><tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-2">Lote</th><th className="text-left py-2 pr-2">Pacote</th><th className="text-left py-2 pr-2">1</th><th className="text-left py-2 pr-2">2</th><th className="text-left py-2 pr-2">3</th><th className="text-left py-2 pr-2">4</th><th className="text-left py-2 pr-2">5</th><th></th>
                    </tr></thead>
                    <tbody>
                      {lotesWorkshop.map(l => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 pr-2 text-foreground font-medium text-xs">{l.nome}</td>
                          {(['preco_pacote_completo', 'preco_1_aula', 'preco_2_aulas', 'preco_3_aulas', 'preco_4_aulas', 'preco_5_aulas'] as const).map(field => (
                            <td key={field} className="py-2 pr-2">
                              <Input type="number" defaultValue={l[field]} onBlur={e => updateLoteField('lotes_workshop', l.id, field, Number(e.target.value))} className="w-20 h-8 bg-background border-border text-foreground text-sm" />
                            </td>
                          ))}
                          <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes_workshop', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-foreground font-sans">Adicionar Lote</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Nome" value={novoLoteWorkshop.nome} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, nome: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteWorkshop.data_inicio} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, data_inicio: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteWorkshop.data_fim} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, data_fim: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="number" placeholder="Pacote" value={novoLoteWorkshop.preco_pacote_completo} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, preco_pacote_completo: Number(e.target.value) })} className="bg-background border-border text-foreground text-sm" />
                    <Button onClick={createLoteWorkshop} className="bg-gradient-gold text-primary-foreground font-sans text-sm"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresso Convidado */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" />Lotes — Ingressos Convidado</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {lotesIngresso.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <span className="text-foreground font-sans text-sm font-medium flex-1">{l.nome}</span>
                      <span className="text-xs text-muted-foreground font-sans">{l.data_inicio} → {l.data_fim}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteLote('lotes_ingresso', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <p className="text-sm font-semibold text-foreground font-sans">Adicionar Lote</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input placeholder="Nome" value={novoLoteIngresso.nome} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, nome: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteIngresso.data_inicio} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, data_inicio: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Input type="date" value={novoLoteIngresso.data_fim} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, data_fim: e.target.value })} className="bg-background border-border text-foreground text-sm" />
                    <Button onClick={createLoteIngresso} className="bg-gradient-gold text-primary-foreground font-sans text-sm"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── FORMULÁRIOS ── */}
          <TabsContent value="formularios" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Settings2 className="w-5 h-5 text-primary" />"Como soube do festival?" — Opções</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comoSoubeOpcoes.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={m} onChange={e => listUpdate(comoSoubeOpcoes, setComoSoubeOpcoes, i, e.target.value)} className="bg-background border-border text-foreground" />
                    <Button variant="ghost" size="icon" onClick={() => listRemove(comoSoubeOpcoes, setComoSoubeOpcoes, i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => listAdd(comoSoubeOpcoes, setComoSoubeOpcoes)} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => upsertConfig('como_soube_opcoes', comoSoubeOpcoes)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TERMOS ── */}
          <TabsContent value="termos" className="space-y-6">
            {[
              { tipo: 'competicao', label: 'Competição', icon: Trophy, state: termoCompetição, setState: setTermoCompetição },
              { tipo: 'mostra', label: 'Mostra', icon: Star, state: termoMostra, setState: setTermoMostra },
              { tipo: 'workshop', label: 'Workshop', icon: BookOpen, state: termoWorkshop, setState: setTermoWorkshop },
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
          </TabsContent>

          {/* ── WORKSHOPS ── */}
          <TabsContent value="workshops" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg">Gerenciar Workshops</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workshops.map((w, i) => (
                  <div key={w.id || i} className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div><Label className="text-foreground font-sans text-xs">Nome</Label><Input value={w.nome} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], nome: e.target.value }; setWorkshops(u); }} className="bg-background border-border text-foreground" /></div>
                      <div><Label className="text-foreground font-sans text-xs">Professor(a)</Label><Input value={w.professor || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], professor: e.target.value }; setWorkshops(u); }} className="bg-background border-border text-foreground" /></div>
                      <div><Label className="text-foreground font-sans text-xs">Horário</Label><Input value={w.horario || ''} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], horario: e.target.value }; setWorkshops(u); }} placeholder="09:00" className="bg-background border-border text-foreground" /></div>
                      <div><Label className="text-foreground font-sans text-xs">Período</Label>
                        <select value={w.periodo || 'manha'} onChange={e => { const u = [...workshops]; u[i] = { ...u[i], periodo: e.target.value }; setWorkshops(u); }} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                          <option value="manha">Manhã</option><option value="tarde">Tarde</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Switch checked={w.ativo} onCheckedChange={v => { const u = [...workshops]; u[i] = { ...u[i], ativo: v }; setWorkshops(u); }} />
                        <span className="text-sm font-sans text-muted-foreground">{w.ativo ? 'Ativo' : 'Inativo'}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveWorkshop(workshops[i])} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-3.5 h-3.5 mr-1" /> Salvar</Button>
                        {w.id && <Button size="sm" variant="ghost" onClick={() => deleteWorkshop(w.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => setWorkshops([...workshops, { nome: '', professor: '', horario: '', periodo: 'manha', ativo: true }])} className="border-border text-foreground font-sans w-full"><Plus className="w-4 h-4 mr-1" /> Adicionar Workshop</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── INGRESSOS ── */}
          <TabsContent value="ingressos" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg">Criar Tipo de Ingresso</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-foreground font-sans">Nome *</Label><Input value={novoIngresso.nome} onChange={e => setNovoIngresso({ ...novoIngresso, nome: e.target.value })} placeholder="Ex: Ingresso Show de Gala" className="bg-background border-border text-foreground" /></div>
                  <div><Label className="text-foreground font-sans">Descrição</Label><Input value={novoIngresso.descricao} onChange={e => setNovoIngresso({ ...novoIngresso, descricao: e.target.value })} className="bg-background border-border text-foreground" /></div>
                  <div><Label className="text-foreground font-sans">Preço (R$)</Label><Input type="number" value={novoIngresso.preco} onChange={e => setNovoIngresso({ ...novoIngresso, preco: Number(e.target.value) })} className="bg-background border-border text-foreground" /></div>
                  <div><Label className="text-foreground font-sans">Quantidade Total</Label><Input type="number" value={novoIngresso.quantidade_total} onChange={e => setNovoIngresso({ ...novoIngresso, quantidade_total: Number(e.target.value) })} className="bg-background border-border text-foreground" /></div>
                  <div><Label className="text-foreground font-sans">Lote</Label>
                    <select value={novoIngresso.lote_ingresso_id} onChange={e => setNovoIngresso({ ...novoIngresso, lote_ingresso_id: e.target.value })} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                      <option value="">Sem lote</option>
                      {lotesIngresso.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                    </select>
                  </div>
                </div>
                <Button onClick={criarIngresso} className="bg-gradient-gold text-primary-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Criar Ingresso</Button>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg">Ingressos Cadastrados</CardTitle></CardHeader>
              <CardContent>
                {tiposIngresso.length === 0 ? <p className="text-muted-foreground font-sans text-sm">Nenhum ingresso.</p> : (
                  <div className="space-y-3">
                    {tiposIngresso.map(t => (
                      <div key={t.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground font-sans">{t.nome}</p>
                          <p className="text-xs text-muted-foreground font-sans">Vendidos: {t.quantidade_vendida}/{t.quantidade_total}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input type="number" defaultValue={t.preco} onBlur={async e => { await supabase.from('tipos_ingresso').update({ preco: Number(e.target.value) }).eq('id', t.id); toast({ title: '✅ Preço atualizado' }); }} className="w-24 h-8 bg-background border-border text-foreground text-sm" />
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

          {/* ── STANDS / FEIRINHA ── */}
          <TabsContent value="stands" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Store className="w-5 h-5 text-primary" />Stands / Feirinha</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Configure os stands que aparecem na landing page. Ícones: camera, scissors, circle.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {standsFeirinha.map((s, i) => (
                  <div key={i} className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-foreground font-sans text-xs">Título</Label>
                        <Input value={s.titulo} onChange={e => updateStand(i, 'titulo', e.target.value)} placeholder="Ex: Foto e Filmagem" className="bg-background border-border text-foreground" />
                      </div>
                      <div>
                        <Label className="text-foreground font-sans text-xs">Ícone</Label>
                        <select value={s.icone} onChange={e => updateStand(i, 'icone', e.target.value)} className="w-full h-10 rounded-md border border-border bg-background text-foreground px-3 text-sm font-sans">
                          <option value="camera">📷 Câmera</option>
                          <option value="scissors">✂️ Tesoura</option>
                          <option value="circle">⭕ Círculo</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-foreground font-sans text-xs">Contato</Label>
                        <Input value={s.contato} onChange={e => updateStand(i, 'contato', e.target.value)} placeholder="WhatsApp: 19 9 9999-9999" className="bg-background border-border text-foreground" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-foreground font-sans text-xs">Descrição</Label>
                      <Textarea value={s.descricao} onChange={e => updateStand(i, 'descricao', e.target.value)} rows={4} className="bg-background border-border text-foreground font-sans text-sm" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => removeStand(i)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addStand} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar Stand</Button>
                  <Button onClick={() => upsertConfig('stands_feirinha', standsFeirinha)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── EVENTO / LANDPAGE ── */}
          <TabsContent value="landpage" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Informações do Evento</CardTitle>
                <CardDescription className="font-sans text-muted-foreground text-xs">Estes dados aparecem na landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-foreground font-sans">Edição (ex: 9ª Edição)</Label><Input value={eventoEdicao} onChange={e => setEventoEdicao(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Nome do Evento</Label><Input value={eventoNome} onChange={e => setEventoNome(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Subtítulo</Label><Input value={eventoSubtitulo} onChange={e => setEventoSubtitulo(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Descrição curta</Label><Input value={eventoDescricao} onChange={e => setEventoDescricao(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Data do Evento</Label><Input value={eventoData} onChange={e => setEventoData(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Local</Label><Input value={eventoLocal} onChange={e => setEventoLocal(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Horário</Label><Input value={eventoHorario} onChange={e => setEventoHorario(e.target.value)} placeholder="9h às 22h" className="bg-background border-border text-foreground" /></div>
                <div><Label className="text-foreground font-sans">Chave PIX</Label><Input value={eventoPix} onChange={e => setEventoPix(e.target.value)} className="bg-background border-border text-foreground" /></div>
                <Button onClick={async () => { await Promise.all([upsertConfig('evento_nome', eventoNome), upsertConfig('evento_data', eventoData), upsertConfig('evento_local', eventoLocal), upsertConfig('evento_horario', eventoHorario), upsertConfig('evento_pix', eventoPix), upsertConfig('evento_edicao', eventoEdicao), upsertConfig('evento_subtitulo', eventoSubtitulo), upsertConfig('evento_descricao', eventoDescricao)]); }} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
              </CardContent>
            </Card>

            {/* Regras */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg">Regras — Música</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {regrasMusica.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={r} onChange={e => { const u = [...regrasMusica]; u[i] = e.target.value; setRegrasMusica(u); }} className="bg-background border-border text-foreground flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => setRegrasMusica(regrasMusica.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRegrasMusica([...regrasMusica, ''])} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => upsertConfig('regras_musica', regrasMusica)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg">Regras — Proibições</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {regrasProibicoes.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={r} onChange={e => { const u = [...regrasProibicoes]; u[i] = e.target.value; setRegrasProibicoes(u); }} className="bg-background border-border text-foreground flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => setRegrasProibicoes(regrasProibicoes.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setRegrasProibicoes([...regrasProibicoes, ''])} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => upsertConfig('regras_proibicoes', regrasProibicoes)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Premiações */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" />Premiações</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {premiacoes.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={p.categoria} onChange={e => updatePremiacao(i, 'categoria', e.target.value)} placeholder="Categoria" className="bg-background border-border text-foreground flex-1" />
                    <Input value={p.valor} onChange={e => updatePremiacao(i, 'valor', e.target.value)} placeholder="R$ 500" className="bg-background border-border text-foreground w-32" />
                    <Button variant="ghost" size="icon" onClick={() => removePremiacao(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addPremiacao} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => upsertConfig('premiacoes', premiacoes)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
                </div>
              </CardContent>
            </Card>

            {/* Pontuação */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-serif text-foreground text-lg">Critérios de Pontuação</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pontuacao.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={p.criterio} onChange={e => updatePontuacao(i, 'criterio', e.target.value)} placeholder="Critério" className="bg-background border-border text-foreground flex-1" />
                    <Input type="number" value={p.percentual} onChange={e => updatePontuacao(i, 'percentual', Number(e.target.value))} placeholder="%" className="bg-background border-border text-foreground w-20" />
                    <Button variant="ghost" size="icon" onClick={() => removePontuacao(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={addPontuacao} className="border-border text-foreground font-sans"><Plus className="w-4 h-4 mr-1" /> Adicionar</Button>
                  <Button onClick={() => upsertConfig('pontuacao', pontuacao)} className="bg-gradient-gold text-primary-foreground font-sans"><Save className="w-4 h-4 mr-1" /> Salvar</Button>
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
