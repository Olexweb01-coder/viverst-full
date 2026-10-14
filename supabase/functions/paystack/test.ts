import { initTransaction, verifyTransaction, handleWebhook, markPaid } from "./index.ts";
const orders: Record<string, unknown>[] = [{ id: "o1", number: "VA-1050", email: "ada@x.com", total_kobo: 9150000, status: "awaiting_payment", payment_method: "paystack", payment_ref: null }];
const updates: unknown[] = [];
const sb = { from(t: string) { const f: [string, unknown][] = []; let patch: unknown = null; const self = new Proxy({}, { get: (_o, k) => k === "then" ? (res: (v: unknown) => void) => { let rows = t === "orders" ? orders : []; rows = rows.filter((r) => f.every(([c, v]) => (r as Record<string, unknown>)[c] === v)); if (patch) { rows.forEach((r) => Object.assign(r, patch as object)); updates.push(patch); } res({ data: rows[0] ?? null, error: null }); } : k === "update" ? (p: unknown) => { patch = p; return self; } : k === "eq" ? (c: string, v: unknown) => { f.push([c, v]); return self; } : () => self }); return self; } };
let pass = 0, fail = 0; const check = (n: string, ok: boolean, i = "") => { console.log(`  ${ok ? "✓" : "✗"} ${n}${i ? " — " + i : ""}`); ok ? pass++ : fail++; };
const fakeFetch = (async (url: string, init?: RequestInit) => {
  if (String(url).endsWith("/initialize")) { const b = JSON.parse(String(init?.body)); return new Response(JSON.stringify({ status: true, data: { authorization_url: "https://checkout.paystack.com/abc", reference: b.reference } })); }
  if (String(url).includes("/verify/")) return new Response(JSON.stringify({ status: true, data: { status: "success", amount: 9150000, channel: "card" } }));
  return new Response("{}", { status: 500 });
}) as unknown as typeof fetch;

console.log("init");
const i = await initTransaction(sb as never, "sk_test_x", "o1", "https://shop/order/VA-1050", fakeFetch);
check("returns Paystack page and stores reference on the order", i.ok && (i as { url: string }).url.startsWith("https://checkout.paystack.com") && (orders[0] as { payment_ref: string }).payment_ref.startsWith("VA-1050-"));
const ref = (orders[0] as { payment_ref: string }).payment_ref;
console.log("webhook");
const raw = JSON.stringify({ event: "charge.success", data: { reference: ref, amount: 9150000, channel: "card" } });
const bad = await handleWebhook(sb as never, "sk_test_x", raw, "deadbeef");
check("wrong signature rejected, order untouched", bad.status === 401 && orders[0].status === "awaiting_payment");
const k = await crypto.subtle.importKey("raw", new TextEncoder().encode("sk_test_x"), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
const sig = [...new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(raw)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const good = await handleWebhook(sb as never, "sk_test_x", raw, sig);
check("good signature marks the order paid", good.status === 200 && orders[0].status === "paid" && (orders[0] as { paid_at: string }).paid_at !== undefined, JSON.stringify(good.body));
const again = await handleWebhook(sb as never, "sk_test_x", raw, sig);
check("second delivery is idempotent", (again.body as { already?: string }).already === "paid");
console.log("underpayment");
orders.push({ id: "o2", number: "VA-1051", email: "b@x.com", total_kobo: 500000, status: "awaiting_payment", payment_method: "paystack", payment_ref: "VA-1051-z" });
const under = await markPaid(sb as never, "VA-1051-z", 100000, "card");
check("paying less than the total does not mark paid", under.ok === false && orders[1].status === "awaiting_payment", (under as { reason: string }).reason);
console.log("verify");
orders[1].status = "awaiting_payment"; (orders[1] as { total_kobo: number }).total_kobo = 9150000;
const v = await verifyTransaction(sb as never, "sk_test_x", "VA-1051-z", fakeFetch);
check("verify path marks paid when Paystack says success", v.ok && (v as { paid: boolean }).paid === true && orders[1].status === "paid");
console.log(`\n${pass} passed, ${fail} failed`); if (fail) Deno.exit(1);
