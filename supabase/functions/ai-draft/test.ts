// deno test --allow-net --allow-env test.ts
// Exercises runDraft() with an in-memory stand-in for Supabase and fake
// provider endpoints, so the flow is proven without keys or a database.
import { runDraft } from "./index.ts";

// ---- tiny in-memory "supabase" ------------------------------------------
function fakeDb(seed: Record<string, Record<string, unknown>[]>) {
  const tables = structuredClone(seed);
  let ids = 100;
  function from(table: string) {
    const rows = () => (tables[table] ??= []);
    const q: Record<string, unknown> = {};
    const f: Array<(r: Record<string, unknown>) => boolean> = [];
    let op: "select" | "insert" | "update" = "select";
    let payload: Record<string, unknown> | null = null;
    let single = false; let limit = Infinity; let orderKey: string | null = null; let asc = true;
    const self: Record<string, unknown> = {
      select() { return self; },
      insert(row: Record<string, unknown>) { op = "insert"; payload = row; return self; },
      update(row: Record<string, unknown>) { op = "update"; payload = row; return self; },
      eq(k: string, v: unknown) { f.push((r) => r[k] === v); return self; },
      in(k: string, vs: unknown[]) { f.push((r) => vs.includes(r[k])); return self; },
      order(k: string, o?: { ascending?: boolean }) { orderKey = k; asc = o?.ascending !== false; return self; },
      limit(n: number) { limit = n; return self; },
      maybeSingle() { single = true; return self; },
      single() { single = true; return self; },
      then(res: (v: unknown) => void) {
        let out: Record<string, unknown>[];
        if (op === "insert") { const row = { id: typeof payload!.id === "string" ? payload!.id : (table === "posts" ? `uuid-${ids++}` : ids++), ...payload }; rows().push(row); out = [row]; }
        else if (op === "update") { out = rows().filter((r) => f.every((p) => p(r))); out.forEach((r) => Object.assign(r, payload)); }
        else { out = rows().filter((r) => f.every((p) => p(r))); if (orderKey) out.sort((a, b) => ((a[orderKey!] as string) > (b[orderKey!] as string) ? 1 : -1) * (asc ? 1 : -1)); out = out.slice(0, limit); }
        res({ data: single ? (out[0] ?? null) : out, error: null });
      },
    };
    Object.assign(q, self);
    return self;
  }
  return { from, rpc: async () => ({ data: true }), tables };
}

