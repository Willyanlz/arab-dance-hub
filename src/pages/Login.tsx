import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [nome, setNome] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo);
    }
  }, [user, authLoading, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { nome }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(redirectTo);
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <Link to="/" className="text-2xl font-serif font-bold text-gradient-gold mb-2 block">F.A.D.D.A</Link>
          <CardTitle className="text-xl font-serif text-foreground">
            {isForgotPassword ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-sans">
            {isForgotPassword ? 'Digite seu email' : isSignUp ? 'Cadastre-se para se inscrever' : 'Acesse sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isForgotPassword && isSignUp && (
              <div>
                <Label className="text-foreground font-sans">Nome completo</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required className="bg-background border-border text-foreground" />
              </div>
            )}
            <div>
              <Label className="text-foreground font-sans">Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-background border-border text-foreground" />
            </div>
            {!isForgotPassword && (
              <div>
                <Label className="text-foreground font-sans">Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={4} className="bg-background border-border text-foreground" />
                {isSignUp && <p className="text-xs text-muted-foreground font-sans mt-1">Mínimo 4 caracteres</p>}
                {!isSignUp && (
                  <div className="text-right mt-1">
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-primary hover:underline font-sans">
                      Esqueci a senha
                    </button>
                  </div>
                )}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 font-sans">
              {loading ? 'Aguarde...' : isForgotPassword ? 'Enviar Email' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>
          <div className="text-center mt-4 space-y-2 text-sm text-muted-foreground font-sans">
            {isForgotPassword ? (
              <p>
                Lembrou a senha?{' '}
                <button onClick={() => setIsForgotPassword(false)} className="text-primary hover:underline">
                  Voltar ao login
                </button>
              </p>
            ) : (
              <p>
                {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
                  {isSignUp ? 'Entrar' : 'Cadastre-se'}
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
