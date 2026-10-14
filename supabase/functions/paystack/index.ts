// VIVERST · paystack
// One function, three jobs, chosen by the URL path:
//   POST /paystack/init      { order_id }  → creates a Paystack transaction for an
//                            order awaiting payment; returns the page to send the
//                            customer to. Called by the shop after place_order.
//   POST /paystack/webhook   Paystack calls this when a payment succeeds. The
//                            HMAC signature is verified with the secret key
//                            before anything is trusted; then the order is paid.
//   POST /paystack/verify    { reference } → asks Paystack directly (used by the
//                            confirmation page in case the webhook is slow).
// The secret key is read from the locked secrets table; nothing in the browser
// can create a paid order.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { CORS, json } from "../_shared/ai.ts";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;

async function secretKey(sb: Db): Promise<string | null> {
  const { data } = await sb.from("secrets").select("value").eq("key", "paystack_secret_key").maybeSingle();
  return data?.value || null;
}

async function hmacHex(key: string, body: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Mark an order paid once, idempotently. Returns what changed. */
export async function markPaid(sb: Db, reference: string, amountKobo: number, channel: string) {
  const { data: order } = await sb.from("orders").select("id, number, status, total_kobo, payment_method").eq("payment_ref", reference).maybeSingle();
  if (!order) return { ok: false, reason: "no order with that reference" };
  if (order.status !== "awaiting_payment") return { ok: true, already: order.status };
  if (Number(amountKobo) < Number(order.total_kobo)) return { ok: false, reason: `paid ${amountKobo} kobo, order is ${order.total_kobo}` };
  const { error } = await sb.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), staff_note: `Paystack ${channel}` }).eq("id", order.id).eq("status", "awaiting_payment");
  if (error) return { ok: false, reason: error.message };
  return { ok: true, paid: order.number };
}

export async function initTransaction(sb: Db, key: string, orderId: string, callbackUrl: string, fetchImpl: typeof fetch = fetch) {
  const { data: o } = await sb.from("orders").select("id, number, email, total_kobo, status, payment_method").eq("id", orderId).maybeSingle();
  if (!o) return { ok: false, error: "order not found" };
  if (o.status !== "awaiting_payment") return { ok: false, error: `order is ${o.status}` };
  if (o.payment_method !== "paystack") return { ok: false, error: "order was not placed for card payment" };
  const reference = `${o.number}-${Date.now().toString(36)}`;
  const r = await fetchImpl("https://api.paystack.co/transaction/initialize", {
    method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ email: o.email, amount: Number(o.total_kobo), reference, currency: "NGN", callback_url: `${callbackUrl}?ref=${encodeURIComponent(reference)}`, metadata: { order_number: o.number, order_id: o.id } }),
    signal: AbortSignal.timeout(20_000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.status) return { ok: false, error: d.message || `paystack ${r.status}` };
  await sb.from("orders").update({ payment_ref: reference }).eq("id", o.id);
  return { ok: true, url: d.data.authorization_url, reference };
}

export async function verifyTransaction(sb: Db, key: string, reference: string, fetchImpl: typeof fetch = fetch) {
  const r = await fetchImpl(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20_000) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.status) return { ok: false, error: d.message || `paystack ${r.status}` };
  if (d.data.status !== "success") return { ok: true, paid: false, status: d.data.status };
  const m = await markPaid(sb, reference, d.data.amount, d.data.channel || "card");
  return { ok: m.ok, paid: m.ok, detail: m };
}

export async function handleWebhook(sb: Db, key: string, rawBody: string, signature: string | null) {
  if (!signature || (await hmacHex(key, rawBody)) !== signature) return { status: 401, body: { error: "bad signature" } };
  const ev = JSON.parse(rawBody);
  if (ev.event !== "charge.success") return { status: 200, body: { ok: true, ignored: ev.event } };
  const m = await markPaid(sb, ev.data.reference, ev.data.amount, ev.data.channel || "card");
  return { status: 200, body: m };
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json(405, { error: "POST only" });
    const path = new URL(req.url).pathname.split("/").filter(Boolean).pop();
    try {
      const sb: Db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const key = await secretKey(sb);
      if (!key) return json(503, { error: "Card payments are not enabled." });
      if (path === "webhook") {
        const raw = await req.text();
        const r = await handleWebhook(sb, key, raw, req.headers.get("x-paystack-signature"));
        return json(r.status, r.body);
      }
      const body = await req.json().catch(() => ({}));
      if (path === "init") {
        const { data: s } = await sb.from("settings").select("value").eq("key", "shop").maybeSingle();
        const shopUrl = (s?.value as { url?: string })?.url || "https://shopagro.viverst.com";
        const { data: o } = await sb.from("orders").select("number").eq("id", String(body.order_id || "")).maybeSingle();
        return json(200, await initTransaction(sb, key, String(body.order_id || ""), `${shopUrl}/order/${o?.number ?? ""}`));
      }
      if (path === "verify") return json(200, await verifyTransaction(sb, key, String(body.reference || "")));
      return json(404, { error: "unknown path" });
    } catch (e) { return json(500, { error: (e as Error).message }); }
  });
}
