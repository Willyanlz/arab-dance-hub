import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { isValidCpf, isValidEmail, isValidPhoneBR, maskCpf, maskPhone } from '@/lib/inputValidation';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login?redirect=/perfil');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');

    supabase
      .from('profiles')
      .select('nome, cpf, telefone')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setNome(data.nome || '');
          setCpf(data.cpf || '');
          setTelefone(data.telefone || '');
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      if (cpf && !isValidCpf(cpf)) {
        toast({ title: 'CPF inválido', variant: 'destructive' });
        setSaving(false);
        return;
      }
      if (telefone && !isValidPhoneBR(telefone)) {
        toast({ title: 'WhatsApp inválido', description: 'Use DDD + número (ex: 16999999999).', variant: 'destructive' });
        setSaving(false);
        return;
      }
      if (email && !isValidEmail(email)) {
        toast({ title: 'E-mail inválido', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          nome,
          cpf,
          telefone,
          email,
        } as any, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      if (email && email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) throw emailError;
      }

      if (senha.trim().length > 0) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: senha });
        if (passwordError) throw passwordError;
        setSenha('');
      }

      toast({ title: 'Perfil atualizado com sucesso' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar perfil', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-sans">Carregando perfil...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para dashboard
        </Link>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-serif text-foreground text-2xl">Meu perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="font-sans">Nome</Label>
              <Input value={nome} onChange={(event) => setNome(event.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="font-sans">CPF</Label>
                <Input value={cpf} onChange={(event) => setCpf(maskCpf(event.target.value))} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1">
                <Label className="font-sans">WhatsApp</Label>
                <Input value={maskPhone(telefone)} onChange={(event) => setTelefone(event.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="(16) 99999-9999" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="font-sans">E-mail</Label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-sans">Nova senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto bg-gradient-gold text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
