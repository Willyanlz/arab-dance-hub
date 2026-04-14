import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CheckCircle2, XCircle, Users, LayoutDashboard } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminScanner() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [acaoLoading, setAcaoLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (ticketId) fetchTicket(ticketId);
  }, [ticketId]);

  const fetchTicket = async (id: string) => {
    setLoadingTicket(true);
    try {
      const { data, error } = await supabase
        .from('ingressos_vendidos')
        .select('*, tipos_ingresso!inner(nome)')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setTicket(data);
    } catch (err) {
      toast({ title: 'Erro ao buscar ticket', description: 'QR Code inválido ou ticket não encontrado.', variant: 'destructive' });
      setTicket(null);
    } finally {
      setLoadingTicket(false);
    }
  };

  const handleScan = (detected: string) => {
    if (detected) {
      try {
        const decoded = atob(detected);
        if (decoded && decoded !== ticketId) {
          setTicketId(decoded);
        }
      } catch (err) {
        toast({ title: 'QR Inválido', description: 'Não foi possível decodificar o QR Code.', variant: 'destructive' });
      }
    }
  };

  const validarTicket = async () => {
    if (!ticket) return;
    setAcaoLoading(true);
    
    const novaValidadada = (ticket.quantidade_validada || 0) + 1;
    
    if (novaValidadada > ticket.quantidade) {
      toast({ title: 'Erro', description: 'Todos os tickets dessa compra já foram validados.', variant: 'destructive' });
      setAcaoLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('ingressos_vendidos')
        .update({ quantidade_validada: novaValidadada })
        .eq('id', ticket.id);

      if (error) throw error;
      
      toast({ title: 'Entrada Validada!', description: `${novaValidadada}/${ticket.quantidade} utilizados.`, variant: 'default' });
      fetchTicket(ticket.id); // reload
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setAcaoLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-serif font-bold text-gradient-gold">Scanner de Ingressos</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <Card className="border-border bg-card overflow-hidden">
          <div className="aspect-square bg-black relative max-w-sm mx-auto overflow-hidden">
            <Scanner 
              onScan={(result) => {
                if (result && result.length > 0) {
                   handleScan(result[0].rawValue);
                }
              }}
            />
          </div>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground font-sans">Aponte a câmera para o QR Code do ingresso</p>
          </CardContent>
        </Card>

        {loadingTicket && (
          <div className="text-center p-4">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-sans">Buscando informações do ticket...</p>
          </div>
        )}

        {ticket && !loadingTicket && (
          <Card className={`border-2 ${ticket.status !== 'Concluído' ? 'border-destructive' : (ticket.quantidade_validada >= ticket.quantidade ? 'border-none opacity-80' : 'border-green-500')} bg-card`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-serif text-foreground">{ticket.tipos_ingresso?.nome}</h2>
                  <p className="text-sm text-muted-foreground font-sans">Comprador: <span className="text-foreground">{ticket.nome_comprador}</span></p>
                  <p className="text-sm text-muted-foreground font-sans">E-mail: <span className="text-foreground">{ticket.email}</span></p>
                </div>
                {ticket.status === 'Concluído' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive" />
                )}
              </div>
              
              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="font-sans text-foreground text-sm">Quantidade Comprada:</span>
                </div>
                <span className="font-bold text-lg text-foreground">{ticket.quantidade}</span>
              </div>

              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="font-sans text-foreground text-sm">Validada (Entraram):</span>
                </div>
                <span className={`font-bold text-lg ${ticket.quantidade_validada >= ticket.quantidade ? 'text-destructive' : 'text-green-500'}`}>
                  {ticket.quantidade_validada || 0}
                </span>
              </div>

              {ticket.status !== 'Concluído' ? (
                <div className="p-3 bg-destructive/10 text-destructive text-sm font-bold text-center rounded-lg mt-4 font-sans">
                  Pagamento não concluído.
                </div>
              ) : ticket.quantidade_validada >= ticket.quantidade ? (
                <div className="p-3 bg-muted text-muted-foreground text-sm font-bold text-center rounded-lg mt-4 font-sans border border-border">
                  Todos os ingressos utilizados.
                </div>
              ) : (
                <Button 
                  onClick={validarTicket} 
                  disabled={acaoLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-sans text-lg h-12 mt-4"
                >
                  {acaoLoading ? 'Validando...' : 'Dar Baixa em 1 Ingresso'}
                </Button>
              )}

              <Button variant="outline" className="w-full mt-2 text-muted-foreground" onClick={() => { setTicket(null); setTicketId(null); }}>
                Escanear Outro
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
