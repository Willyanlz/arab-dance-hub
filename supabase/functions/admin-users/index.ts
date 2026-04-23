import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create an authenticated client to check the requesting user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    // Check if user is admin
    const { data: isAdmin, error: roleErr } = await userClient.rpc('has_role', { user_id: user.id, role: 'admin' });
    if (roleErr || !isAdmin) throw new Error("Forbidden: Admin only");

    // Supabase Admin client for auth bypass ops
    const sbAdmin = createClient(supabaseUrl, serviceRole);

    const payload = await req.json().catch(() => ({}));
    const action = payload.action;

    if (action === "create_user") {
      const { email, nome, cpf, telefone } = payload;
      if (!email || !nome) throw new Error("Missing email or nome");

      // We explicitly leave password out. So we can generate a recovery link below and password works.
      const tempPassword = crypto.randomUUID() + "Aa1@"; // Just a random strong stub

      const { data: newUser, error: createErr } = await sbAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, 
        user_metadata: { nome, cpf, telefone }
      });
      
      if (createErr) throw createErr;

      // Because we inserted a user, a trigger probably creates their profile. If not, the profile trigger handles it.
      // But we will attempt to generate a password reset link to them and send it!
      const { data: linkData, error: linkErr } = await sbAdmin.auth.admin.generateLink({
        type: 'recovery',
        email
      });
      // The generateLink above DOES NOT send the email by default if we just get the link, wait. 
      // Actually, if we use `auth.resetPasswordForEmail()` we can send the standard email instead!
      // Let's just execute standard reset password to trigger the email:
      await sbAdmin.auth.resetPasswordForEmail(email);

      return new Response(JSON.stringify({ ok: true, user: newUser.user }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "update_user") {
      const { target_user_id, email, nome, cpf, telefone } = payload;
      if (!target_user_id) throw new Error("Missing target_user_id");

      const ops: any = {};
      
      // Update auth email if strictly provided
      if (email) {
         const { error: updErr } = await sbAdmin.auth.admin.updateUserById(target_user_id, { email });
         if (updErr) throw updErr;
      }

      // Update their profile
      const updates = { updated_at: new Date().toISOString() } as any;
      if (nome) updates.nome = nome;
      if (cpf) updates.cpf = cpf;
      if (telefone !== undefined) updates.telefone = telefone;

      if (Object.keys(updates).length > 1) {
         const { error: profErr } = await sbAdmin.from("profiles").update(updates).eq("user_id", target_user_id);
         if (profErr) throw profErr;
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else if (action === "send_reset_password") {
       const { email } = payload;
       if (!email) throw new Error("Missing email");

       const { error: resetErr } = await sbAdmin.auth.resetPasswordForEmail(email);
       if (resetErr) throw resetErr;

       return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
