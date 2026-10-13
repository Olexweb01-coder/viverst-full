// VIVERST · ai-draft
// Picks the next queued topic (or finds one), researches it with Tavily,
// drafts a post with the fastest free model that answers, and saves it to
// public.posts in review with a 24-hour window. Provider keys are read from
// public.secrets with the service role; nothing is ever sent to a browser.
//
// Called by:  the hourly scheduler (checks ai_post_due() first), or the admin's
//             "Draft one now" button (POST with a staff JWT).
// Env:        SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are injected by Supabase.
//             CRON_SECRET (optional) lets the scheduler call without a JWT.

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;

type Arm = "global" | "agro" | "studio";
type Topic = { id: number; topic: string; arm: Arm };
type Source = { title: string; url: string; snippet: string };
type Draft = { title: string; excerpt: string; body: string; tags: string[]; arm: Arm };

const ARM_BRIEF: Record<Arm, string> = {
  global: "Viverst Global Limited, a Nigerian holding group with arms in agriculture (Viverst Agro) and creative/brand work (Viverst Studio). Audience: business owners, partners, investors in Nigeria and the diaspora.",
  agro: "Viverst Agro, which helps Nigerian farms and agribusinesses across the whole value chain: farming inputs, tools, processing, packaging and getting produce to market. Audience: farmers, processors, buyers, agri-investors.",
  studio: "Viverst Studio, a Nigerian brand and digital studio doing identity, websites and campaigns. Audience: founders and marketing leads of growing Nigerian businesses.",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// ---------------------------------------------------------------- providers
// Each returns the model's text or throws. Order = fastest first. A provider
// that fails is skipped; the next one is tried within the same request.

async function groq(key: string, system: string, user: string): Promise<string> {
  return openaiCompatible("https://api.groq.com/openai/v1/chat/completions", key, "llama-3.3-70b-versatile", system, user);
}
async function cerebras(key: string, system: string, user: string): Promise<string> {
  return openaiCompatible("https://api.cerebras.ai/v1/chat/completions", key, "llama-3.3-70b", system, user);
}
async function openaiCompatible(url: string, key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, temperature: 0.6, max_tokens: 2200, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!r.ok) throw new Error(`${new URL(url).host} ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const text = d?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`${new URL(url).host}: empty reply`);
  return text;
}
async function gemini(key: string, system: string, user: string): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 2200 } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const text = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("gemini: empty reply");
  return text;
}

async function tavily(key: string, query: string): Promise<Source[]> {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, search_depth: "basic", max_results: 6, include_answer: false, days: 90 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`tavily ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  return (d?.results ?? []).map((x: { title?: string; url: string; content?: string }) => ({ title: x.title ?? x.url, url: x.url, snippet: (x.content ?? "").slice(0, 600) }));
}

// ---------------------------------------------------------------- prompts

function draftPrompt(topic: string, arm: Arm, sources: Source[]) {
  const system = `You write blog posts for ${ARM_BRIEF[arm]}
Voice: plain, warm, specific, practical. British/Nigerian English. No hype, no "in today's fast-paced world", no "unlock", no emojis. Short paragraphs. Use concrete numbers and names only when the sources support them; never invent statistics. Where a source is used, cite it inline as [n] matching the numbered list given. Length: 600-900 words.
Return ONLY a JSON object with keys: title (string, under 70 chars), excerpt (string, 1-2 sentences, under 220 chars), body (string, Markdown with ## subheadings), tags (array of 3-5 short lowercase strings). No markdown fences, no commentary.`;
  const list = sources.length
    ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.snippet}`).join("\n\n")
    : "(no sources found; write from general knowledge and keep claims modest)";
  const user = `Topic: ${topic}\n\nSources:\n${list}`;
  return { system, user };
}

function findTopicPrompt(arms: Arm[], sources: Source[], recent: string[]) {
  const system = `You pick ONE blog topic for a Nigerian company group. Choose something timely, useful to the audience, and not already covered. Return ONLY JSON: {"topic": string, "arm": "global"|"agro"|"studio", "why": string}. Allowed arms: ${arms.join(", ")}.`;
  const user = `Recent headlines:\n${sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.snippet.slice(0, 160)}`).join("\n")}\n\nAlready covered recently (avoid):\n${recent.map((t) => `- ${t}`).join("\n") || "- (none)"}`;
  return { system, user };
}

function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// ---------------------------------------------------------------- main

