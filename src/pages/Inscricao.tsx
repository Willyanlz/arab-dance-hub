import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  getLoteAtual, calcularPreco, calcularPrecoMostra, calcularPrecoWorkshop,
  calcularDesconto, WORKSHOP_TIPO_COMPRA, TIPO_PARTICIPACAO_MOSTRA,
  isEventDay as checkEventDay,
  type LoteCompetição, type LoteMostra, type LoteWorkshop,
  type CategoriaType, type TipoCompraWorkshop
} from '@/lib/pricing';
import { ArrowLeft, Plus, Trash2, Trophy, Star, Music, BookOpen, ChevronRight } from 'lucide-react';

interface Participante {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
}

interface WorkshopItem {
  id: string;
  nome: string;
  professor: string;
  periodo: string;
  horario: string;
  ativo: boolean;
}

const CATEGORIAS = [
  { value: 'solo', label: 'Solo' },
  { value: 'dupla_trio', label: 'Dupla/Trio' },
  { value: 'grupo', label: 'Grupo' },
];

const PERIODOS = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'nao_competir', label: 'Sem preferência de período' },
];

const TIPO_INSCRICAO_OPTIONS = [
  {
    value: 'competicao',
    label: 'Competição',
    desc: 'Inscreva-se para competir nas categorias e modalidades do festival.',
    icon: Trophy,
    color: 'border-gold text-gold-light',
  },
  {
    value: 'mostra',
    label: 'Mostra',
    desc: 'Apresentação não competitiva ou avaliada. Ingresso do dia incluído!',
    icon: Star,
    color: 'border-burgundy text-burgundy',
  },
  {
    value: 'workshop',
    label: 'Workshop',
    desc: 'Participe das aulas com professoras renomadas do cenário árabe.',
    icon: BookOpen,
    color: 'border-primary text-primary',
  },
];

