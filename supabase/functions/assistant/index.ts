// VIVERST · assistant
// The admin's chat helper. Each call gets a fresh brief of the business from
// the database (orders, stock, posts, events, settings) plus the conversation
// so far, and answers through the fastest free provider. It can also propose
// actions the admin then carries out: queue a blog topic, draft a customer
// reply. Staff only; keys never leave the server.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { CORS, json, makeAsk, parseJson, loadKeys, requireStaff, tavily, type Source } from "../_shared/ai.ts";
import { COMPANY_PROFILE } from "../_shared/company.ts";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;
type Msg = { role: "user" | "assistant"; content: string };
type Reply = { answer: string; search?: string; actions?: Array<{ type: "queue_topic"; topic: string; arm: "global" | "agro" | "studio" } | { type: "open"; path: string; label: string }> };

const money = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

/** Compact, current picture of the business for the model to reason over. */
export async function buildBrief(sb: Db, contentOnly = false): Promise<string> {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [orders, today, low, products, posts, events, settings, topics] = await Promise.all([
    sb.from("orders").select("number, name, status, total_kobo, payment_method, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(40),
    sb.from("orders").select("total_kobo, status").gte("created_at", todayStart.toISOString()),
    sb.from("inventory").select("on_hand, low_stock_at, products!inner(name, active)").eq("products.active", true),
    sb.from("products").select("name, unit, price_kobo, active").order("sort").limit(60),
    sb.from("posts").select("title, arm, status, author_kind, review_until, published_at").order("updated_at", { ascending: false }).limit(20),
    sb.from("events").select("title, site, status, starts_at, location").gte("starts_at", new Date(Date.now() - 30 * 86400_000).toISOString()).order("starts_at").limit(15),
    sb.from("settings").select("key, value").in("key", ["shop", "delivery", "contact", "automation"]),
    sb.from("ai_topics").select("topic, arm, status").eq("status", "queued").limit(20),
  ]);
  const s = Object.fromEntries((settings.data ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value]));
  // deno-lint-ignore no-explicit-any
  const lowRows: any[] = (low.data ?? []).filter((r: { on_hand: number; low_stock_at: number }) => r.on_hand <= r.low_stock_at);
  const todayOk = (today.data ?? []).filter((o: { status: string }) => !["cancelled", "refunded"].includes(o.status));
  if (contentOnly) {
    return [
      `Date/time (Lagos): ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
      `(This person is a writer: shop and order data are not shown to them.)`,
      `Blog, recent (${(posts.data ?? []).length}):`,
      ...(posts.data ?? []).map((p: { title: string; arm: string; status: string; author_kind: string; review_until?: string }) => `  "${p.title}" [${p.arm}] — ${p.status}${p.status === "review" && p.review_until ? ` (auto-publishes ${p.review_until.slice(0, 16)})` : ""} — by ${p.author_kind}`),
      `Queued blog topics (${(topics.data ?? []).length}): ${(topics.data ?? []).map((t: { topic: string; arm: string }) => `"${t.topic}" [${t.arm}]`).join("; ") || "none"}`,
      `Automation: ${JSON.stringify(s.automation ?? {})}`,
    ].join("\n");
  }
  const lines = [
    `Date/time (Lagos): ${new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}`,
    `Shop: ${(s.shop as { name?: string })?.name ?? "Viverst Agro Shop"}. Delivery fee: ${money((s.delivery as { flat_fee_kobo?: number })?.flat_fee_kobo ?? 0)}. Contact: ${JSON.stringify(s.contact ?? {})}.`,
    `Today: ${todayOk.length} orders, ${money(todayOk.reduce((a: number, o: { total_kobo: number }) => a + Number(o.total_kobo), 0))} taken.`,
    `Orders in the last 7 days (${(orders.data ?? []).length}):`,
    ...(orders.data ?? []).map((o: { number: string; name: string; status: string; total_kobo: number; payment_method: string; created_at: string }) => `  ${o.number} ${o.name} — ${o.status} — ${money(o.total_kobo)} — ${o.payment_method} — ${o.created_at.slice(0, 16)}`),
    `Low or out of stock (${lowRows.length}):`,
    ...lowRows.map((r: { on_hand: number; low_stock_at: number; products: { name: string } }) => `  ${r.products.name}: ${r.on_hand} on hand (alert at ${r.low_stock_at})`),
    `Products (${(products.data ?? []).length}):`,
    ...(products.data ?? []).map((p: { name: string; unit: string; price_kobo: number; active: boolean }) => `  ${p.name} — ${p.unit} — ${money(p.price_kobo)}${p.active ? "" : " (hidden)"}`),
    `Blog, recent (${(posts.data ?? []).length}):`,
    ...(posts.data ?? []).map((p: { title: string; arm: string; status: string; author_kind: string; review_until?: string }) => `  "${p.title}" [${p.arm}] — ${p.status}${p.status === "review" && p.review_until ? ` (auto-publishes ${p.review_until.slice(0, 16)})` : ""} — by ${p.author_kind}`),
    `Queued blog topics (${(topics.data ?? []).length}): ${(topics.data ?? []).map((t: { topic: string; arm: string }) => `"${t.topic}" [${t.arm}]`).join("; ") || "none"}`,
    `Automation: ${JSON.stringify(s.automation ?? {})}`,
    `Events (${(events.data ?? []).length}):`,
    ...(events.data ?? []).map((e: { title: string; site: string; status: string; starts_at: string; location: string }) => `  "${e.title}" [${e.site}] — ${e.status} — ${e.starts_at.slice(0, 16)} — ${e.location}`),
  ];
  return lines.join("\n");
}

const SYSTEM = `You are the assistant inside the Viverst admin, used by the owner and staff. You know the company well (profile below), you have a live brief of the business (numbers below), and you may use general knowledge. If something is neither in the profile, the brief nor general knowledge, you can ask for a web search: reply with {"search":"<query>"} and nothing else, and you will be called again with results. Search when the person asks you to, or when the question needs current outside facts (prices, news, regulations, competitors). Never claim to have searched when you did not.

Style: concise, warm, specific, plain. Nigerian/British English. Use naira. Markdown allowed (short paragraphs, bullets, **bold**). No emojis. Don't mention "the brief" — just answer.

You can propose actions, only when clearly asked:
- queue_topic: when asked to write/draft/queue a blog post → {"type":"queue_topic","topic":"<clear topic sentence>","arm":"global|agro|studio"}
- open: to point at a screen → {"type":"open","path":"/orders?open=<id>" | "/posts" | "/inventory" | "/events" | "/automation" | "/settings","label":"short label"}

Reply ONLY as JSON: {"answer":"<markdown>","actions":[...]} or {"search":"<query>"}. No fences, no commentary.

COMPANY PROFILE
${COMPANY_PROFILE}`;

export async function runAssistant(sb: Db, messages: Msg[], keys?: Awaited<ReturnType<typeof loadKeys>>, contentOnly = false) {
  const k = keys ?? await loadKeys(sb);
  const ask = makeAsk(k);
  if (!ask) return { ok: false, error: "No AI provider key is set. Add one on Automation → AI keys." };
  const brief = await buildBrief(sb, contentOnly);
  const history = messages.slice(-14).map((m) => `${m.role === "user" ? "Person" : "Assistant"}: ${m.content}`).join("\n\n");
  let extra = "";
  let searched: Source[] | null = null;
  let provider = "";
  for (let round = 0; round < 2; round++) {
    const user = `LIVE BUSINESS BRIEF\n${brief}\n${extra}\nCONVERSATION\n${history}\n\nAssistant:`;
    const out = await ask(SYSTEM, user);
    provider = out.provider;
    let reply: Reply;
    try { reply = parseJson<Reply>(out.text); } catch { reply = { answer: out.text, actions: [] }; }
    if (reply.search && round === 0) {
      if (!k.tavily) { extra = `\nWEB SEARCH: not available (no Tavily key). Answer from what you know and say you could not search.\n`; continue; }
      try { searched = await tavily(k.tavily, reply.search); } catch (e) { searched = []; extra = `\nWEB SEARCH for "${reply.search}" failed: ${(e as Error).message}\n`; continue; }
      extra = `\nWEB SEARCH RESULTS for "${reply.search}" (cite as [n]):\n` + (searched.length ? searched.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n") : "(nothing found)") + "\n";
      continue;
    }
    if (!reply.answer) reply.answer = out.text;
    const actions = (reply.actions ?? []).filter((a) => a && (a.type === "queue_topic" ? !!a.topic : a.type === "open" ? !!a.path : false)).slice(0, 3);
    return { ok: true, provider, answer: reply.answer, actions, sources: searched ? searched.map(({ title, url }) => ({ title, url })) : [] };
  }
  return { ok: false, error: "The assistant could not settle on an answer. Try rephrasing." };
}

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json(405, { error: "POST only" });
    let stage = "setup";
    try {
      const url = Deno.env.get("SUPABASE_URL")!;
      const admin: Db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      stage = "sign-in check";
      const who = await requireStaff(req, url, admin);
      if (!who.ok) return who.res;
      stage = "reading request";
      const body = await req.json().catch(() => ({}));
      const messages: Msg[] = Array.isArray(body.messages) ? body.messages.filter((m: Msg) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string") : [];
      if (!messages.length) return json(400, { error: "no messages" });
      stage = "answering";
      const result = await runAssistant(admin, messages, undefined, who.role === "writer");
      return json(result.ok ? 200 : 422, result);
    } catch (e) {
      return json(500, { error: `${stage}: ${(e as Error).message}` });
    }
  });
}
