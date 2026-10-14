import { sendDigest, sendOrderEmails } from "./index.ts";
const mk = (rows: Record<string, unknown[]>) => ({ from(t: string) { const q: Record<string, unknown> = {}; const self = new Proxy(q, { get: (_o, k) => k === "then" ? (res: (v: unknown) => void) => res({ data: t === "settings" || t === "secrets" ? (rows[t] as Record<string, unknown>[])?.[0] ?? null : rows[t] ?? [], error: null }) : (k === "update" ? (p: unknown) => { (rows.updates ??= []).push(p); return self; } : () => self) }); return self; } });
let sent: unknown = null;
const fakeFetch = (async (_u: unknown, init?: RequestInit) => { sent = JSON.parse(String(init?.body)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
let pass = 0, fail = 0; const check = (n: string, ok: boolean, i = "") => { console.log(`  ${ok ? "✓" : "✗"} ${n}${i ? " — " + i : ""}`); ok ? pass++ : fail++; };
let r = await sendDigest(mk({ secrets: [], settings: [{ value: { email_to: "me@x.com" } }], notifications: [{ id: 1, kind: "order", title: "New order", body: "", link: "/orders", created_at: "" }] }) as never, "https://admin.test", fakeFetch);
check("no key → skipped, nothing sent", r.skipped === "no Resend key set" && !sent);
r = await sendDigest(mk({ secrets: [{ value: "re_x" }], settings: [{ value: { email_to: "me@x.com", from: "Viverst <a@viverst.com>" } }], notifications: [{ id: 1, kind: "order", title: "New order VA-1", body: "Ada", link: "/orders?open=1", created_at: "" }, { id: 2, kind: "stock_low", title: "Running low: Maize", body: "2 left", link: "/inventory", created_at: "" }] }) as never, "https://admin.test", fakeFetch);
const e = sent as { to: string[]; subject: string; html: string };
check("with key → one digest email sent", r.ok && r.sent === 2 && e.to[0] === "me@x.com", e.subject);
check("links point at the admin", e.html.includes("https://admin.test/orders?open=1"));
const orderDb = mk({ secrets: [{ value: "re_x" }], settings: [{ key: "shop", value: { name: "Viverst Agro Shop" } }, { key: "payments", value: { transfer: { bank_name: "GTBank", account_number: "0123" } } }], order_detail: [{ id: "o1", number: "VA-1060", name: "Ada Obi", email: "ada@x.com", phone: "0801", status: "awaiting_payment", payment_method: "transfer", total_kobo: 9150000, delivery_kobo: 150000, delivery_address: { line1: "12 Harvest Rd", city: "Ikeja", state: "Lagos" }, items: [{ qty: 2, name: "Yellow maize", unit: "50 kg bag", line_kobo: 9000000 }] }] });
// settings here is a list, not a single row: adapt the stub for this call
(orderDb as unknown as { from: (t: string) => unknown }).from = ((orig) => (t: string) => t === "settings" ? ({ select: () => ({ in: () => Promise.resolve({ data: [{ key: "shop", value: { name: "Viverst Agro Shop" } }, { key: "payments", value: { transfer: { bank_name: "GTBank", account_number: "0123" } } }] }) }) }) : orig(t))((orderDb as unknown as { from: (t: string) => unknown }).from);
sent = null;
const oe = await sendOrderEmails(orderDb as never, fakeFetch);
const m = sent as { to: string[]; subject: string; html: string };
check("customer confirmation sent with items, total and bank details", oe.sent === 1 && m.to[0] === "ada@x.com" && m.html.includes("Yellow maize") && m.html.includes("91,500") && m.html.includes("GTBank") && m.html.includes("VA-1060"), m.subject);
console.log(`\n${pass} passed, ${fail} failed`); if (fail) Deno.exit(1);