const Inscricao = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Global state
  const [tipoInscricao, setTipoInscricao] = useState<'competicao' | 'mostra' | 'workshop' | null>(null);
  const [step, setStep] = useState(0); // 0 = type selection
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ── Pricing data ──────────────────────────────────────────────────────────
  const [lotes, setLotes] = useState<LoteCompetição[]>([]);
  const [loteAtual, setLoteAtual] = useState<LoteCompetição | null>(null);
  const [lotesMostra, setLotesMostra] = useState<LoteMostra[]>([]);
  const [loteAtualMostra, setLoteAtualMostra] = useState<LoteMostra | null>(null);
  const [lotesWorkshop, setLotesWorkshop] = useState<LoteWorkshop[]>([]);
  const [loteAtualWorkshop, setLoteAtualWorkshop] = useState<LoteWorkshop | null>(null);

  // ── Config ────────────────────────────────────────────────────────────────
  const [modalidadesConfig, setModalidadesConfig] = useState<any[]>([]);
  const [comoSoubeOpcoes, setComoSoubeOpcoes] = useState<string[]>([]);
  const [workshopsDisponiveis, setWorkshopsDisponiveis] = useState<WorkshopItem[]>([]);
  const [termosTexto, setTermosTexto] = useState<Record<string, string>>({});
  const [inscricoesAbertas, setInscricoesAbertas] = useState<Record<string, boolean>>({});
  const [faixaEtaria, setFaixaEtaria] = useState('');

  // Dynamic Forms
  const [formConfigs, setFormConfigs] = useState<any[]>([]);
  const [dadosAdicionais, setDadosAdicionais] = useState<Record<string, any>>({});

  // ── Profile fields ────────────────────────────────────────────────────────
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isJalilete, setIsJalilete] = useState(false);
  const [isAnterior, setIsAnterior] = useState(false);

  // ── Shared fields ─────────────────────────────────────────────────────────
  const [nomeEscola, setNomeEscola] = useState('');
  const [professora, setProfessora] = useState('');
  const [categoria, setCategoria] = useState<CategoriaType>('solo');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [extraHarem, setExtraHarem] = useState(false);
  const [comoSoube, setComoSoube] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'cartao'>('pix');
  const [termosAceitos, setTermosAceitos] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // ── Competição fields ─────────────────────────────────────────────────────
  const [modalidade, setModalidade] = useState('');
  const [nomeCoreografia, setNomeCoreografia] = useState('');
  const [nomeArtistico, setNomeArtistico] = useState('');
  const [tipoMusica, setTipoMusica] = useState<'solta' | 'posicionada'>('solta');
  const [periodo, setPeriodo] = useState<string>('manha');
  const [termoAtraso, setTermoAtraso] = useState(false);
  const [termoMusica, setTermoMusica] = useState(false);
  const [termoSemEnsaio, setTermoSemEnsaio] = useState(false);

  // ── Mostra fields ─────────────────────────────────────────────────────────
  const [tipoParticipacao, setTipoParticipacao] = useState('mostra');
  const [modalidadeMostra, setModalidadeMostra] = useState('');
  const [nomeCoreografiaMostra, setNomeCoreografiaMostra] = useState('');
  const [tipoMusicaMostra, setTipoMusicaMostra] = useState<'solta' | 'posicionada'>('solta');
  const [periodoMostra, setPeriodoMostra] = useState('manha');
  const [sugestaoHorario, setSugestaoHorario] = useState('');
  const [termoAtrasoM, setTermoAtrasoM] = useState(false);
  const [termoMusicaM, setTermoMusicaM] = useState(false);
  const [termoSemEnsaioM, setTermoSemEnsaioM] = useState(false);

  // ── Workshop fields ───────────────────────────────────────────────────────
  const [workshopsSelecionados, setWorkshopsSelecionados] = useState<string[]>([]);
  const [tipoCompraWorkshop, setTipoCompraWorkshop] = useState<TipoCompraWorkshop>('1_aula');

  // ── Computed ──────────────────────────────────────────────────────────────
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

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) navigate('/login?redirect=/inscricao');
  }, [user, authLoading]);

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoadingData(true);
      const [
        { data: lotesData },
        { data: lotesMostraData },
        { data: lotesWorkshopData },
        { data: configData },
        { data: workshopsData },
        { data: termosData },
        { data: profileData },
        { data: modalidadesData },
        { data: formConfigData },
      ] = await Promise.all([
        supabase.from('lotes').select('*').order('numero'),
        (supabase.from('lotes_mostra') as any).select('*').order('numero'),
        (supabase.from('lotes_workshop') as any).select('*').order('numero'),
        supabase.from('site_config').select('chave,valor'),
        (supabase.from('workshops_config') as any).select('*').eq('ativo', true).order('nome'),
        (supabase.from('termos_config') as any).select('tipo,conteudo'),
        supabase.from('profiles').select('cpf,telefone,is_aluna_jalilete,participante_anterior').eq('user_id', user.id).single(),
        (supabase.from('modalidades_config') as any).select('*').eq('ativo', true).order('ordem'),
        (supabase as any).from('form_config').select('*'),
      ]);

      if (formConfigData) setFormConfigs(formConfigData);

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
    load();
  }, [user]);

  // Derived: modalidades filtered by tipo and periodo
  const modalidadesComp = modalidadesConfig.filter(m => m.tipo === 'competicao' && (periodo === 'nao_competir' || m.periodo === periodo));
  const modalidadesMostra = modalidadesConfig.filter(m => m.tipo === 'mostra' && m.periodo === periodoMostra);

  // ── Participant helpers ───────────────────────────────────────────────────
  const addParticipante = () => setParticipantes([...participantes, { nome: '', cpf: '' }]);
  const removeParticipante = (i: number) => setParticipantes(participantes.filter((_, idx) => idx !== i));
  const updateParticipante = (i: number, field: keyof Participante, value: string) => {
    const u = [...participantes];
    u[i] = { ...u[i], [field]: value };
    setParticipantes(u);
  };

  // ── Workshop toggle ───────────────────────────────────────────────────────
  const toggleWorkshop = (id: string) => {
    setWorkshopsSelecionados(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Update profile
      await supabase.from('profiles').update({ cpf, telefone, is_aluna_jalilete: isJalilete, participante_anterior: isAnterior }).eq('user_id', user.id);

      const baseData = {
        user_id: user.id,
        tipo_inscricao: tipoInscricao!,
        categoria,
        nome_escola: nomeEscola || null,
        professora: professora || null,
        num_integrantes: numIntegrantes,
        valor_total: precoBase,
        desconto_percentual: desconto,
        valor_final: valorFinal,
        extra_harem: extraHarem,
        como_soube: comoSoube || null,
        observacoes: observacoes || null,
        faixa_etaria: faixaEtaria || null,
        dados_adicionais: dadosAdicionais,
      };

      let inscData: Record<string, any> = baseData;

      if (tipoInscricao === 'competicao') {
        inscData = {
          ...baseData,
          modalidade,
          nome_coreografia: nomeCoreografia,
          nome_artistico: nomeArtistico || null,
          tipo_musica: tipoMusica,
          periodo: periodo as any,
          lote_id: loteAtual?.id || null,
          termos_atraso: termoAtraso,
          termos_musica: termoMusica,
          termos_sem_ensaio: termoSemEnsaio,
        };
      } else if (tipoInscricao === 'mostra') {
        inscData = {
          ...baseData,
          modalidade: modalidadeMostra,
          nome_coreografia: nomeCoreografiaMostra,
          tipo_musica: tipoMusicaMostra,
          tipo_participacao: tipoParticipacao,
          preferencia_periodo: periodoMostra,
          sugestao_horario: sugestaoHorario || null,
          lote_mostra_id: loteAtualMostra?.id || null,
          termos_atraso: termoAtrasoM,
          termos_musica: termoMusicaM,
          termos_sem_ensaio: termoSemEnsaioM,
        };
      } else if (tipoInscricao === 'workshop') {
        inscData = {
          ...baseData,
          modalidade: workshopsSelecionados.join(', '),
          nome_coreografia: '',
          tipo_compra_workshop: tipoCompraWorkshop,
          lote_workshop_id: loteAtualWorkshop?.id || null,
        };
      }

      const { data: insc, error: inscError } = await supabase.from('inscricoes').insert(inscData as any).select().single();
      if (inscError) throw inscError;

      // Participantes
      if (participantes.length > 0 && insc) {
        await supabase.from('participantes').insert(
          participantes.map(p => ({ inscricao_id: insc.id, nome: p.nome, cpf: p.cpf || null, email: p.email || null, telefone: p.telefone || null }))
        );
      }

      // Workshop selections
      if (tipoInscricao === 'workshop' && workshopsSelecionados.length > 0 && insc) {
        await supabase.from('inscricao_workshops').insert(
          workshopsSelecionados.map(wid => ({ inscricao_id: insc.id, workshop_id: wid }))
        );
      }

      // Pagamento
      if (insc) {
        await supabase.from('pagamentos').insert({ inscricao_id: insc.id, metodo: metodoPagamento, valor: valorFinal });
      }

      toast({ title: '✅ Inscrição realizada!', description: 'Aguarde a confirmação do pagamento.' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Validate steps ────────────────────────────────────────────────────────
  const evaluateCondition = (condition: any) => {
    if (!condition || !condition.field) return true;
    const val = dadosAdicionais[condition.field] || '';

    switch (condition.operator) {
      case '==': return val == condition.value;
      case '!=': return val != condition.value;
      case '>': return Number(val) > Number(condition.value);
      case '<': return Number(val) < Number(condition.value);
      case 'includes': return String(val).toLowerCase().includes(String(condition.value).toLowerCase());
      default: return true;
    }
  };

  const getVisibleFields = (fields: any[]) => {
    return fields.filter(f => evaluateCondition(f.showIf));
  };

  const canProceedStep2 = () => {
    const config = formConfigs.find(c => c.tipo_inscricao === tipoInscricao);
    if (!config || !config.fields) {
      if (tipoInscricao === 'competicao') return !!modalidade && !!nomeCoreografia;
      if (tipoInscricao === 'mostra') return !!modalidadeMostra && !!nomeCoreografiaMostra;
      if (tipoInscricao === 'workshop') return workshopsSelecionados.length > 0 && !!tipoCompraWorkshop;
      return false;
    }

    let fields = typeof config.fields === 'string' ? JSON.parse(config.fields) : config.fields;
    const visibleFields = getVisibleFields(fields);

    const dynamicValid = visibleFields.every((f: any) =>
      !f.required || (!!dadosAdicionais[f.name] && dadosAdicionais[f.name].toString().trim().length > 0)
    );

    if (tipoInscricao === 'competicao') return !!modalidade && !!nomeCoreografia && dynamicValid;
    if (tipoInscricao === 'mostra') return !!modalidadeMostra && !!nomeCoreografiaMostra && dynamicValid;
    if (tipoInscricao === 'workshop') return workshopsSelecionados.length > 0 && !!tipoCompraWorkshop && dynamicValid;
    return false;
  };

  const canSubmit = () => {
    return termosAceitos;
  };

  const renderField = (f: any) => {
    // Special logic for reserved system fields
    if (f.name === 'periodo') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} {f.required ? '*' : ''}</Label>
          <Select
            value={tipoInscricao === 'mostra' ? periodoMostra : periodo}
            onValueChange={v => tipoInscricao === 'mostra' ? setPeriodoMostra(v) : setPeriodo(v)}
          >
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODOS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (f.name === 'modalidade') {
      const currentModalidade = tipoInscricao === 'mostra' ? modalidadeMostra : modalidade;
      const currentModalidades = tipoInscricao === 'mostra' ? modalidadesMostra : modalidadesComp;

      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select
            value={currentModalidade}
            onValueChange={v => {
              if (tipoInscricao === 'mostra') setModalidadeMostra(v);
              else setModalidade(v);
              const m = currentModalidades.find(x => x.nome === v);
              if (m?.faixa_etaria) setFaixaEtaria(m.faixa_etaria);
            }}
          >
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
            <SelectContent>
              {currentModalidades.map(m => (
                <SelectItem key={m.id} value={m.nome}>
                  {m.nome} {m.horario ? `· ${m.horario}` : ''} {m.faixa_etaria ? `(${m.faixa_etaria})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentModalidades.length === 0 && (
            <p className="text-[10px] text-muted-foreground mt-1 font-sans italic">Defina o período para ver as opções.</p>
          )}
        </div>
      );
    }

    if (f.name === 'categoria') {
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Select value={categoria} onValueChange={v => { setCategoria(v as CategoriaType); setParticipantes([]); }}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (f.name === 'nome_coreografia') {
      const val = tipoInscricao === 'mostra' ? nomeCoreografiaMostra : nomeCoreografia;
      return (
        <div key={f.id} className="space-y-1">
          <Label className="text-foreground font-sans">{f.label} *</Label>
          <Input
            value={val}
            onChange={e => tipoInscricao === 'mostra' ? setNomeCoreografiaMostra(e.target.value) : setNomeCoreografia(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>
      );
    }

    if (f.name === 'tipo_musica') {
      const val = tipoInscricao === 'mostra' ? tipoMusicaMostra : tipoMusica;
      return (
        <div key={f.id} className="space-y-3 p-3 bg-muted/20 rounded-lg">
          <Label className="text-foreground font-sans text-xs font-bold uppercase">{f.label} *</Label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer font-sans text-sm">
              <input type="radio" checked={val === 'solta'} onChange={() => tipoInscricao === 'mostra' ? setTipoMusicaMostra('solta') : setTipoMusica('solta')} className="accent-primary" /> Música solta
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-sans text-sm">
              <input type="radio" checked={val === 'posicionada'} onChange={() => tipoInscricao === 'mostra' ? setTipoMusicaMostra('posicionada') : setTipoMusica('posicionada')} className="accent-primary" /> Música posicionada
            </label>
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
            <SelectContent>
              {TIPO_PARTICIPACAO_MOSTRA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
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
            <SelectContent>
              {WORKSHOP_TIPO_COMPRA.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label} {loteAtualWorkshop ? `— R$ ${(loteAtualWorkshop as any)[`preco_${t.value}`]?.toFixed(2) || ''}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
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
              <button
                key={w.id} type="button" onClick={() => toggleWorkshop(w.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${workshopsSelecionados.includes(w.id) ? 'border-gold bg-primary/10' : 'border-border bg-background hover:border-gold/40'}`}
              >
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

    // Default dynamic field rendering
    return (
      <div key={f.id} className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
        {f.type !== 'checkbox' && <Label className="text-foreground font-sans">{f.label} {f.required ? '*' : ''}</Label>}
        {f.type === 'text' || f.type === 'email' || f.type === 'number' || f.type === 'date' ? (
          <Input
            type={f.type} required={f.required} placeholder={f.placeholder || ''}
            value={dadosAdicionais[f.name] || ''}
            onChange={e => setDadosAdicionais({ ...dadosAdicionais, [f.name]: e.target.value })}
            className="bg-background border-border text-foreground"
          />
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

  // ── Render loading ────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 font-sans text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Link>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-1">Inscrição</h1>
        <p className="text-muted-foreground font-sans mb-6 text-sm">9º F.A.D.D.A - Festival Araraquarense de Danças Árabes</p>

        {/* Progress bar */}
        {step > 0 && (
          <div className="flex gap-1.5 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? 'bg-gradient-gold' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        {/* ─── STEP 0: Tipo de inscrição ─────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Como deseja participar?</h2>
            {TIPO_INSCRICAO_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => {
              const aberta = inscricoesAbertas[value] !== false;
              return (
                <button
                  key={value}
                  disabled={!aberta}
                  onClick={() => { setTipoInscricao(value as any); setStep(1); }}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${aberta ? 'hover:border-gold/60 hover:bg-card cursor-pointer' : 'opacity-50 cursor-not-allowed'} bg-card border-border flex items-start gap-4 group`}
                >
                  <div className={`p-2 rounded-lg bg-primary/10 ${color} mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-serif font-semibold text-foreground">{label}</p>
                      {!aberta && <Badge variant="outline" className="text-xs border-border text-muted-foreground font-sans">Encerrado</Badge>}
                      {aberta && value === 'mostra' && <Badge className="text-xs bg-primary/15 text-primary border-0 font-sans">🎟️ Ingresso incluso</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground font-sans mt-1">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors mt-1 shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* ─── STEP 1: Dados Pessoais ────────────────────────────────────── */}
        {step === 1 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                {tipoInscricao && TIPO_INSCRICAO_OPTIONS.find(t => t.value === tipoInscricao) && (
                  <Badge className="bg-primary/15 text-primary border-0 font-sans text-xs">
                    {TIPO_INSCRICAO_OPTIONS.find(t => t.value === tipoInscricao)?.label}
                  </Badge>
                )}
              </div>
              <CardTitle className="font-serif text-foreground">1. Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-foreground font-sans">CPF *</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="bg-background border-border text-foreground" />
              </div>
              <div>
                <Label className="text-foreground font-sans">Telefone / WhatsApp *</Label>
                <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(16) 99999-9999" className="bg-background border-border text-foreground" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="jalilete" checked={isJalilete} onCheckedChange={v => setIsJalilete(!!v)} />
                <label htmlFor="jalilete" className="text-sm font-sans text-foreground cursor-pointer">Sou aluna Jalilete <span className="text-primary">(10% desconto em todos os lotes)</span></label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="anterior" checked={isAnterior} onCheckedChange={v => setIsAnterior(!!v)} />
                <label htmlFor="anterior" className="text-sm font-sans text-foreground cursor-pointer">Participei de edições anteriores <span className="text-primary">(5% desconto em todos os lotes)</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setStep(0); setTipoInscricao(null); }} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={() => { if (!cpf || !telefone) { toast({ title: 'Preencha CPF e telefone', variant: 'destructive' }); return; } setStep(2); }} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STEP 2: Detalhes por tipo (Agora Dinâmico) ──────────────── */}
        {step === 2 && renderFormStep2()}

        {/* ─── STEP 3: Participantes ─────────────────────────────────────── */}
        {step === 3 && tipoInscricao !== 'workshop' && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-serif text-foreground">3. Participantes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {categoria === 'solo' ? (
                <p className="text-muted-foreground font-sans text-sm">Categoria solo — apenas você participa desta inscrição.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground font-sans">
                    Adicione todos os participantes. <strong className="text-foreground">Nome e CPF são obrigatórios</strong> para cada integrante.
                  </p>
                  {participantes.map((p, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-foreground font-sans">Participante {i + 2}</span>
                        <Button variant="ghost" size="icon" onClick={() => removeParticipante(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                      <Input placeholder="Nome completo *" value={p.nome} onChange={e => updateParticipante(i, 'nome', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="CPF *" value={p.cpf} onChange={e => updateParticipante(i, 'cpf', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="E-mail" value={p.email || ''} onChange={e => updateParticipante(i, 'email', e.target.value)} className="bg-background border-border text-foreground" />
                      <Input placeholder="Telefone" value={p.telefone || ''} onChange={e => updateParticipante(i, 'telefone', e.target.value)} className="bg-background border-border text-foreground" />
                    </div>
                  ))}
                  <Button variant="outline" onClick={addParticipante} className="w-full border-border text-foreground font-sans">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Participante
                  </Button>
                </>
              )}
              {tipoInscricao === 'mostra' && (
                <div className="flex items-center space-x-2">
                  <Checkbox id="harem_m" checked={extraHarem} onCheckedChange={v => setExtraHarem(!!v)} />
                  <label htmlFor="harem_m" className="text-sm font-sans text-foreground cursor-pointer">Participar do Harem das Fadas?</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={() => setStep(4)} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">Próximo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STEP 3 (Workshop): Participantes do grupo ──────────────── */}
        {step === 3 && tipoInscricao === 'workshop' && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-serif text-foreground">3. Resumo e Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2 font-sans text-sm">
                <p className="font-semibold text-foreground mb-2">Resumo</p>
                {workshopsSelecionados.map(id => {
                  const w = workshopsDisponiveis.find(wd => wd.id === id);
                  return w ? <p key={id} className="text-muted-foreground">• {w.nome} ({w.professor})</p> : null;
                })}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between text-foreground"><span>Tipo:</span><span>{WORKSHOP_TIPO_COMPRA.find(t => t.value === tipoCompraWorkshop)?.label}</span></div>
                  <div className="flex justify-between text-foreground"><span>Lote atual:</span><span>{loteAtualWorkshop?.nome || 'N/A'}</span></div>
                  <div className="flex justify-between text-foreground font-bold text-lg mt-1"><span>Total:</span><span className="text-primary">R$ {valorFinal.toFixed(2)}</span></div>
                  {desconto > 0 && <p className="text-primary text-xs">Desconto de {desconto}% aplicado</p>}
                </div>
              </div>

              {/* Como soube */}
              {comoSoubeOpcoes.length > 0 && (
                <div>
                  <Label className="text-foreground font-sans">Como soube do festival?</Label>
                  <Select value={comoSoube} onValueChange={setComoSoube}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {comoSoubeOpcoes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-foreground font-sans">Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={v => setMetodoPagamento(v as any)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão (simulado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {metodoPagamento === 'pix' && (
                <div className="p-4 bg-muted rounded-lg text-center font-sans">
                  <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
                  <p className="font-bold text-foreground text-lg">fadda@festival.com.br</p>
                  <p className="text-xs text-muted-foreground mt-1">Envie o comprovante para confirmação</p>
                </div>
              )}

              {/* ── TERMOS WORKSHOP ── */}
              <div className="rounded-xl border-2 border-gold/40 bg-primary/5 overflow-hidden">
                <div className="flex items-center gap-2 bg-gradient-gold px-4 py-3">
                  <span className="text-lg">📋</span>
                  <p className="font-serif font-bold text-primary-foreground text-base">Regulamento — Workshop</p>
                </div>
                <div className="px-4 pt-4 pb-3 space-y-3">
                  {termosTexto['workshop'] && (
                    <p className="text-sm font-sans text-foreground leading-relaxed">{termosTexto['workshop']}</p>
                  )}
                  <div className="border-t border-gold/20 pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide font-sans">Para prosseguir, marque que está ciente:</p>
                    <label htmlFor="termos_w" className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-primary/5 transition-colors">
                      <Checkbox id="termos_w" checked={termosAceitos} onCheckedChange={v => setTermosAceitos(!!v)} className="mt-0.5 shrink-0" />
                      <span className="text-sm font-sans text-foreground">Li, compreendi e aceito o regulamento do 9º F.A.D.D.A e todas as condições de participação nos Workshops.</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={handleSubmit} disabled={loading || !canSubmit()} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
                  {loading ? 'Processando...' : 'Confirmar Inscrição'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STEP 4: Resumo e Pagamento (Comp/Mostra) ─────────────────── */}
        {step === 4 && tipoInscricao !== 'workshop' && (
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-serif text-foreground">4. Resumo e Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg space-y-2 font-sans text-sm">
                <p className="font-semibold text-foreground mb-2">Resumo da Inscrição</p>
                <div className="flex justify-between text-foreground"><span>Tipo:</span><span className="capitalize">{tipoInscricao}</span></div>
                <div className="flex justify-between text-foreground"><span>Categoria:</span><span>{CATEGORIAS.find(c => c.value === categoria)?.label}</span></div>
                <div className="flex justify-between text-foreground"><span>Modalidade:</span><span>{tipoInscricao === 'mostra' ? modalidadeMostra : modalidade}</span></div>
                <div className="flex justify-between text-foreground"><span>Coreografia:</span><span>{tipoInscricao === 'mostra' ? nomeCoreografiaMostra : nomeCoreografia}</span></div>
                {numIntegrantes > 1 && <div className="flex justify-between text-foreground"><span>Integrantes:</span><span>{numIntegrantes}</span></div>}
                {participantes.length > 0 && (
                  <div>
                    <p className="text-primary font-medium mt-1">Participantes:</p>
                    {participantes.map((p, i) => <p key={i} className="text-muted-foreground pl-2">• {p.nome} {p.cpf ? `(${p.cpf})` : ''}</p>)}
                  </div>
                )}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between text-foreground"><span>Lote:</span><span>{tipoInscricao === 'mostra' ? loteAtualMostra?.nome : loteAtual?.nome || 'N/A'}</span></div>
                  <div className="flex justify-between text-foreground"><span>Valor base:</span><span>R$ {precoBase.toFixed(2)}</span></div>
                  {desconto > 0 && <div className="flex justify-between text-primary"><span>Desconto ({desconto}%):</span><span>- R$ {(precoBase - valorFinal).toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold text-lg text-foreground mt-1"><span>Total:</span><span className="text-primary">R$ {valorFinal.toFixed(2)}</span></div>
                </div>
              </div>

              {/* ── TERMOS destacados antes do pagamento ── */}
              {tipoInscricao === 'competicao' && (
                <div className="rounded-xl border-2 border-gold/40 bg-primary/5 overflow-hidden">
                  <div className="flex items-center gap-2 bg-gradient-gold px-4 py-3">
                    <span className="text-lg">📋</span>
                    <p className="font-serif font-bold text-primary-foreground text-base">Regulamento — Competição</p>
                  </div>
                  <div className="px-4 pt-4 pb-3 space-y-3">
                    {termosTexto['competicao'] && (
                      <div className="max-h-48 overflow-y-auto text-sm font-sans text-foreground leading-relaxed whitespace-pre-line">{termosTexto['competicao']}</div>
                    )}
                    <div className="border-t border-gold/20 pt-3">
                      <label htmlFor="t_final_c" className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                        <Checkbox id="t_final_c" checked={termosAceitos} onCheckedChange={v => setTermosAceitos(!!v)} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-sans text-foreground font-medium">✅ Declaro que li e aceitei os termos e regulamento do 9º F.A.D.D.A.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              {tipoInscricao === 'mostra' && (
                <div className="rounded-xl border-2 border-gold/40 bg-primary/5 overflow-hidden">
                  <div className="flex items-center gap-2 bg-gradient-gold px-4 py-3">
                    <span className="text-lg">📋</span>
                    <p className="font-serif font-bold text-primary-foreground text-base">Regulamento — Mostra</p>
                  </div>
                  <div className="px-4 pt-4 pb-3 space-y-3">
                    {termosTexto['mostra'] && (
                      <p className="text-sm font-sans text-foreground leading-relaxed">{termosTexto['mostra']}</p>
                    )}
                    <div className="border-t border-gold/20 pt-3">
                      <label htmlFor="t_final_m" className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors">
                        <Checkbox id="t_final_m" checked={termosAceitos} onCheckedChange={v => setTermosAceitos(!!v)} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-sans text-foreground font-medium">✅ Declaro que li e aceitei os termos e regulamento do 9º F.A.D.D.A.</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Como soube */}
              {comoSoubeOpcoes.length > 0 && (
                <div>
                  <Label className="text-foreground font-sans">Como soube do festival?</Label>
                  <Select value={comoSoube} onValueChange={setComoSoube}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {comoSoubeOpcoes.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-foreground font-sans">Observações (opcional)</Label>
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="bg-background border-border text-foreground" placeholder="Comentários, dúvidas..." />
              </div>

              <div>
                <Label className="text-foreground font-sans">Método de Pagamento</Label>
                <Select value={metodoPagamento} onValueChange={v => setMetodoPagamento(v as any)}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão (simulado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {metodoPagamento === 'pix' && (
                <div className="p-4 bg-muted rounded-lg text-center font-sans">
                  <p className="text-sm text-muted-foreground mb-1">Chave PIX:</p>
                  <p className="font-bold text-foreground text-lg">fadda@festival.com.br</p>
                  <p className="text-xs text-muted-foreground mt-1">Envie o comprovante para confirmação</p>
                </div>
              )}

              {/* Aceite final já embutido nos cards de termos acima */}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 border-border text-foreground font-sans">Voltar</Button>
                <Button onClick={handleSubmit} disabled={loading || !canSubmit()} className="flex-1 bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans shimmer">
                  {loading ? 'Processando...' : 'Confirmar Inscrição'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Inscricao;
