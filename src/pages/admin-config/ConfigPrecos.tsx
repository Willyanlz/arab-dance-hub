import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Trophy, Star, BookOpen, Ticket, Plus, Trash2 } from 'lucide-react';

export const ConfigPrecos = () => {
  const [loading, setLoading] = useState(true);
  const [lotesComp, setLotesComp] = useState<any[]>([]);
  const [lotesMostra, setLotesMostra] = useState<any[]>([]);
  const [lotesWorkshop, setLotesWorkshop] = useState<any[]>([]);
  const [lotesIngresso, setLotesIngresso] = useState<any[]>([]);

  // New lote form states
  const [novoLoteComp, setNovoLoteComp] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
  const [novoLoteMostra, setNovoLoteMostra] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
  const [novoLoteWorkshop, setNovoLoteWorkshop] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '', preco_pacote_completo: 0, preco_1_aula: 0, preco_2_aulas: 0, preco_3_aulas: 0, preco_4_aulas: 0, preco_5_aulas: 0 });
  const [novoLoteIngresso, setNovoLoteIngresso] = useState({ numero: 1, nome: '', data_inicio: '', data_fim: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all([
      supabase.from('lotes').select('*').order('numero'),
      (supabase.from('lotes_mostra') as any).select('*').order('numero'),
      (supabase.from('lotes_workshop') as any).select('*').order('numero'),
      (supabase.from('lotes_ingresso') as any).select('*').order('numero'),
    ]);
    
    setLotesComp(results[0].data || []);
    setLotesMostra(results[1].data || []);
    setLotesWorkshop(results[2].data || []);
    setLotesIngresso(results[3].data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateLoteField = async (table: string, id: string, field: string, val: any) => {
    await (supabase.from(table as any) as any).update({ [field]: val }).eq('id', id);
    toast({ title: '✅ Atualizado' });
  };

  const deleteLote = async (table: string, id: string) => {
    await (supabase.from(table as any) as any).delete().eq('id', id);
    toast({ title: 'Lote removido' });
    loadData();
  };

  const createLoteComp = async () => {
    if (!novoLoteComp.nome || !novoLoteComp.data_inicio) return;
    await supabase.from('lotes').insert(novoLoteComp as any);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteComp({ numero: lotesComp.length + 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
    loadData();
  };

  const createLoteMostra = async () => {
    if (!novoLoteMostra.nome || !novoLoteMostra.data_inicio) return;
    await (supabase.from('lotes_mostra') as any).insert(novoLoteMostra);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteMostra({ numero: lotesMostra.length + 1, nome: '', data_inicio: '', data_fim: '', preco_solo: 0, preco_dupla_trio: 0, preco_grupo_por_integrante: 0 });
    loadData();
  };

  const createLoteWorkshop = async () => {
    if (!novoLoteWorkshop.nome || !novoLoteWorkshop.data_inicio) return;
    await (supabase.from('lotes_workshop') as any).insert(novoLoteWorkshop);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteWorkshop({ numero: lotesWorkshop.length + 1, nome: '', data_inicio: '', data_fim: '', preco_pacote_completo: 0, preco_1_aula: 0, preco_2_aulas: 0, preco_3_aulas: 0, preco_4_aulas: 0, preco_5_aulas: 0 });
    loadData();
  };

  const createLoteIngresso = async () => {
    if (!novoLoteIngresso.nome || !novoLoteIngresso.data_inicio) return;
    await (supabase.from('lotes_ingresso') as any).insert(novoLoteIngresso);
    toast({ title: '✅ Lote criado!' });
    setNovoLoteIngresso({ numero: lotesIngresso.length + 1, nome: '', data_inicio: '', data_fim: '' });
    loadData();
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-sans">Carregando lotes...</div>;

  return (
    <div className="space-y-6">
      {/* ── COMPETE ── */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-gold-light" />Lotes — Competição</CardTitle></CardHeader>
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
                      <td key={field} className="py-2 pr-3"><Input type="number" defaultValue={l[field]} onBlur={e => updateLoteField('lotes', l.id, field, Number(e.target.value))} className="w-24 h-8 bg-background border-border" /></td>
                    ))}
                    <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input placeholder="Nome" value={novoLoteComp.nome} onChange={e => setNovoLoteComp({ ...novoLoteComp, nome: e.target.value })} />
              <Input type="date" value={novoLoteComp.data_inicio} onChange={e => setNovoLoteComp({ ...novoLoteComp, data_inicio: e.target.value })} />
              <Input type="date" value={novoLoteComp.data_fim} onChange={e => setNovoLoteComp({ ...novoLoteComp, data_fim: e.target.value })} />
              <Button onClick={createLoteComp} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MOSTRA ── */}
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
                      <td key={field} className="py-2 pr-3"><Input type="number" defaultValue={l[field]} onBlur={e => updateLoteField('lotes_mostra', l.id, field, Number(e.target.value))} className="w-24 h-8 bg-background border-border" /></td>
                    ))}
                    <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes_mostra', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input placeholder="Nome" value={novoLoteMostra.nome} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, nome: e.target.value })} />
              <Input type="date" value={novoLoteMostra.data_inicio} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, data_inicio: e.target.value })} />
              <Input type="date" value={novoLoteMostra.data_fim} onChange={e => setNovoLoteMostra({ ...novoLoteMostra, data_fim: e.target.value })} />
              <Button onClick={createLoteMostra} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── WORKSHOP ── */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-serif text-foreground text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" />Lotes — Workshop</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead><tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 pr-2">Lote</th><th className="text-left py-2 pr-2">Pacote</th><th className="text-left py-2 pr-2">1 aula</th><th></th>
              </tr></thead>
              <tbody>
                {lotesWorkshop.map(l => (
                  <tr key={l.id} className="border-b border-border/50">
                    <td className="py-2 pr-2 text-foreground font-medium text-xs">{l.nome}</td>
                    <td className="py-2 pr-2"><Input type="number" defaultValue={l.preco_pacote_completo} onBlur={e => updateLoteField('lotes_workshop', l.id, 'preco_pacote_completo', Number(e.target.value))} className="w-20 h-8 bg-background" /></td>
                    <td className="py-2 pr-2"><Input type="number" defaultValue={l.preco_1_aula} onBlur={e => updateLoteField('lotes_workshop', l.id, 'preco_1_aula', Number(e.target.value))} className="w-20 h-8 bg-background" /></td>
                    <td><Button variant="ghost" size="icon" onClick={() => deleteLote('lotes_workshop', l.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4">
            <Input placeholder="Nome" value={novoLoteWorkshop.nome} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, nome: e.target.value })} />
            <Input type="date" value={novoLoteWorkshop.data_inicio} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, data_inicio: e.target.value })} />
            <Input type="date" value={novoLoteWorkshop.data_fim} onChange={e => setNovoLoteWorkshop({ ...novoLoteWorkshop, data_fim: e.target.value })} />
            <Button onClick={createLoteWorkshop} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
          </div>
        </CardContent>
      </Card>

      {/* ── INGRESSO ── */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
            <Input placeholder="Nome" value={novoLoteIngresso.nome} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, nome: e.target.value })} />
            <Input type="date" value={novoLoteIngresso.data_inicio} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, data_inicio: e.target.value })} />
            <Input type="date" value={novoLoteIngresso.data_fim} onChange={e => setNovoLoteIngresso({ ...novoLoteIngresso, data_fim: e.target.value })} />
            <Button onClick={createLoteIngresso} className="bg-gradient-gold"><Plus className="w-4 h-4 mr-1" /> Criar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
