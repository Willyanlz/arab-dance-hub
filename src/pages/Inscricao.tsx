import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  getLoteAtual, calcularPreco, calcularPrecoMostra, calcularPrecoWorkshop,
  calcularDesconto, WORKSHOP_TIPO_COMPRA, TIPO_PARTICIPACAO_MOSTRA,
  isEventDay as checkEventDay,
  type LoteCompetição, type LoteMostra, type LoteWorkshop,
  type CategoriaType, type TipoCompraWorkshop
} from '@/lib/pricing';
import { ArrowLeft, Trophy, Star, BookOpen } from 'lucide-react';
import { FormFieldConfig } from './admin-config/components/FormBuilder';
import { getSystemOptions, type SystemOptionItem } from '@/lib/systemOptions';
import { isValidCpf, isValidEmail, isValidPhoneBR, maskCpf, maskPhone } from '@/lib/inputValidation';

import type { Participante, WorkshopItem, TipoInscricao } from './inscricao/types';
import { StepTipoSelector } from './inscricao/StepTipoSelector';
import { StepDadosPessoais } from './inscricao/StepDadosPessoais';
import { StepParticipantes } from './inscricao/StepParticipantes';
import { StepResumo } from './inscricao/StepResumo';

const Inscricao = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tipoInscricao, setTipoInscricao] = useState<TipoInscricao | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Pricing
  const [lotes, setLotes] = useState<LoteCompetição[]>([]);
  const [loteAtual, setLoteAtual] = useState<LoteCompetição | null>(null);
  const [lotesMostra, setLotesMostra] = useState<LoteMostra[]>([]);
  const [loteAtualMostra, setLoteAtualMostra] = useState<LoteMostra | null>(null);
  const [lotesWorkshop, setLotesWorkshop] = useState<LoteWorkshop[]>([]);
  const [loteAtualWorkshop, setLoteAtualWorkshop] = useState<LoteWorkshop | null>(null);

  // Config
  const [modalidadesConfig, setModalidadesConfig] = useState<any[]>([]);
  const [comoSoubeOpcoes, setComoSoubeOpcoes] = useState<string[]>([]);
  const [workshopsDisponiveis, setWorkshopsDisponiveis] = useState<WorkshopItem[]>([]);
  const [termosTexto, setTermosTexto] = useState<Record<string, string>>({});
  const [inscricoesAbertas, setInscricoesAbertas] = useState<Record<string, boolean>>({});
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [formConfigs, setFormConfigs] = useState<any[]>([]);
  const [dadosAdicionais, setDadosAdicionais] = useState<Record<string, any>>({});
  const [systemOptions, setSystemOptions] = useState<SystemOptionItem[]>([]);

  // Profile
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isJalilete, setIsJalilete] = useState(false);
  const [isAnterior, setIsAnterior] = useState(false);

  // Shared
  const [nomeEscola, setNomeEscola] = useState('');
  const [professora, setProfessora] = useState('');
  const [categoria, setCategoria] = useState<CategoriaType>('solo');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [extraHarem, setExtraHarem] = useState(false);
  const [comoSoube, setComoSoube] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'dinheiro' | 'cartao'>('pix');
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [pixInfo, setPixInfo] = useState({ chave: 'fadda@festival.com.br', banco: 'Nubank' });

  // Competicao
  const [modalidade, setModalidade] = useState('');
  const [nomeCoreografia, setNomeCoreografia] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [tipoMusica, setTipoMusica] = useState<'solta' | 'posicionada'>('solta');
  const [periodo, setPeriodo] = useState<string>('manha');
  const [termoAtraso, setTermoAtraso] = useState(false);
  const [termoMusica, setTermoMusica] = useState(false);
  const [termoSemEnsaio, setTermoSemEnsaio] = useState(false);

  // Mostra
  const [tipoParticipacao, setTipoParticipacao] = useState('mostra');
  const [modalidadeMostra, setModalidadeMostra] = useState('');
  const [nomeCoreografiaMostra, setNomeCoreografiaMostra] = useState('');
  const [tipoMusicaMostra, setTipoMusicaMostra] = useState<'solta' | 'posicionada'>('solta');
  const [periodoMostra, setPeriodoMostra] = useState('manha');
  const [sugestaoHorario, setSugestaoHorario] = useState('');
  const [termoAtrasoM, setTermoAtrasoM] = useState(false);
  const [termoMusicaM, setTermoMusicaM] = useState(false);
  const [termoSemEnsaioM, setTermoSemEnsaioM] = useState(false);

  // Workshop
  const [workshopsSelecionados, setWorkshopsSelecionados] = useState<string[]>([]);
  const [tipoCompraWorkshop, setTipoCompraWorkshop] = useState<TipoCompraWorkshop>('1_aula');

  // Computed
  const eventoDay = checkEventDay();
  const numIntegrantes = categoria === 'solo' ? 1 : participantes.length + 1;

  const precoBase = (() => {
    if (tipoInscricao === 'competicao' && loteAtual)
      return calcularPreco(loteAtual, categoria, numIntegrantes, eventoDay);
    if (tipoInscricao === 'mostra' && loteAtualMostra)
      return calcularPrecoMostra(loteAtualMostra, categoria, numIntegrantes, eventoDay);
    if (tipoInscricao === 'workshop' && loteAtualWorkshop)
      return calcularPrecoWorkshop(loteAtualWorkshop, tipoCompraWorkshop, eventoDay);
    return 0;
  })();

  const { percentual: desconto, valorFinal } = calcularDesconto(precoBase, isJalilete, isAnterior);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate('/login?redirect=/inscricao');
  }, [user, authLoading]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('inscricao-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes_mostra' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lotes_workshop' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modalidades_config' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoadingData(true);
    const [
      { data: lotesData }, { data: lotesMostraData }, { data: lotesWorkshopData },
      { data: configData }, { data: workshopsData }, { data: termosData },
      { data: profileData }, { data: modalidadesData }, { data: formConfigData },
      { data: systemOptionsData },
    ] = await Promise.all([
      supabase.from('lotes').select('*').order('numero'),
      (supabase.from('lotes_mostra') as any).select('*').order('numero'),
      (supabase.from('lotes_workshop') as any).select('*').order('numero'),
      supabase.from('site_config').select('chave,valor'),
      (supabase.from('workshops_config') as any).select('*').eq('ativo', true).order('nome'),
      (supabase.from('termos_config') as any).select('tipo,conteudo'),
      supabase.from('profiles').select('cpf,telefone,is_aluna_jalilete,participante_anterior').eq('user_id', user.id).single(),
      (supabase.from('modalidades_config') as any).select('*').eq('ativo', true).order('ordem'),
      supabase.from('form_config').select('*'),
      (supabase.from('system_options' as any) as any).select('*').order('ordem'),
    ]);

    if (formConfigData) setFormConfigs(formConfigData);
    if (systemOptionsData) setSystemOptions(systemOptionsData as SystemOptionItem[]);
    if (lotesData) { setLotes(lotesData as any); setLoteAtual(getLoteAtual(lotesData as any)); }
    if (lotesMostraData) { setLotesMostra(lotesMostraData as any); setLoteAtualMostra(getLoteAtual(lotesMostraData as any)); }
    if (lotesWorkshopData) { setLotesWorkshop(lotesWorkshopData as any); setLoteAtualWorkshop(getLoteAtual(lotesWorkshopData as any)); }
    if (workshopsData) setWorkshopsDisponiveis(workshopsData as any);
    if (modalidadesData) setModalidadesConfig(modalidadesData);
    if (termosData) {
      const map: Record<string, string> = {};
      (termosData as any[]).forEach((t: any) => { map[t.tipo] = t.conteudo; });
      setTermosTexto(map);
    }
    if (configData) {
      const map: Record<string, any> = {};
      configData.forEach((c: any) => { map[c.chave] = c.valor; });
      setComoSoubeOpcoes(Array.isArray(map.como_soube_opcoes) ? map.como_soube_opcoes : []);
      if (map.pix_chave) setPixInfo(prev => ({ ...prev, chave: String(map.pix_chave).replace(/"/g, '') }));
      if (map.pix_banco) setPixInfo(prev => ({ ...prev, banco: String(map.pix_banco).replace(/"/g, '') }));
      if (map.evento_pix && !map.pix_chave) setPixInfo(prev => ({ ...prev, chave: String(map.evento_pix).replace(/"/g, '') }));
      setInscricoesAbertas({
        competicao: map.inscricoes_abertas_competicao !== false,
        mostra: map.inscricoes_abertas_mostra !== false,
        workshop: map.inscricoes_abertas_workshop !== false,
      });
    }
    if (profileData) {
      setCpf(profileData.cpf || '');
      setTelefone(profileData.telefone || '');
      setIsJalilete(!!profileData.is_aluna_jalilete);
      setIsAnterior(!!profileData.participante_anterior);
    }
    setLoadingData(false);
  };

  useEffect(() => { load(); }, [user]);

  // Derived
  const modalidadesComp = modalidadesConfig.filter(m => m.tipo === 'competicao' && (periodo === 'nao_competir' || m.periodo === periodo));
  const modalidadesMostra = modalidadesConfig.filter(m => m.tipo === 'mostra' && m.periodo === periodoMostra);
  const toggleWorkshop = (id: string) => setWorkshopsSelecionados(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);

  const CATEGORIAS = getSystemOptions('categoria', systemOptions);
  const PERIODOS = getSystemOptions('periodo', systemOptions);
  const TIPO_MUSICA = getSystemOptions('tipo_musica', systemOptions);
  const TIPO_PARTICIPACAO = getSystemOptions('tipo_participacao', systemOptions);
  const TIPO_COMPRA = getSystemOptions('tipo_compra', systemOptions);

  // ── Condition evaluator ──
  const evaluateCondition = (condition: any) => {
    if (!condition || !condition.field) return true;
    const val = dadosAdicionais[condition.field];
    if (val === undefined || val === null || val === '') return false;
    switch (condition.operator) {
      case '==': return String(val) == String(condition.value);
      case '!=': return String(val) != String(condition.value);
      case '>': return Number(val) > Number(condition.value);
      case '<': return Number(val) < Number(condition.value);
      case 'includes': return String(val).toLowerCase().includes(String(condition.value).toLowerCase());
      default: return true;
    }
  };

  const getVisibleFields = (fields: any[]) => fields.filter(f => evaluateCondition(f.showIf));

  const canProceedStep2 = () => {
    const config = formConfigs.find(c => c.tipo_inscricao === tipoInscricao);
    if (!config || !config.fields) {
      if (tipoInscricao === 'competicao') return !!modalidade && !!nomeCoreografia;
      if (tipoInscricao === 'mostra') return !!modalidadeMostra && !!nomeCoreografiaMostra;
      if (tipoInscricao === 'workshop') return workshopsSelecionados.length > 0 && !!tipoCompraWorkshop;
      return false;
    }
    const fields: FormFieldConfig[] = typeof config.fields === 'string' ? JSON.parse(config.fields) : config.fields;
    const visibleFields = fields.filter(f => evaluateCondition(f.showIf));
    const dynamicValid = visibleFields.every(f => {
      if (!f.required) return true;
      if (['periodo', 'modalidade', 'nome_coreografia', 'tipo_musica', 'tipo_participacao', 'tipo_compra', 'workshops', 'categoria'].includes(f.name)) return true;
      const val = dadosAdicionais[f.name];
      return val !== undefined && val !== null && String(val).trim().length > 0;
    });
    const hasField = (name: string) => visibleFields.some(f => f.name === name);
    const sistemaValid = (() => {
      if (tipoInscricao === 'competicao') return (!hasField('modalidade') || !!modalidade) && (!hasField('nome_coreografia') || !!nomeCoreografia);
      if (tipoInscricao === 'mostra') return (!hasField('modalidade') || !!modalidadeMostra) && (!hasField('nome_coreografia') || !!nomeCoreografiaMostra);
      if (tipoInscricao === 'workshop') return (!hasField('workshops') || workshopsSelecionados.length > 0) && (!hasField('tipo_compra') || !!tipoCompraWorkshop);
      return true;
    })();
    return dynamicValid && sistemaValid;
  };

  // ── Dynamic field renderer ──
  const renderField = (f: any) => {
    if (f.name === 'periodo') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} {f.required ? '*' : ''}</Label>
          <Select value={tipoInscricao === 'mostra' ? periodoMostra : periodo} onValueChange={v => tipoInscricao === 'mostra' ? setPeriodoMostra(v) : setPeriodo(v)}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>{PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (f.name === 'modalidade') {
      const cur = tipoInscricao === 'mostra' ? modalidadeMostra : modalidade;
      const list = tipoInscricao === 'mostra' ? modalidadesMostra : modalidadesComp;
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select value={cur} onValueChange={v => { tipoInscricao === 'mostra' ? setModalidadeMostra(v) : setModalidade(v); const m = list.find(x => x.nome === v); if (m?.faixa_etaria) setFaixaEtaria(m.faixa_etaria); }}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>{list.map(m => <SelectItem key={m.id} value={m.nome}>{m.nome} {m.horario ? `· ${m.horario}` : ''} {m.faixa_etaria ? `(${m.faixa_etaria})` : ''}</SelectItem>)}</SelectContent>
          </Select>
          {list.length === 0 && <p className="text-[10px] text-muted-foreground mt-1 font-sans italic">Defina o período para ver as opções.</p>}
        </div>
      );
    }
    if (f.name === 'categoria') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select value={categoria} onValueChange={v => { setCategoria(v as CategoriaType); setParticipantes([]); }}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (f.name === 'nome_coreografia') {
      const val = tipoInscricao === 'mostra' ? nomeCoreografiaMostra : nomeCoreografia;
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Input value={val} onChange={e => tipoInscricao === 'mostra' ? setNomeCoreografiaMostra(e.target.value) : setNomeCoreografia(e.target.value)} className="bg-background border-border text-foreground" />
        </div>
      );
    }
    if (f.name === 'tipo_musica') {
      const val = tipoInscricao === 'mostra' ? tipoMusicaMostra : tipoMusica;
      return (
        <div key={f.id} className="space-y-3 p-3 bg-muted/20 rounded-lg">
          <Label className="text-foreground font-sans text-xs font-bold uppercase">{f.label} *</Label>
          <div className="flex gap-6">
            {TIPO_MUSICA.map(op => (
              <label key={op.value} className="flex items-center gap-2 cursor-pointer font-sans text-sm">
                <input type="radio" checked={val === op.value} onChange={() => tipoInscricao === 'mostra' ? setTipoMusicaMostra(op.value as any) : setTipoMusica(op.value as any)} className="accent-primary" />
                {op.label}
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (f.name === 'tipo_participacao') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select value={tipoParticipacao} onValueChange={setTipoParticipacao}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>{(TIPO_PARTICIPACAO.length > 0 ? TIPO_PARTICIPACAO : TIPO_PARTICIPACAO_MOSTRA).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (f.name === 'tipo_compra') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select value={tipoCompraWorkshop} onValueChange={v => setTipoCompraWorkshop(v as TipoCompraWorkshop)}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>{(TIPO_COMPRA.length > 0 ? TIPO_COMPRA : WORKSHOP_TIPO_COMPRA).map((t: any) => <SelectItem key={t.value} value={t.value}>{t.label} {loteAtualWorkshop ? `— R$ ${(loteAtualWorkshop as any)[`preco_${t.value}`]?.toFixed(2) || ''}` : ''}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (f.name === 'workshops') {
      return (
        <div key={f.id} className="space-y-2">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {workshopsDisponiveis.map(w => (
              <button key={w.id} type="button" onClick={() => toggleWorkshop(w.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${workshopsSelecionados.includes(w.id) ? 'border-gold bg-primary/10' : 'border-border bg-background hover:border-gold/40'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground font-sans text-xs">{w.nome}</p>
                    <p className="text-[10px] text-muted-foreground font-sans">{w.professor} · {w.horario}</p>
                  </div>
                  {workshopsSelecionados.includes(w.id) && <div className="w-4 h-4 rounded-full bg-gradient-gold flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Default dynamic field
    return (
      <div key={f.id} className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
        {f.type !== 'checkbox' && <Label className="text-foreground font-sans">{f.label} {f.required ? '*' : ''}</Label>}
        {f.type === 'text' || f.type === 'email' || f.type === 'number' || f.type === 'date' ? (
          <Input type={f.type} placeholder={f.placeholder || ''} value={dadosAdicionais[f.name] || ''} onChange={e => setDadosAdicionais({ ...dadosAdicionais, [f.name]: e.target.value })} className="bg-background border-border text-foreground" />
        ) : f.type === 'select' ? (
          <Select value={dadosAdicionais[f.name] || ''} onValueChange={v => setDadosAdicionais({ ...dadosAdicionais, [f.name]: v })}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>{f.options?.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        ) : f.type === 'checkbox' ? (
          <div className="flex items-center space-x-2 pt-1 border border-border/50 p-2 rounded-lg bg-background/50">
            <Checkbox id={f.id} checked={!!dadosAdicionais[f.name]} onCheckedChange={v => setDadosAdicionais({ ...dadosAdicionais, [f.name]: !!v })} />
            <label htmlFor={f.id} className="text-sm font-sans text-foreground cursor-pointer shrink-0">{f.label} {f.required ? '*' : ''}</label>
          </div>
        ) : f.type === 'radio' ? (
          <div className="space-y-2 mt-2 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-bold text-muted-foreground mb-2">{f.label}</p>
            {f.options?.map((o: string) => (
              <div key={o} className="flex items-center space-x-2">
                <input type="radio" id={`${f.id}-${o}`} name={f.name} value={o} checked={dadosAdicionais[f.name] === o} onChange={e => setDadosAdicionais({ ...dadosAdicionais, [f.name]: e.target.value })} className="accent-primary w-4 h-4" />
                <label htmlFor={`${f.id}-${o}`} className="text-sm font-sans text-foreground cursor-pointer">{o}</label>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderFormStep2 = () => {
    const config = formConfigs.find(c => c.tipo_inscricao === tipoInscricao);
    if (!config || !config.fields) return <p className="text-center py-8 text-muted-foreground">Configuração não encontrada.</p>;
    let fields = typeof config.fields === 'string' ? JSON.parse(config.fields) : config.fields;
    const visibleFields = getVisibleFields(fields);
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif text-foreground text-xl flex items-center gap-2">
            {tipoInscricao === 'competicao' && <Trophy className="w-5 h-5 text-gold-light" />}
            {tipoInscricao === 'mostra' && <Star className="w-5 h-5 text-burgundy" />}
            {tipoInscricao === 'workshop' && <BookOpen className="w-5 h-5 text-primary" />}
            2. Detalhes da Participação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {visibleFields.map(f => renderField(f))}
          {tipoInscricao === 'mostra' && (
            <div className="p-4 bg-primary/5 border border-gold/20 rounded-lg text-sm font-sans text-foreground flex items-start gap-3">
              <span className="text-lg">🎟️</span>
              <p><strong>Incluso na inscrição:</strong> Ingresso para o dia todo (9h até 18:30). Para o show de gala, adquira via Sympla.</p>
            </div>
          )}
          <div className="flex gap-3 pt-4 border-t border-border mt-4">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
            <Button onClick={() => { if (!canProceedStep2()) { toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' }); return; } setStep(3); }} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shadow-md">Próximo</Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!isValidCpf(cpf)) { toast({ title: 'CPF inválido', variant: 'destructive' }); setLoading(false); return; }
      if (!isValidPhoneBR(telefone)) { toast({ title: 'Telefone inválido', variant: 'destructive' }); setLoading(false); return; }
      const invalidP = participantes.find(p => !p.nome?.trim() || !isValidCpf(p.cpf));
      if (invalidP) { toast({ title: 'Participantes inválidos', description: 'Cada participante precisa ter nome e CPF válido.', variant: 'destructive' }); setLoading(false); return; }
      const invalidEmail = participantes.find(p => p.email && !isValidEmail(p.email));
      if (invalidEmail) { toast({ title: 'E-mail inválido', variant: 'destructive' }); setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];
      let loteValid = true;
      if (tipoInscricao === 'competicao' && loteAtual && (today < loteAtual.data_inicio || today > loteAtual.data_fim)) loteValid = false;
      if (tipoInscricao === 'mostra' && loteAtualMostra && (today < loteAtualMostra.data_inicio || today > loteAtualMostra.data_fim)) loteValid = false;
      if (tipoInscricao === 'workshop' && loteAtualWorkshop && (today < loteAtualWorkshop.data_inicio || today > loteAtualWorkshop.data_fim)) loteValid = false;
      if (!loteValid) { toast({ title: 'Lote Expirado', description: 'Recarregue para obter os novos preços.', variant: 'destructive' }); setLoading(false); load(); return; }

      await supabase.from('profiles').update({ cpf, telefone, is_aluna_jalilete: isJalilete, participante_anterior: isAnterior }).eq('user_id', user.id);

      const baseData = {
        user_id: user.id, tipo_inscricao: tipoInscricao!, categoria,
        nome_escola: nomeEscola || null, professora: professora || null,
        num_integrantes: numIntegrantes, valor_total: precoBase,
        desconto_percentual: desconto, valor_final: valorFinal,
        extra_harem: extraHarem, como_soube: comoSoube || null,
        observacoes: observacoes || null, faixa_etaria: faixaEtaria || null,
        dados_adicionais: dadosAdicionais,
      };

      let inscData: Record<string, any> = baseData;
      if (tipoInscricao === 'competicao') {
        inscData = { ...baseData, modalidade, nome_coreografia: nomeCoreografia, nome_artistico: nomeArtistico || null, tipo_musica: tipoMusica, periodo: periodo as any, lote_id: loteAtual?.id || null, termos_atraso: termoAtraso, termos_musica: termoMusica, termos_sem_ensaio: termoSemEnsaio };
      } else if (tipoInscricao === 'mostra') {
        inscData = { ...baseData, modalidade: modalidadeMostra, nome_coreografia: nomeCoreografiaMostra, tipo_musica: tipoMusicaMostra, tipo_participacao: tipoParticipacao, preferencia_periodo: periodoMostra, sugestao_horario: sugestaoHorario || null, lote_mostra_id: loteAtualMostra?.id || null, termos_atraso: termoAtrasoM, termos_musica: termoMusicaM, termos_sem_ensaio: termoSemEnsaioM };
      } else if (tipoInscricao === 'workshop') {
        inscData = { ...baseData, modalidade: workshopsSelecionados.join(', '), nome_coreografia: '', tipo_compra_workshop: tipoCompraWorkshop, lote_workshop_id: loteAtualWorkshop?.id || null };
      }

      const { data: insc, error: inscError } = await supabase.from('inscricoes').insert(inscData as any).select().single();
      if (inscError) throw inscError;

      if (participantes.length > 0 && insc) {
        await supabase.from('participantes').insert(participantes.map(p => ({ inscricao_id: insc.id, nome: p.nome, cpf: p.cpf || null, email: p.email || null, telefone: p.telefone || null })));
      }
      if (tipoInscricao === 'workshop' && workshopsSelecionados.length > 0 && insc) {
        await supabase.from('inscricao_workshops').insert(workshopsSelecionados.map(wid => ({ inscricao_id: insc.id, workshop_id: wid })));
      }

      if (insc) {
        const { data: pagamento, error: pagamentoError } = await supabase.from('pagamentos').insert({ inscricao_id: insc.id, metodo: metodoPagamento, valor: valorFinal, status: 'pendente' } as any).select().single();
        if (pagamentoError) throw pagamentoError;
        const email = user.email || '';
        const nome = user.user_metadata?.nome || user.email || 'Participante';
        if (metodoPagamento === 'cartao') {
          const { data: mpData, error: mpErr } = await supabase.functions.invoke('create-mp-checkout', { body: { inscricao_id: insc.id, pagamento_id: pagamento?.id, valor: valorFinal, descricao: `Inscrição ${tipoInscricao}`, email, nome } });
          if (mpErr) throw mpErr;
          if (mpData?.init_point) { window.location.href = mpData.init_point; return; }
          throw new Error('Não foi possível iniciar o checkout do Mercado Pago.');
        }
        supabase.functions.invoke('send-pending-payment', { body: { email, nome, contexto: 'inscricao', descricao: `Inscrição ${tipoInscricao}`, valor: valorFinal, metodo: metodoPagamento } }).catch(console.error);
      }

      toast({ title: '✅ Inscrição realizada!', description: 'Aguardando confirmação do pagamento.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-sans">Carregando...</p>
        </div>
      </div>
    );
  }

  const totalSteps = tipoInscricao === 'workshop' ? 3 : 4;
  const currentModalidadeDisplay = tipoInscricao === 'mostra' ? modalidadeMostra : modalidade;
  const currentCoreografiaDisplay = tipoInscricao === 'mostra' ? nomeCoreografiaMostra : nomeCoreografia;
  const currentLoteNome = tipoInscricao === 'competicao' ? loteAtual?.nome : tipoInscricao === 'mostra' ? loteAtualMostra?.nome : loteAtualWorkshop?.nome;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-1">Inscrição</h1>
        <p className="text-muted-foreground font-sans mb-6 text-sm">9º F.A.D.D.A - Festival Araraquarense de Danças Árabes</p>

        {step > 0 && (
          <div className="flex gap-1.5 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-gradient-gold' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {step === 0 && <StepTipoSelector inscricoesAbertas={inscricoesAbertas} onSelect={(tipo) => { setTipoInscricao(tipo); setStep(1); }} />}

        {step === 1 && tipoInscricao && (
          <StepDadosPessoais
            tipoInscricao={tipoInscricao} cpf={cpf} setCpf={setCpf}
            telefone={telefone} setTelefone={setTelefone}
            isJalilete={isJalilete} setIsJalilete={setIsJalilete}
            isAnterior={isAnterior} setIsAnterior={setIsAnterior}
            onBack={() => { setStep(0); setTipoInscricao(null); }}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && renderFormStep2()}

        {step === 3 && tipoInscricao !== 'workshop' && (
          <StepParticipantes
            tipoInscricao={tipoInscricao!}
            categoria={categoria} participantes={participantes}
            setParticipantes={setParticipantes}
            extraHarem={extraHarem} setExtraHarem={setExtraHarem}
            onBack={() => setStep(2)} onNext={() => setStep(4)}
          />
        )}

        {((step === 3 && tipoInscricao === 'workshop') || (step === 4 && tipoInscricao !== 'workshop')) && tipoInscricao && (
          <StepResumo
            tipoInscricao={tipoInscricao}
            categoria={categoria} categoriasOptions={CATEGORIAS}
            modalidade={currentModalidadeDisplay}
            nomeCoreografia={currentCoreografiaDisplay}
            numIntegrantes={numIntegrantes} participantes={participantes}
            precoBase={precoBase} desconto={desconto} valorFinal={valorFinal}
            loteNome={currentLoteNome || ''}
            workshopsSelecionados={workshopsSelecionados}
            workshopsDisponiveis={workshopsDisponiveis}
            tipoCompraWorkshop={tipoCompraWorkshop}
            comoSoubeOpcoes={comoSoubeOpcoes} comoSoube={comoSoube} setComoSoube={setComoSoube}
            observacoes={observacoes} setObservacoes={setObservacoes}
            metodoPagamento={metodoPagamento} setMetodoPagamento={setMetodoPagamento}
            pixInfo={pixInfo} termosTexto={termosTexto}
            termosAceitos={termosAceitos} setTermosAceitos={setTermosAceitos}
            loading={loading}
            onBack={() => setStep(tipoInscricao === 'workshop' ? 2 : 3)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Inscricao;
