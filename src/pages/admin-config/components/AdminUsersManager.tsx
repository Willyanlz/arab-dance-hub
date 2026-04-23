import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Users, Search, Edit, Send, Plus, KeyRound } from 'lucide-react';
import { maskCpf, maskPhone } from '@/lib/inputValidation';

interface UserProfile {
  user_id: string;
  nome: string | null;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
}

export const AdminUsersManager = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('user_id, nome, cpf, email, telefone')
      .order('nome');
      
    if (error) {
      toast({ title: 'Erro ao carregar usuários', description: error.message, variant: 'destructive' });
    } else {
      setUsers(profiles || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setNome('');
    setEmail('');
    setCpf('');
    setTelefone('');
    setSelectedUserId('');
    setIsEdit(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    resetForm();
    setIsEdit(true);
    setSelectedUserId(user.user_id);
    setNome(user.nome || '');
    setEmail(user.email || '');
    setCpf(user.cpf || '');
    setTelefone(user.telefone || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!email || !nome) {
      toast({ title: 'Campos obrigatórios', description: 'Nome e E-mail são obrigatórios', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = isEdit ? {
        action: 'update_user',
        target_user_id: selectedUserId,
        email, nome, cpf, telefone
      } : {
        action: 'create_user',
        email, nome, cpf, telefone
      };

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: payload
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ 
        title: isEdit ? 'Usuário atualizado!' : 'Usuário criado!', 
        description: isEdit ? 'Os dados foram alterados com sucesso.' : 'Um e-mail para a criação da senha foi enviado ao participante.' 
      });
      
      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendResetPassword = async (userEmail: string) => {
    if (!confirm('Deseja enviar um link de redefinição de senha para ' + userEmail + '?')) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'send_reset_password', email: userEmail }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      toast({ title: 'E-mail enviado', description: 'Link de redefinição enviado com sucesso.' });
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(u => 
    (u.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cpf || '').includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Gestão de Usuários</h2>
          <p className="text-sm text-muted-foreground font-sans">
            Adicione participantes manualmente ou recupere acessos de contas existentes.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-gradient-gold text-primary-foreground font-sans">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome, email ou cpf..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground font-sans text-sm">Carregando usuários...</div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <Card key={user.user_id} className="bg-card border-border hover:border-primary/20 transition-colors">
              <CardContent className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> {user.nome || 'Sem nome'}
                  </h3>
                  <div className="text-sm text-muted-foreground font-sans flex flex-wrap gap-x-4 mt-1">
                    <span>{user.email || 'Sem e-mail'}</span>
                    {user.cpf && <span>CPF: {user.cpf}</span>}
                    {user.telefone && <span>Tel: {user.telefone}</span>}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => handleSendResetPassword(user.email || '')}
                    disabled={!user.email}
                  >
                    <KeyRound className="w-3 h-3 mr-1" /> Resetar Senha
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-border text-foreground"
                    onClick={() => handleOpenEdit(user)}
                  >
                    <Edit className="w-3 h-3 mr-1" /> Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground font-sans text-sm">Nenhum usuário encontrado.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="bg-card w-full max-w-md max-h-[90vh] overflow-y-auto border-border">
            <div className="p-4 sm:p-6 space-y-4">
              <h3 className="text-xl font-serif font-bold text-foreground">
                {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground font-sans">Nome Completo *</Label>
                  <Input value={nome} onChange={e => setNome(e.target.value)} className="bg-background border-border" />
                </div>
                
                <div>
                  <Label className="text-foreground font-sans">E-mail *</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="bg-background border-border" 
                    placeholder="Para login e notificações"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground font-sans">CPF</Label>
                    <Input 
                      value={cpf} 
                      onChange={e => setCpf(maskCpf(e.target.value))} 
                      className="bg-background border-border" 
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label className="text-foreground font-sans">Telefone</Label>
                    <Input 
                      value={telefone} 
                      onChange={e => setTelefone(maskPhone(e.target.value.replace(/\D/g, '')))} 
                      className="bg-background border-border" 
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                
                {!isEdit && (
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-xs text-primary font-sans">
                    Um e-mail será enviado ao usuário contendo um link para ele configurar sua senha no primeiro acesso.
                  </div>
                )}
                {isEdit && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg text-xs text-yellow-700 font-sans">
                    Cuidado: Alterar o e-mail aqui mudará o e-mail utilizado pelo usuário para fazer login.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button variant="ghost" onClick={() => setShowModal(false)} className="text-foreground">Cancelar</Button>
                  <Button onClick={handleSave} disabled={submitting} className="bg-gradient-gold text-primary-foreground">
                    {submitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
