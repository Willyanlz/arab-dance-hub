import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Ticket, Settings2, FileText, BookOpen, Store, Calendar, Shield, LayoutGrid, Coins, ClipboardList, Menu, X } from 'lucide-react';

const AdminConfig = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate('/login');
  }, [user, authLoading, isAdmin, navigate]);

  // Extract current tab from URL
  const currentTab = location.pathname.split('/').pop() || 'geral';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground font-sans">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const handleTabChange = (value: string) => {
    navigate(`/admin/config/${value}`);
    setMobileMenuOpen(false);
  };

  const tabs = [
    { value: 'geral', label: 'Inscrições', icon: Settings2 },
    { value: 'precos', label: 'Lotes/Preços', icon: Coins },
    { value: 'formularios', label: 'Formulários', icon: ClipboardList },
    { value: 'termos', label: 'Termos', icon: FileText },
    { value: 'workshops', label: 'Workshops', icon: BookOpen },
    { value: 'ingressos', label: 'Ingressos', icon: Ticket },
    { value: 'stands', label: 'Stands', icon: Store },
    { value: 'landpage', label: 'Evento', icon: Calendar },
    { value: 'email-template', label: 'E-mail', icon: LayoutGrid },
    { value: 'admins', label: 'Admins', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-full"><ArrowLeft className="w-5 h-5" /></Link>
            <Link to="/" className="text-xl font-serif font-bold text-gradient-gold">F.A.D.D.A</Link>
            <Badge className="bg-accent/50 text-accent-foreground font-sans border-border">Gerenciamento</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Configurações do Sistema</h1>
            <p className="text-muted-foreground font-sans">Customize o evento, preços e regras do festival.</p>
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="outline" 
              className="w-full flex justify-between items-center border-border text-foreground h-12 px-4 font-sans"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="flex items-center gap-2">
                {tabs.find(t => t.value === currentTab)?.icon && (
                  <div className="p-1 bg-primary/10 rounded">
                    {(() => {
                      const Icon = tabs.find(t => t.value === currentTab)?.icon;
                      return Icon ? <Icon className="w-4 h-4 text-primary" /> : null;
                    })()}
                  </div>
                )}
                {tabs.find(t => t.value === currentTab)?.label || 'Menu de Configurações'}
              </span>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 w-full h-full z-[9999] bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-sans transition-colors ${
                    currentTab === tab.value 
                      ? 'bg-primary text-primary-foreground font-bold' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${currentTab === tab.value ? 'text-primary-foreground' : 'text-primary'}`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="hidden md:inline-flex bg-muted/50 w-full flex-wrap h-auto gap-1 p-1 justify-start border border-border">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="font-sans text-xs px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <tab.icon className="w-3.5 h-3.5 mr-2 opacity-70" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Outlet />
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminConfig;
