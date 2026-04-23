// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MANAGED_KEYS = [
  "resend_api_key",
  "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure",
  "mp_access_token", "mp_public_key",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const sb = createClient(supabaseUrl, serviceRoleKey);

  // Validate caller is an admin
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sbUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await sbUser.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: roleData } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (roleData?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // GET — Return only boolean status (never the actual values)
  if (req.method === "GET") {
    const { data } = await sb.from("secure_config").select("chave, valor");
    const status: Record<string, boolean> = {};
    MANAGED_KEYS.forEach(k => { status[k] = false; });
    (data || []).forEach((row: any) => {
      if (MANAGED_KEYS.includes(row.chave)) {
        status[row.chave] = Boolean(row.valor && row.valor.trim() !== "");
      }
    });
    // Also expose env-var MP token presence (without value)
    if (!status.mp_access_token) {
      status.mp_access_token = Boolean(Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN"));
    }
    return new Response(JSON.stringify({ status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // POST — Save a key
  if (req.method === "POST") {
    const body = await req.json();
    const { chave, valor } = body;
    if (!MANAGED_KEYS.includes(chave) || typeof valor !== "string" || valor.trim() === "") {
      return new Response(JSON.stringify({ error: "Chave inválida ou valor vazio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await sb.from("secure_config").upsert(
      { chave, valor: valor.trim(), updated_at: new Date().toISOString() },
      { onConflict: "chave" }
    );
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // DELETE — Remove a key
  if (req.method === "DELETE") {
    const body = await req.json();
    const { chave } = body;
    if (!MANAGED_KEYS.includes(chave)) {
      return new Response(JSON.stringify({ error: "Chave inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await sb.from("secure_config").delete().eq("chave", chave);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
