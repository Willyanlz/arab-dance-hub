// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendResult {
  sent: boolean;
  provider?: "resend" | "smtp" | "none";
  error?: string;
}

/** Loads secure config from DB using service role */
async function loadSecureConfig(sb: any): Promise<Record<string, string>> {
  const { data } = await sb
    .from("secure_config")
    .select("chave, valor")
    .in("chave", [
      "resend_api_key",
      "smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_secure",
    ]);
  const cfg: Record<string, string> = {};
  (data || []).forEach((r: any) => { cfg[r.chave] = r.valor || ""; });
  return cfg;
}

/** Send email via Resend REST API */
async function sendViaResend(key: string, payload: EmailPayload, from: string): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return { sent: false, provider: "resend", error: err };
  }
  return { sent: true, provider: "resend" };
}

/** Send email via SMTP using Nodemailer (NPM) */
async function sendViaSMTP(cfg: Record<string, string>, payload: EmailPayload): Promise<SendResult> {
  try {
    // @ts-ignore
    const nodemailer = await import("npm:nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: parseInt(cfg.smtp_port || "465"),
      secure: cfg.smtp_secure !== "false", // true for 465, false for other ports
      auth: {
        user: cfg.smtp_user,
        pass: cfg.smtp_pass,
      },
    });

    const fromAddr = payload.from || cfg.smtp_from || cfg.smtp_user;
    const info = await transporter.sendMail({
      from: fromAddr,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    console.log("[mailer] SMTP sent:", info.messageId);
    return { sent: true, provider: "smtp" };
  } catch (e: any) {
    console.error("[mailer] SMTP error:", e.message);
    return { sent: false, provider: "smtp", error: e.message };
  }
}

/**
 * Main send function: tries Resend first (env var → DB), then SMTP.
 * Falls back gracefully — never throws.
 */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const sb = createClient(supabaseUrl, serviceRoleKey);

  const cfg = await loadSecureConfig(sb);

  // Priority 1: SMTP (If configured in DB, use it first)
  if (cfg.smtp_host && cfg.smtp_user && cfg.smtp_pass) {
    return await sendViaSMTP(cfg, payload);
  }

  // Priority 2: Resend (Fallback)
  const resendKeyEnv = Deno.env.get("RESEND_KEY") || "";
  const resendKeyDB = cfg.resend_api_key || "";
  const resendKey = resendKeyDB || resendKeyEnv; // DB key takes precedence over ENV

  if (resendKey) {
    // If it's the default trial key, we must use onboarding@resend.dev
    // If it's a production key, the user SHOULD have configured a 'from' in DB
    const from = payload.from || cfg.smtp_from || "onboarding@resend.dev";
    
    // Ensure 'from' has a name if it's just an email
    const finalFrom = from.includes("<") ? from : `FADDA <${from}>`;
    
    return await sendViaResend(resendKey, payload, finalFrom);
  }

  // No provider configured — log and return gracefully
  console.warn("[mailer] No email provider configured. Email not sent to:", payload.to);
  return { sent: false, provider: "none", error: "no_provider_configured" };
}
