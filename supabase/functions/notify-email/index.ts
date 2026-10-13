// VIVERST · notify-email
// Called by the scheduler every 10 minutes. Emails unsent notifications as one
// digest to the address in Settings → Notifications, via Resend, when a
// resend_api_key secret exists. With no key it does nothing and reports why.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { CORS, json } from "../_shared/ai.ts";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;
type N = { id: number; kind: string; title: string; body: string; link: string | null; created_at: string };

export async function sendDigest(sb: Db, adminUrl: string, fetchImpl: typeof fetch = fetch) {
  const [{ data: secret }, { data: setting }, { data: contact }] = await Promise.all([
    sb.from("secrets").select("value").eq("key", "resend_api_key").maybeSingle(),
    sb.from("settings").select("value").eq("key", "notifications").maybeSingle(),
    sb.from("settings").select("value").eq("key", "contact").maybeSingle(),
  ]);
  const key = secret?.value;
  const cfg = (setting?.value ?? {}) as { email_enabled?: boolean; email_to?: string; from?: string };
  const to = cfg.email_to || (contact?.value as { email?: string })?.email;
  if (cfg.email_enabled === false) return { ok: true, skipped: "email alerts are off" };
  if (!key) return { ok: true, skipped: "no Resend key set" };
  if (!to) return { ok: true, skipped: "no email address set in Settings → Notifications or Contact" };

  const { data: pending } = await sb.from("notifications").select("id, kind, title, body, link, created_at").is("emailed_at", null).order("created_at").limit(50);
  const items = (pending ?? []) as N[];
  if (!items.length) return { ok: true, skipped: "nothing to send" };

  const esc = (s: string) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const rows = items.map((n) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e6e9f2"><strong>${esc(n.title)}</strong><br><span style="color:#5b6b86">${esc(n.body)}</span>${n.link ? `<br><a href="${esc(adminUrl + n.link)}" style="color:#0464de">Open in admin</a>` : ""}</td></tr>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#06065d"><h2 style="margin:0 0 4px">Viverst admin</h2><p style="margin:0 0 16px;color:#5b6b86">${items.length} new ${items.length === 1 ? "notification" : "notifications"}</p><table style="width:100%;border-collapse:collapse">${rows}</table><p style="margin-top:18px;font-size:12px;color:#8593aa">You get this because email alerts are on in Settings → Notifications.</p></div>`;
  const subject = items.length === 1 ? `Viverst: ${items[0].title}` : `Viverst: ${items.length} new notifications`;

  const r = await fetchImpl("https://api.resend.com/emails", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: cfg.from || "Viverst Admin <onboarding@resend.dev>", to: [to], subject, html }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) return { ok: false, error: `resend ${r.status}: ${(await r.text()).slice(0, 200)}` };
  await sb.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", items.map((n) => n.id));
  return { ok: true, sent: items.length, to };
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json(405, { error: "POST only" });
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) return json(401, { error: "scheduler only" });
    try {
      const admin: Db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const { data: s } = await admin.from("settings").select("value").eq("key", "shop").maybeSingle();
      const adminUrl = (s?.value as { admin_url?: string })?.admin_url || "https://admin.viverst.com";
      return json(200, await sendDigest(admin, adminUrl));
    } catch (e) { return json(500, { error: (e as Error).message }); }
  });
}
