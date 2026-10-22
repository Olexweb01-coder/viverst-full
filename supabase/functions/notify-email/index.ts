// VIVERST · notify-email
// Called by the scheduler every 10 minutes. Emails unsent notifications as one
// digest to the address in Settings → Notifications, via Resend, when a
// resend_api_key secret exists. With no key it does nothing and reports why.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { CORS, json } from "../_shared/ai.ts";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;
type N = { id: number; kind: string; title: string; body: string; link: string | null; created_at: string };

const money = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Confirmation emails to customers for orders not yet emailed. */
export async function sendOrderEmails(sb: Db, fetchImpl: typeof fetch = fetch) {
  const [{ data: secret }, { data: settings }] = await Promise.all([
    sb.from("secrets").select("value").eq("key", "resend_api_key").maybeSingle(),
    sb.from("settings").select("key, value").in("key", ["shop", "payments", "contact", "notifications"]),
  ]);
  const key = secret?.value; if (!key) return { skipped: "no Resend key set" };
  const s = Object.fromEntries((settings ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value])) as Record<string, Record<string, unknown>>;
  const from = (s.notifications?.from as string) || "Viverst Agro <onboarding@resend.dev>";
  const shopName = (s.shop?.name as string) || "Viverst Agro Shop";
  const bank = (s.payments?.transfer as Record<string, string>) || {};
  const { data: pending } = await sb.from("order_detail").select("*").is("customer_emailed_at", null).neq("status", "cancelled").order("created_at").limit(20);
  let sent = 0;
  for (const o of (pending ?? []) as Array<Record<string, unknown>>) {
    const items = (o.items as Array<Record<string, unknown>>).map((i) => `<tr><td style="padding:6px 0">${esc(i.qty)} × ${esc(i.name)} <span style="color:#6b8372">(${esc(i.unit)})</span></td><td style="padding:6px 0;text-align:right">${money(i.line_kobo as number)}</td></tr>`).join("");
    const transfer = o.payment_method === "transfer" ? `<div style="background:#f3efe2;padding:16px;border-radius:12px;margin:16px 0"><strong>How to pay by bank transfer</strong><p style="margin:8px 0">${esc(bank.instructions || "Pay the total to the account below and use your order number as the reference.")}</p><p style="margin:4px 0">Amount: <strong>${money(o.total_kobo as number)}</strong><br>${bank.bank_name ? `Bank: ${esc(bank.bank_name)}<br>` : ""}${bank.account_name ? `Account name: ${esc(bank.account_name)}<br>` : ""}${bank.account_number ? `Account number: <strong>${esc(bank.account_number)}</strong><br>` : ""}Reference: <strong>${esc(o.number)}</strong></p></div>` : o.status === "paid" ? `<p>Your card payment went through. Thank you.</p>` : `<p>We'll confirm your payment shortly.</p>`;
    const a = (o.delivery_address as Record<string, string>) || {};
    const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#18542a"><h2 style="margin:0 0 4px">Thanks, ${esc((o.name as string).split(" ")[0])}. Order ${esc(o.number)} is in.</h2><p style="color:#3a5a44;margin:0 0 16px">We'll call ${esc(o.phone)} before delivery.</p><table style="width:100%;border-collapse:collapse">${items}<tr><td style="padding:8px 0;border-top:1px solid #ddd">Delivery</td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right">${money(o.delivery_kobo as number)}</td></tr>${Number(o.fee_kobo) > 0 ? `<tr><td style="padding:8px 0;border-top:1px solid #ddd">Paystack charges</td><td style="padding:8px 0;border-top:1px solid #ddd;text-align:right">${money(o.fee_kobo as number)}</td></tr>` : ""}<tr><td style="padding:8px 0"><strong>Total</strong></td><td style="padding:8px 0;text-align:right"><strong>${money(o.total_kobo as number)}</strong></td></tr></table>${transfer}<p style="color:#3a5a44"><strong>Deliver to</strong><br>${esc(a.line1)}${a.line2 ? `, ${esc(a.line2)}` : ""}<br>${esc(a.city)}, ${esc(a.state)}</p><p style="color:#3a5a44">Questions about your order? Just reply to this email.</p><p style="font-size:12px;color:#6b8372">${esc(shopName)} · ${esc((s.contact?.email as string) || "agro@viverst.com")}</p></div>`;
    // sent from the noreply address, but a customer who hits reply reaches the Contact email
    const replyTo = (s.contact?.email as string) || undefined;
    const r = await fetchImpl("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ from, to: [o.email], subject: `${shopName}: order ${o.number} received`, html, ...(replyTo ? { reply_to: replyTo } : {}) }), signal: AbortSignal.timeout(20_000) });
    if (!r.ok) return { sent, error: `resend ${r.status}: ${(await r.text()).slice(0, 160)}` };
    await sb.from("orders").update({ customer_emailed_at: new Date().toISOString() }).eq("id", o.id);
    sent++;
  }
  return { sent };
}

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
      const [digest, orders] = await Promise.all([sendDigest(admin, adminUrl), sendOrderEmails(admin)]);
      return json(200, { digest, orders });
    } catch (e) { return json(500, { error: (e as Error).message }); }
  });
}