export async function runDraft(opts: {
  sb: Db;
  trigger: "schedule" | "manual";
  topicId?: number;
  providers?: { groq?: string; cerebras?: string; gemini?: string; tavily?: string };
  fetchImpl?: typeof fetch; // tests inject a fake
}) {
  const { sb, trigger } = opts;
  const t0 = new Date().toISOString();

  // settings + keys
  const { data: settingRow } = await sb.from("settings").select("value").eq("key", "automation").maybeSingle();
  const settings = (settingRow?.value ?? {}) as { arms?: Arm[]; review_hours?: number; self_find?: boolean };
  const arms: Arm[] = settings.arms?.length ? settings.arms : ["global", "agro", "studio"];
  const reviewHours = settings.review_hours ?? 24;

  let keys = opts.providers;
  if (!keys) {
    const { data: secrets } = await sb.from("secrets").select("key, value").in("key", ["groq_api_key", "cerebras_api_key", "gemini_api_key", "tavily_api_key"]);
    const map = Object.fromEntries((secrets ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
    keys = { groq: map.groq_api_key, cerebras: map.cerebras_api_key, gemini: map.gemini_api_key, tavily: map.tavily_api_key };
  }
  const models: Array<[string, (s: string, u: string) => Promise<string>]> = [];
  if (keys.groq) models.push(["groq", (s, u) => groq(keys.groq!, s, u)]);
  if (keys.cerebras) models.push(["cerebras", (s, u) => cerebras(keys.cerebras!, s, u)]);
  if (keys.gemini) models.push(["gemini", (s, u) => gemini(keys.gemini!, s, u)]);
  if (!models.length) return fail(sb, t0, trigger, null, "No AI provider key is set. Add at least one on the Automation screen.");

  const ask = async (system: string, user: string) => {
    const errors: string[] = [];
    for (const [name, fn] of models) {
      try { return { provider: name, text: await fn(system, user) }; } catch (e) { errors.push(`${name}: ${(e as Error).message}`); }
    }
    throw new Error(`All providers failed — ${errors.join(" | ")}`);
  };

  // pick a topic: requested id > oldest queued > self-found
  let topic: Topic | null = null;
  if (opts.topicId) {
    const { data } = await sb.from("ai_topics").select("id, topic, arm").eq("id", opts.topicId).maybeSingle();
    topic = (data ?? null) as Topic | null;
  }
  if (!topic) {
    const { data } = await sb.from("ai_topics").select("id, topic, arm").eq("status", "queued").order("created_at").limit(1).maybeSingle();
    topic = (data ?? null) as Topic | null;
  }
  let provider = "";
  if (!topic) {
    if (settings.self_find === false) return fail(sb, t0, trigger, null, "Topic queue is empty and self-finding is off.");
    if (!keys.tavily) return fail(sb, t0, trigger, null, "Topic queue is empty and no Tavily key is set, so it cannot find its own.");
    const { data: recent } = await sb.from("posts").select("title").order("created_at", { ascending: false }).limit(15);
    const headlines = await tavily(keys.tavily, `Nigeria agriculture agribusiness business news this week`);
    const p = findTopicPrompt(arms, headlines, (recent ?? []).map((r: { title: string }) => r.title));
    const found = await ask(p.system, p.user);
    provider = found.provider;
    const pick = parseJson<{ topic: string; arm: Arm }>(found.text);
    const arm: Arm = arms.includes(pick.arm) ? pick.arm : arms[0];
    const { data: ins } = await sb.from("ai_topics").insert({ topic: pick.topic, arm, status: "queued" }).select("id, topic, arm").single();
    topic = ins as Topic;
  }

  await sb.from("ai_topics").update({ status: "drafting" }).eq("id", topic.id);
  try {
    const sources = keys.tavily ? await tavily(keys.tavily, topic.topic).catch(() => [] as Source[]) : [];
    const p = draftPrompt(topic.topic, topic.arm, sources);
    const out = await ask(p.system, p.user);
    provider = out.provider;
    const d = parseJson<Draft>(out.text);
    if (!d.title || !d.body) throw new Error("model returned no title/body");
    const base = slugify(d.title) || `post-${Date.now()}`;
    let slug = base;
    for (let i = 2; i < 20; i++) {
      const { data: clash } = await sb.from("posts").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }
    const { data: post, error } = await sb.from("posts").insert({
      slug, title: d.title.slice(0, 140), excerpt: (d.excerpt ?? "").slice(0, 300), body: d.body, arm: topic.arm,
      tags: Array.isArray(d.tags) ? d.tags.slice(0, 6).map(String) : [],
      status: "review", author_kind: "ai", sources: sources.map(({ title, url }) => ({ title, url })),
      review_until: new Date(Date.now() + reviewHours * 3600_000).toISOString(), held: false,
    }).select("id, slug, title").single();
    if (error) throw new Error(error.message);
    await sb.from("ai_topics").update({ status: "done", post_id: post.id, used_at: new Date().toISOString() }).eq("id", topic.id);
    await sb.from("ai_runs").insert({ started_at: t0, finished_at: new Date().toISOString(), trigger, topic_id: topic.id, post_id: post.id, provider, ok: true, detail: `${sources.length} source(s)` });
    return { ok: true, post, provider, sources: sources.length };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("ai_topics").update({ status: "failed", error: msg }).eq("id", topic.id);
    return fail(sb, t0, trigger, topic.id, msg);
  }
}

async function fail(sb: Db, t0: string, trigger: string, topicId: number | null, detail: string) {
  await sb.from("ai_runs").insert({ started_at: t0, finished_at: new Date().toISOString(), trigger, topic_id: topicId, ok: false, detail });
  return { ok: false, error: detail };
}

// ---------------------------------------------------------------- HTTP entry

if (import.meta.main) {
  Deno.serve(async (req) => {
    if (req.method !== "POST") return json(405, { error: "POST only" });
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin: Db = createClient(url, serviceKey);

    // who is calling? the scheduler (shared secret) or a staff member (JWT)
    const body = await req.json().catch(() => ({}));
    const cronSecret = Deno.env.get("CRON_SECRET");
    const auth = req.headers.get("authorization") ?? "";
    let trigger: "schedule" | "manual" = "manual";
    if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
      trigger = "schedule";
      const { data: due } = await admin.rpc("ai_post_due");
      if (!due && !body.force) return json(200, { ok: true, skipped: "not due" });
    } else {
      const jwt = auth.replace(/^Bearer\s+/i, "");
      const { data: userData } = await createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { authorization: `Bearer ${jwt}` } } }).auth.getUser(jwt);
      if (!userData?.user) return json(401, { error: "sign in first" });
      const { data: staff } = await admin.from("staff").select("role, active").eq("user_id", userData.user.id).maybeSingle();
      if (!staff?.active) return json(403, { error: "staff only" });
    }
    const result = await runDraft({ sb: admin, trigger, topicId: body.topic_id ? Number(body.topic_id) : undefined });
    return json(result.ok ? 200 : 422, result);
  });
}
