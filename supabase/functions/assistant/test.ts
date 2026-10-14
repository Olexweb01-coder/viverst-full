// deno run --allow-net --allow-env test.ts
import { runAssistant, buildBrief } from "./index.ts";

const rows: Record<string, Record<string, unknown>[]> = {
  orders: [{ number: "VA-1001", name: "Ada", status: "awaiting_payment", total_kobo: 13500000, payment_method: "transfer", created_at: new Date().toISOString() }],
  inventory: [{ on_hand: 2, low_stock_at: 5, products: { name: "Yellow maize", active: true } }],
  products: [{ name: "Yellow maize", unit: "50 kg bag", price_kobo: 4500000, active: true }],
  posts: [{ title: "Cassava prices", arm: "agro", status: "review", author_kind: "ai", review_until: new Date().toISOString() }],
  events: [], settings: [{ key: "shop", value: { name: "Viverst Agro Shop" } }], ai_topics: [],
};
const sb = { from(t: string) { const q: Record<string, unknown> = {}; const self = new Proxy(q, { get: (_o, k) => k === "then" ? (res: (v: unknown) => void) => res({ data: rows[t] ?? [], error: null }) : () => self }); return self; } };

let asked = ""; let sysPrompt = "";
globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const reply = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
  if (url.endsWith("/models")) return reply({ data: [{ id: "llama-3.3-70b-versatile" }] });
  if (url.includes("tavily")) return reply({ results: [{ title: "Maize prices Oct 2026", url: "https://x.ng/maize", content: "₦48,000 per bag in Lagos" }] });
  if (url.includes("groq")) { const b = JSON.parse(String(init?.body)); asked = b.messages[1].content; sysPrompt = b.messages[0].content;
    if (asked.includes("WEB SEARCH RESULTS")) return reply({ choices: [{ message: { content: JSON.stringify({ answer: "Maize is about ₦48,000 a bag in Lagos [1].", actions: [] }) } }] });
    if (asked.includes("price of maize")) return reply({ choices: [{ message: { content: JSON.stringify({ search: "maize price Lagos October 2026" }) } }] });
    return reply({ choices: [{ message: { content: JSON.stringify({ answer: "One order, VA-1001 from Ada, is awaiting payment (₦135,000). Yellow maize is low: 2 bags.", actions: [{ type: "open", path: "/orders?status=awaiting_payment", label: "Awaiting payment" }, { type: "queue_topic", topic: "Why maize prices rise before the rains", arm: "agro" }] }) } }] }); }
  return reply({ error: "unexpected" }, 500);
}) as typeof fetch;

let pass = 0, fail = 0; const check = (n: string, ok: boolean, i = "") => { console.log(`  ${ok ? "✓" : "✗"} ${n}${i ? " — " + i : ""}`); ok ? pass++ : fail++; };

const brief = await buildBrief(sb as never);
check("brief includes orders, stock, posts", brief.includes("VA-1001") && brief.includes("Yellow maize: 2 on hand") && brief.includes('"Cassava prices" [agro] — review'));
const r = await runAssistant(sb as never, [{ role: "user", content: "What needs my attention?" }], { groq: "g" });
check("answers ok via groq", r.ok === true && (r as { provider: string }).provider === "groq");
check("brief and question were sent to the model", asked.includes("BUSINESS BRIEF") && asked.includes("What needs my attention?"));
check("answer text returned", (r as { answer: string }).answer.includes("VA-1001"));
check("two actions returned, both valid", (r as { actions: unknown[] }).actions.length === 2);
check("system prompt carries the company profile", sysPrompt.includes("VIVERST GLOBAL LIMITED") && sysPrompt.includes("Grow more, waste less"));
const r3 = await runAssistant(sb as never, [{ role: "user", content: "What is the price of maize now? search for it" }], { groq: "g", tavily: "t" });
check("search round-trip: model asked to search, got results, answered with citation", r3.ok && (r3 as { answer: string }).answer.includes("[1]") && (r3 as { sources: unknown[] }).sources.length === 1, JSON.stringify(r3).slice(0, 100));
const r2 = await runAssistant(sb as never, [{ role: "user", content: "hi" }], {});
check("no keys → clear message", r2.ok === false && /No AI provider key/.test((r2 as { error: string }).error));
console.log(`\n${pass} passed, ${fail} failed`); if (fail) Deno.exit(1);
