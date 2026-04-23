import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Save, Plug, Mail, Trash2, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Status {
  resend_api_key: boolean;
  smtp_host: boolean;
  smtp_user: boolean;
  mp_access_token: boolean;
  mp_public_key: boolean;
  [key: string]: boolean;
}

export const ConfigIntegracoes = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>({
    resend_api_key: false,
    smtp_host: false,
    smtp_user: false,
    mp_access_token: false,
    mp_public_key: false,
  });

  const [resendKey, setResendKey] = useState("");
  const [mpToken, setMpToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");

  const [smtp, setSmtp] = useState({
    host: "",
    port: "465",
    user: "",
    pass: "",
    from: "",
    secure: "true",
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secrets`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Erro ao carregar status das chaves");
      const { status: s } = await res.json();
      setStatus(s || {});
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSecret = async (chave: string, valor: string) => {
    if (!valor.trim()) {
      toast({ title: "Erro", description: "O valor não pode ser vazio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secrets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ chave, valor }),
        }
      );
      if (!res.ok) throw new Error("Erro ao salvar chave");
      
      toast({ title: "✅ Salvo com sucesso!" });
      loadStatus(); // Reload statuses
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSecret = async (chave: string) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secrets`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ chave }),
        }
      );
      if (!res.ok) throw new Error("Erro ao remover chave");
      
      toast({ title: "Removido com sucesso!" });
      loadStatus();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveSMTP = async () => {
    if (!smtp.host || !smtp.user || !smtp.pass) {
      toast({ title: "Erro", description: "Host, Usuário e Senha são obrigatórios para SMTP.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const keys = [
        { chave: "smtp_host", valor: smtp.host },
        { chave: "smtp_port", valor: smtp.port },
        { chave: "smtp_user", valor: smtp.user },
        { chave: "smtp_pass", valor: smtp.pass },
        { chave: "smtp_from", valor: smtp.from },
        { chave: "smtp_secure", valor: smtp.secure },
      ];

      for (const k of keys) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secrets`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(k),
        });
      }

      toast({ title: "✅ SMTP salvo com sucesso!" });
      loadStatus();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSMTP = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const keys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure"];
      for (const k of keys) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-secrets`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ chave: k }),
        });
      }

      toast({ title: "SMTP removido." });
      loadStatus();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Carregando integrações...</div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-primary/10 border-primary/20">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold">Segurança Máxima</AlertTitle>
        <AlertDescription className="text-sm text-foreground/80">
          As chaves salvas aqui são criptografadas e enviadas diretamente para o servidor. Por motivos de segurança, 
          elas <strong>nunca são exibidas ou retornadas</strong> para o navegador após salvas. 
          Você verá apenas o status de configuração.
        </AlertDescription>
      </Alert>

      {/* Mercado Pago */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Plug className="w-5 h-5 text-blue-500" /> Mercado Pago (Produção)
          </CardTitle>
          <CardDescription>
            Insira o Access Token de produção. Essa chave será usada apenas no servidor (Edge Functions).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-md border border-border">
            <div className="flex-1">
              <span className="text-sm font-semibold block">Access Token:</span>
              {status.mp_access_token ? (
                <span className="text-green-500 flex items-center gap-1 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Configurado
                </span>
              ) : (
                <span className="text-yellow-500 text-sm">⚠️ Não configurado</span>
              )}
            </div>
            {status.mp_access_token && (
              <Button variant="destructive" size="sm" onClick={() => deleteSecret("mp_access_token")} disabled={saving}>
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-md border border-border">
            <div className="flex-1">
              <span className="text-sm font-semibold block">Public Key:</span>
              {status.mp_public_key ? (
                <span className="text-green-500 flex items-center gap-1 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Configurado
                </span>
              ) : (
                <span className="text-yellow-500 text-sm">⚠️ Não configurado</span>
              )}
            </div>
            {status.mp_public_key && (
              <Button variant="destructive" size="sm" onClick={() => deleteSecret("mp_public_key")} disabled={saving}>
                <Trash2 className="w-4 h-4 mr-1" /> Remover
              </Button>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="APP_USR-..."
                  value={mpToken}
                  onChange={(e) => setMpToken(e.target.value)}
                />
                <Button onClick={() => { saveSecret("mp_access_token", mpToken); setMpToken(""); }} disabled={saving || !mpToken}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Public Key</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="APP_USR-..."
                  value={mpPublicKey}
                  onChange={(e) => setMpPublicKey(e.target.value)}
                />
                <Button onClick={() => { saveSecret("mp_public_key", mpPublicKey); setMpPublicKey(""); }} disabled={saving || !mpPublicKey}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provedor de Email */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-gold" /> Provedor de E-mail
          </CardTitle>
          <CardDescription>
            Configure como o sistema enviará e-mails. O sistema tenta usar a Resend primeiro; se não houver chave, usa o SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* Resend */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-background">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Resend API (Recomendado)</h3>
              {status.resend_api_key ? (
                <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Configurado</Badge>
              ) : (
                <Badge variant="outline">Não configurado</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              O Resend é otimizado para e-mails transacionais (limite de 3.000/mês grátis).
            </p>
            
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="re_..."
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
              />
              <Button onClick={() => { saveSecret("resend_api_key", resendKey); setResendKey(""); }} disabled={saving || !resendKey}>
                <Save className="w-4 h-4 mr-1" /> Salvar
              </Button>
              {status.resend_api_key && (
                <Button variant="destructive" onClick={() => deleteSecret("resend_api_key")} disabled={saving}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-sm font-bold text-muted-foreground">OU</div>

          {/* SMTP */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-background relative overflow-hidden">
            {status.resend_api_key && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                <p className="font-bold text-foreground">SMTP Desativado</p>
                <p className="text-sm text-muted-foreground">Remova a chave do Resend para usar SMTP</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">SMTP Customizado (ex: Gmail)</h3>
              {status.smtp_host ? (
                <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Configurado</Badge>
              ) : (
                <Badge variant="outline">Não configurado</Badge>
              )}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como configurar o Gmail</AlertTitle>
              <AlertDescription className="text-xs space-y-1 mt-2">
                <p>1. Ative a "Verificação em duas etapas" na sua conta Google.</p>
                <p>2. Vá em Segurança &gt; Senhas de App (App Passwords).</p>
                <p>3. Gere uma nova senha e cole no campo "Senha" abaixo (NÃO use a senha normal do seu email).</p>
                <p>Host: <strong>smtp.gmail.com</strong> | Porta: <strong>465</strong></p>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <Label>Host SMTP</Label>
                <Input value={smtp.host} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" />
              </div>
              <div className="space-y-1">
                <Label>Porta</Label>
                <Input value={smtp.port} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} placeholder="465" />
              </div>
              <div className="space-y-1">
                <Label>Usuário (E-mail)</Label>
                <Input value={smtp.user} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} placeholder="seuemail@gmail.com" />
              </div>
              <div className="space-y-1">
                <Label>Senha (App Password)</Label>
                <Input type="password" value={smtp.pass} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} placeholder="••••••••••••" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Nome do Remetente Customizado (Opcional)</Label>
                <Input value={smtp.from} onChange={(e) => setSmtp({ ...smtp, from: e.target.value })} placeholder="FADDA <seuemail@gmail.com>" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              {status.smtp_host && (
                <Button variant="destructive" onClick={deleteSMTP} disabled={saving}>
                  <Trash2 className="w-4 h-4 mr-1" /> Remover SMTP
                </Button>
              )}
              <Button onClick={saveSMTP} disabled={saving}>
                <Save className="w-4 h-4 mr-1" /> Salvar Configuração SMTP
              </Button>
            </div>

          </div>

        </CardContent>
      </Card>
    </div>
  );
};