// ---- fake providers --------------------------------------------------------
const calls: string[] = [];
let groqModel = "";
globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  calls.push(new URL(url).host);
  const reply = (obj: unknown, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
  if (url.includes("tavily")) return reply({ results: [{ title: "FAO cassava report", url: "https://fao.org/x", content: "Cassava output rose 4% in 2025." }, { title: "NBS prices", url: "https://nbs.gov.ng/y", content: "Garri prices fell 12% in Q3." }] });
  if (url.includes("groq") && url.endsWith("/models")) return reply({ data: [{ id: "whisper-large-v3" }, { id: "llama-guard-4-12b" }, { id: "meta-llama/llama-4-maverick-17b-128e-instruct" }] }); // retired names gone
  if (url.includes("groq")) { groqModel = JSON.parse(String(init?.body)).model; return reply({ error: "rate limited" }, 429); }   // groq is throttled → must fall through
  if (url.includes("cerebras") && url.endsWith("/models")) return reply({ data: [{ id: "llama-3.3-70b" }, { id: "gpt-oss-120b" }] });
  if (url.includes("generativelanguage") && url.includes("/models?")) return reply({ models: [{ name: "models/gemini-3.8-flash", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-3.8-flash-lite", supportedGenerationMethods: ["generateContent"] }, { name: "models/embedding-001", supportedGenerationMethods: ["embedContent"] }] });
  if (url.includes("cerebras")) {
    const body = JSON.parse(String(init?.body));
    const isPick = body.messages[0].content.includes("pick ONE blog topic");
    const text = isPick
      ? JSON.stringify({ topic: "What falling garri prices mean for cassava farmers", arm: "agro", why: "timely" })
      : JSON.stringify({ title: "What falling garri prices mean for cassava farmers", excerpt: "Prices dropped 12% last quarter. Here is what to do about it.", body: "## The numbers\n\nGarri prices fell 12% in Q3 [2]. Output rose 4% [1].\n\n## What to do\n\nStore, grade, sell later.", tags: ["cassava", "prices", "garri"] });
    return reply({ choices: [{ message: { content: "```json\n" + text + "\n```" } }] });
  }
  return reply({ error: "unexpected host" }, 500);
}) as typeof fetch;

let pass = 0, failN = 0;
const check = (name: string, ok: boolean, info = "") => { console.log(`  ${ok ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`); ok ? pass++ : failN++; };

// ---- 1. queued topic, groq throttled, cerebras answers ----------------------
{
  const db = fakeDb({ settings: [{ key: "automation", value: { arms: ["global", "agro"], review_hours: 24 } }], ai_topics: [{ id: 1, topic: "Cassava price drop", arm: "agro", status: "queued", created_at: "2026-01-01" }], posts: [], ai_runs: [] });
  const r = await runDraft({ sb: db as never, trigger: "manual", providers: { groq: "g", cerebras: "c", tavily: "t" } });
  console.log("\n1. queued topic");
  check("returns ok", r.ok === true, JSON.stringify(r).slice(0, 90));
  check("fell through groq → cerebras", (r as { provider: string }).provider === "cerebras", calls.join(" → "));
  check("groq picked a live model from its list, not a retired name", groqModel === "meta-llama/llama-4-maverick-17b-128e-instruct", groqModel);
  const post = db.tables.posts[0] as Record<string, unknown>;
  check("post saved in review with 24h window", post?.status === "review" && new Date(post.review_until as string).getTime() - Date.now() > 23 * 3600_000);
  check("post carries arm, slug, sources", post?.arm === "agro" && post?.slug === "what-falling-garri-prices-mean-for-cassava-farmers" && (post?.sources as unknown[]).length === 2);
  check("author is ai, not held", post?.author_kind === "ai" && post?.held === false);
  check("topic marked done and linked", db.tables.ai_topics[0].status === "done" && db.tables.ai_topics[0].post_id === post.id);
  check("run logged ok", (db.tables.ai_runs[0] as Record<string, unknown>).ok === true);
}

// ---- 2. empty queue → self-finds a topic -------------------------------------
{
  calls.length = 0;
  const db = fakeDb({ settings: [{ key: "automation", value: { arms: ["agro"], self_find: true } }], ai_topics: [], posts: [{ title: "Old post", created_at: "2026-01-01" }], ai_runs: [] });
  const r = await runDraft({ sb: db as never, trigger: "schedule", providers: { cerebras: "c", tavily: "t" } });
  console.log("\n2. self-found topic");
  check("returns ok", r.ok === true);
  check("a topic was created from headlines", db.tables.ai_topics.length === 1 && db.tables.ai_topics[0].status === "done", String(db.tables.ai_topics[0]?.topic));
  check("tavily called twice (headlines, then research)", calls.filter((h) => h.includes("tavily")).length === 2);
}

// ---- 3. no keys at all ---------------------------------------------------------
{
  const db = fakeDb({ settings: [], ai_topics: [{ id: 1, topic: "x", arm: "global", status: "queued", created_at: "2026-01-01" }], posts: [], ai_runs: [] });
  const r = await runDraft({ sb: db as never, trigger: "manual", providers: {} });
  console.log("\n3. no provider keys");
  check("fails cleanly with a helpful message", r.ok === false && /No AI provider key/.test((r as { error: string }).error));
  check("run logged as failed, topic untouched", (db.tables.ai_runs[0] as Record<string, unknown>).ok === false && db.tables.ai_topics[0].status === "queued");
}

// ---- 4. slug clash gets a suffix --------------------------------------------------
{
  const db = fakeDb({ settings: [], ai_topics: [{ id: 1, topic: "Cassava price drop", arm: "agro", status: "queued", created_at: "2026-01-01" }], posts: [{ id: "old", slug: "what-falling-garri-prices-mean-for-cassava-farmers", title: "dup" }], ai_runs: [] });
  const r = await runDraft({ sb: db as never, trigger: "manual", providers: { cerebras: "c" } });
  console.log("\n4. duplicate slug");
  check("new post gets -2 suffix", r.ok && (db.tables.posts[1] as Record<string, unknown>).slug === "what-falling-garri-prices-mean-for-cassava-farmers-2");
  check("works with no tavily key (no sources)", (db.tables.posts[1] as Record<string, unknown>).sources instanceof Array && ((db.tables.posts[1] as Record<string, unknown>).sources as unknown[]).length === 0);
}

// ---- 5. gemini only: picks current flash model from the list -----------------
{
  calls.length = 0;
  let geminiModel = "";
  const prev = globalThis.fetch;
  globalThis.fetch = (async (input: Request | URL | string, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes(":generateContent")) { geminiModel = url.split("/models/")[1].split(":")[0]; return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ title: "Soil tests that pay", excerpt: "x", body: "## y", tags: ["soil"] }) }] } }] }), { headers: { "content-type": "application/json" } }); }
    return prev(input, init);
  }) as typeof fetch;
  const db = fakeDb({ settings: [], ai_topics: [{ id: 1, topic: "Soil testing", arm: "agro", status: "queued", created_at: "2026-01-01" }], posts: [], ai_runs: [] });
  const r = await runDraft({ sb: db as never, trigger: "manual", providers: { gemini: "g" } });
  console.log("\n5. gemini model discovery");
  check("drafted with gemini", r.ok && (r as { provider: string }).provider === "gemini");
  check("chose gemini-3.8-flash from the live list (not -lite, not retired 2.5)", geminiModel === "gemini-3.8-flash", geminiModel);
  globalThis.fetch = prev;
}

console.log(`\n${pass} passed, ${failN} failed`);
if (failN) Deno.exit(1);
