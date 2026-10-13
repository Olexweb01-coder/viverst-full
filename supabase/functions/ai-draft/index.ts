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
import { CORS, json, makeAsk, parseJson, tavily, loadKeys, requireStaff, type Source } from "../_shared/ai.ts";

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, "public", any>;

type Arm = "global" | "agro" | "studio";
type Topic = { id: number; topic: string; arm: Arm };
type Draft = { title: string; excerpt: string; body: string; tags: string[]; arm: Arm };

const ARM_BRIEF: Record<Arm, string> = {
  global: "Viverst Global Limited, a Nigerian holding group with arms in agriculture (Viverst Agro) and creative/brand work (Viverst Studio). Audience: business owners, partners, investors in Nigeria and the diaspora.",
  agro: "Viverst Agro, which helps Nigerian farms and agribusinesses across the whole value chain: farming inputs, tools, processing, packaging and getting produce to market. Audience: farmers, processors, buyers, agri-investors.",
  studio: "Viverst Studio, a Nigerian brand and digital studio doing identity, websites and campaigns. Audience: founders and marketing leads of growing Nigerian businesses.",
};

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

  const keys = opts.providers ?? await loadKeys(sb);
  const ask = makeAsk(keys);
  if (!ask) return fail(sb, t0, trigger, null, "No AI provider key is set. Add at least one on the Automation screen.");

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
    if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
    if (req.method !== "POST") return json(405, { error: "POST only" });
    let stage = "setup";
    try {
      const url = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const admin: Db = createClient(url, serviceKey);
      const body = await req.json().catch(() => ({}));
      let trigger: "schedule" | "manual" = "manual";

      const cronSecret = Deno.env.get("CRON_SECRET");
      if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) {
        stage = "schedule check";
        trigger = "schedule";
        const { data: due, error } = await admin.rpc("ai_post_due");
        if (error) return json(500, { error: `${stage}: ${error.message}` });
        if (!due && !body.force) return json(200, { ok: true, skipped: "not due" });
      } else {
        stage = "sign-in check";
        const who = await requireStaff(req, url, admin);
        if (!who.ok) return who.res;
      }

      stage = "drafting";
      const result = await runDraft({ sb: admin, trigger, topicId: body.topic_id ? Number(body.topic_id) : undefined });
      return json(result.ok ? 200 : 422, result);
    } catch (e) {
      return json(500, { error: `${stage}: ${(e as Error).message}` });
    }
  });
}
