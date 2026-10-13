// VIVERST · shared AI provider access for Edge Functions.
// Groq → Cerebras → Gemini, fastest first; each asked for its current model
// list so a retired model name never breaks anything.

export type Source = { title: string; url: string; snippet: string };
export type Keys = { groq?: string; cerebras?: string; gemini?: string; tavily?: string };

// Model names change often. Each provider is asked for its current list and
// the best available model is chosen from preferences, so a retired name
// never breaks drafting again. Results are cached for the life of the process.
const modelCache = new Map<string, string>();

async function pickModel(cacheKey: string, listUrl: string, headers: Record<string, string>, prefer: string[], fallback: (name: string) => boolean, extract: (d: unknown) => string[]): Promise<string> {
  const cached = modelCache.get(cacheKey);
  if (cached) return cached;
  const r = await fetch(listUrl, { headers, signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new Error(`${new URL(listUrl).host} models ${r.status}: ${(await r.text()).slice(0, 160)}`);
  const names = extract(await r.json());
  const chosen = prefer.find((p) => names.includes(p))
    ?? names.filter(fallback).sort((a, b) => b.length - a.length)[0];
  if (!chosen) throw new Error(`${new URL(listUrl).host}: no usable model in list (${names.slice(0, 6).join(", ")})`);
  modelCache.set(cacheKey, chosen);
  return chosen;
}

const openaiList = (d: unknown) => ((d as { data?: Array<{ id: string }> }).data ?? []).map((m) => m.id);
const isChatLlama = (n: string) => /llama|qwen|mixtral|gpt-oss|deepseek/i.test(n) && !/guard|whisper|tts|vision|embed|safety|prompt/i.test(n);

export async function groq(key: string, system: string, user: string): Promise<string> {
  const model = await pickModel("groq", "https://api.groq.com/openai/v1/models", { authorization: `Bearer ${key}` },
    ["llama-3.3-70b-versatile", "meta-llama/llama-4-maverick-17b-128e-instruct", "meta-llama/llama-4-scout-17b-16e-instruct", "openai/gpt-oss-120b", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"],
    isChatLlama, openaiList);
  return openaiCompatible("https://api.groq.com/openai/v1/chat/completions", key, model, system, user);
}
export async function cerebras(key: string, system: string, user: string): Promise<string> {
  const model = await pickModel("cerebras", "https://api.cerebras.ai/v1/models", { authorization: `Bearer ${key}` },
    ["llama-3.3-70b", "gpt-oss-120b", "qwen-3-235b-a22b-instruct-2507", "llama3.1-70b", "llama3.1-8b"],
    isChatLlama, openaiList);
  return openaiCompatible("https://api.cerebras.ai/v1/chat/completions", key, model, system, user);
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
export async function gemini(key: string, system: string, user: string): Promise<string> {
  const model = await pickModel("gemini", `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=200`, {},
    ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3-flash", "gemini-2.5-flash", "gemini-2.0-flash"],
    (n) => /flash/i.test(n) && !/lite|image|tts|live|audio|embedding|preview|exp/i.test(n),
    (d) => ((d as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }).models ?? [])
      .filter((m) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, "")));
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 2200 } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(`gemini(${model}) ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const d = await r.json();
  const text = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error("gemini: empty reply");
  return text;
}

export async function tavily(key: string, query: string): Promise<Source[]> {
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


/** Try each configured model in order; the first that answers wins. */
export function makeAsk(keys: Keys) {
  const models: Array<[string, (s: string, u: string) => Promise<string>]> = [];
  if (keys.groq) models.push(["groq", (s, u) => groq(keys.groq!, s, u)]);
  if (keys.cerebras) models.push(["cerebras", (s, u) => cerebras(keys.cerebras!, s, u)]);
  if (keys.gemini) models.push(["gemini", (s, u) => gemini(keys.gemini!, s, u)]);
  if (!models.length) return null;
  return async (system: string, user: string) => {
    const errors: string[] = [];
    for (const [name, fn] of models) {
      try { return { provider: name, text: await fn(system, user) }; } catch (e) { errors.push(`${name}: ${(e as Error).message}`); }
    }
    throw new Error(`All providers failed — ${errors.join(" | ")}`);
  };
}

export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "access-control-allow-methods": "POST, OPTIONS",
};
export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });

export function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{"); const end = cleaned.lastIndexOf("}");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

/** Verify a browser caller the same way the browser does, then confirm staff. */
// deno-lint-ignore no-explicit-any
export async function requireStaff(req: Request, url: string, admin: any): Promise<{ ok: true; userId: string; role: string } | { ok: false; res: Response }> {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const apikey = req.headers.get("apikey") ?? "";
  if (!jwt) return { ok: false, res: json(401, { error: "sign-in check: no login token was sent" }) };
  const r = await fetch(`${url}/auth/v1/user`, { headers: { authorization: `Bearer ${jwt}`, apikey } });
  if (!r.ok) return { ok: false, res: json(401, { error: `sign-in check: auth server said ${r.status} ${(await r.text()).slice(0, 160)}` }) };
  const user = await r.json() as { id?: string };
  if (!user?.id) return { ok: false, res: json(401, { error: "sign-in check: token did not resolve to a user" }) };
  const { data: staff, error } = await admin.from("staff").select("role, active").eq("user_id", user.id).maybeSingle();
  if (error) return { ok: false, res: json(500, { error: `staff check: ${error.message}` }) };
  if (!staff?.active) return { ok: false, res: json(403, { error: "staff check: this account is not on the staff list" }) };
  return { ok: true, userId: user.id, role: staff.role };
}

/** Provider keys from the locked secrets table (service role only). */
// deno-lint-ignore no-explicit-any
export async function loadKeys(admin: any): Promise<Keys> {
  const { data } = await admin.from("secrets").select("key, value").in("key", ["groq_api_key", "cerebras_api_key", "gemini_api_key", "tavily_api_key"]);
  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]));
  return { groq: map.groq_api_key, cerebras: map.cerebras_api_key, gemini: map.gemini_api_key, tavily: map.tavily_api_key };
}
