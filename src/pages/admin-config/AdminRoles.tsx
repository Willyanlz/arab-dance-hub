import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Trash2, Shield, Search } from 'lucide-react';

interface AdminRoleItem {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    nome?: string;
    email?: string;
  };
}

export function AdminRoles() {
  const [admins, setAdmins] = useState<AdminRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    const { data: rolesData, error: rolesErr } = await supabase
      .from('user_roles')
      .select('id, user_id, role')
      .eq('role', 'admin');

    if (rolesErr) {
      toast({ title: 'Erro ao carregar admins', description: rolesErr.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const userIds = (rolesData || []).map((role) => role.user_id);
    if (userIds.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const { data: profilesData, error: profilesErr } = await supabase
      .from('profiles')
      .select('user_id, nome, email')
      .in('user_id', userIds);

    if (profilesErr) {
      toast({ title: 'Erro ao carregar perfis', description: profilesErr.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const profileMap = new Map((profilesData || []).map((profile) => [profile.user_id, profile]));
    const merged = (rolesData || []).map((role) => ({
      ...role,
      profiles: profileMap.get(role.user_id),
    }));

    setAdmins(merged);
    setLoading(false);
  };

  const handleAddAdmin = async () => {
    if (!searchEmail) return;
    setSearching(true);

    try {
      // Find user by email in profiles
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id, nome, email')
        .eq('email', searchEmail.toLowerCase())
        .single();

      if (profileErr || !profileData) {
        toast({ title: 'Usuário não encontrado', description: 'Nenhum usuário cadastrado com este e-mail.', variant: 'destructive' });
        setSearching(false);
        return;
      }

      // Check if already exist
      const existing = admins.find(a => a.user_id === profileData.user_id);
      if (existing) {
        toast({ title: 'Aviso', description: 'Este usuário já é um administrador.' });
        setSearchEmail('');
        setSearching(false);
        return;
      }

      // Insert role
      const { error: insertErr } = await supabase
        .from('user_roles')
        .insert({ user_id: profileData.user_id, role: 'admin' });

      if (insertErr) throw insertErr;

      toast({ title: '✅ Administrador adicionado!' });
      setSearchEmail('');
      loadAdmins();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveAdmin = async (id: string, user_id: string, email: string) => {
    // Current user shouldn't be able to remove themselves easily (to prevent locking out), but let's allow it with confirmation
    if (confirm(`Tem certeza que deseja remover os privilégios de administrador de ${email}?`)) {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Administrador removido' });
        loadAdmins();
      }
    }
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground font-sans">Carregando administradores...</div>;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="font-serif text-foreground text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Permissões de Administrador
        </CardTitle>
        <CardDescription className="font-sans text-muted-foreground">
          Gerencie quem tem acesso ao painel de administração.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input 
              placeholder="E-mail do usuário..." 
              value={searchEmail} 
              onChange={e => setSearchEmail(e.target.value)}
              className="pl-9 bg-background border-border text-foreground w-full"
            />
          </div>
          <Button onClick={handleAddAdmin} disabled={searching || !searchEmail} className="bg-primary text-primary-foreground font-sans">
            Adicionar Admin
          </Button>
        </div>

        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm text-left font-sans">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Nenhum administrador encontrado.</td></tr>
              ) : (
                admins.map(admin => (
                  <tr key={admin.id} className="bg-card hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{admin.profiles?.nome || 'Desconhecido'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{admin.profiles?.email || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveAdmin(admin.id, admin.user_id, admin.profiles?.email)} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  );
}
