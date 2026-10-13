import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { when } from '../lib/format.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { PageHead, Note, Field } from '../components/ui.jsx'
import { ARMS } from './Posts.jsx'

const DAYS = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun']]
const KEYS = [
  ['groq_api_key', 'Groq', 'gsk_', 'console.groq.com → API Keys. Fastest; tried first.'],
  ['cerebras_api_key', 'Cerebras', 'csk-', 'cloud.cerebras.ai → API Keys. Tried if Groq is busy.'],
  ['gemini_api_key', 'Google Gemini', 'AIza', 'aistudio.google.com → Get API key. Tried third.'],
  ['tavily_api_key', 'Tavily (research)', 'tvly-', 'app.tavily.com → API Keys. Finds sources and headlines.'],
]

export default function Automation() {
  const { staff } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'schedule'
  const setTab = (t) => setParams(t === 'schedule' ? {} : { tab: t })
  const isOwner = staff?.role === 'owner'
  const [s, setS] = useState(null)
  const [present, setPresent] = useState({})
  const [keyInput, setKeyInput] = useState({})
  const [topics, setTopics] = useState([])
  const [runs, setRuns] = useState([])
  const [newTopic, setNewTopic] = useState('')
  const [newArm, setNewArm] = useState('agro')
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash(6000)
  const [busy, setBusy] = useState(false)
  const [drafting, setDrafting] = useState(false)

  const load = useCallback(async () => {
    const [{ data: st }, { data: pr }, { data: tp }, { data: rn }] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'automation').maybeSingle(),
      supabase.rpc('ai_keys_present'),
      supabase.from('ai_topics').select('id, topic, arm, status, post_id, error, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('ai_runs').select('id, started_at, finished_at, trigger, provider, ok, detail, post_id').order('started_at', { ascending: false }).limit(20),
    ])
    setS({ enabled: false, arms: ['global', 'agro', 'studio'], days: [1, 3, 5], hour: 9, review_hours: 24, self_find: true, ...(st?.value || {}) })
    setPresent(pr || {}); setTopics(tp || []); setRuns(rn || [])
  }, [])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  const anyModel = present.groq_api_key || present.cerebras_api_key || present.gemini_api_key

  async function saveSchedule() {
    setBusy(true); setError('')
    const value = { ...s, hour: Number(s.hour), review_hours: Number(s.review_hours) }
    if (!value.arms.length) { setError('Choose at least one arm.'); setBusy(false); return }
    if (!value.days.length && value.enabled) { setError('Choose at least one day, or switch automation off.'); setBusy(false); return }
    const { error } = await supabase.from('settings').upsert({ key: 'automation', value }, { onConflict: 'key' })
    setBusy(false)
    if (error) setError(error.message); else setFlash('Schedule saved.')
  }

  async function saveKey(k, prefix) {
    const v = (keyInput[k] || '').trim()
    if (v.length < 20) { setError('That key looks too short. Copy the whole thing.'); return }
    if (!v.startsWith(prefix) && !window.confirm(`Keys from ${KEYS.find((x) => x[0] === k)[1]} usually start with ${prefix}. Providers do change formats, so save it anyway? If it’s wrong, “Draft one now” will tell you.`)) return
    setBusy(true); setError('')
    const { error } = await supabase.rpc('set_secret', { p_key: k, p_value: v })
    setBusy(false)
    if (error) { setError(error.message); return }
    setKeyInput((o) => ({ ...o, [k]: '' })); setPresent((o) => ({ ...o, [k]: true })); setFlash('Key saved. It is stored where only the drafting function can read it.')
  }

  async function clearKey(k) {
    if (!window.confirm('Remove this key?')) return
    await supabase.rpc('set_secret', { p_key: k, p_value: '' })
    setPresent((o) => ({ ...o, [k]: false })); setFlash('Key removed.')
  }

  async function addTopic(e) {
    e.preventDefault()
    if (!newTopic.trim()) return
    setBusy(true); setError('')
    const { error } = await supabase.from('ai_topics').insert({ topic: newTopic.trim(), arm: newArm, created_by: staff?.user_id })
    setBusy(false)
    if (error) { setError(error.message); return }
    setNewTopic(''); await load()
  }

  async function removeTopic(id) {
    await supabase.from('ai_topics').delete().eq('id', id); await load()
  }

  async function draftNow(topicId) {
    setDrafting(true); setError('')
    const { data, error } = await supabase.functions.invoke('ai-draft', { body: topicId ? { topic_id: topicId } : {} })
    setDrafting(false)
    if (error) {
      // supabase-js hides the body on non-2xx; read it so the real reason shows
      let detail = error.message
      try { const body = await error.context?.json(); if (body?.error) detail = `${body.error} (HTTP ${error.context.status})` } catch { /* keep message */ }
      setError(`Drafting failed: ${detail}`); await load(); return
    }
    if (!data?.ok) { setError(data?.error || 'Drafting failed.'); await load(); return }
    setFlash(`Drafted “${data.post.title}” with ${data.provider} from ${data.sources} source(s). It’s in the review queue.`)
    await load()
  }

  if (!s) return <div className="page"><PageHead title="Automation" /><p className="muted">Loading…</p></div>

  return (
    <div className="page">
      <PageHead title="Automation" lede="The AI writes blog drafts on a schedule, from topics you queue or ones it finds in the week's news. Every draft waits in review for 24 hours before publishing itself.">
        <button type="button" className="btn btn-primary" disabled={drafting || !anyModel} onClick={() => draftNow()} title={anyModel ? '' : 'Add at least one AI key first'}>
          <Sparkles aria-hidden="true" />{drafting ? 'Drafting… (20–60 s)' : 'Draft one now'}
        </button>
      </PageHead>
      <Note kind="error">{error}</Note>
      <Note kind="ok">{flash}</Note>

      <div className="tabs" role="tablist" aria-label="Automation sections">
        {[['schedule', 'Schedule'], ['keys', `AI keys${anyModel ? '' : ' · none set'}`], ['topics', `Topics${topics.filter((t) => t.status === 'queued').length ? ` · ${topics.filter((t) => t.status === 'queued').length} queued` : ''}`], ['runs', 'Runs']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>))}
      </div>

      {tab === 'schedule' && <section className="panel">
        <div className="panel-head"><h2>Schedule</h2><button type="button" className="btn btn-sm" disabled={busy} onClick={saveSchedule}>Save</button></div>
        <div className="panel-body form">
          <label className="check"><input type="checkbox" checked={!!s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} /><strong>Automation is {s.enabled ? 'on' : 'off'}</strong></label>
          {s.enabled && !anyModel && <Note kind="error">Automation is on but no AI key is set yet, so nothing will be written. Add a key below.</Note>}
          <Field label="Days (Lagos time)">
            <div className="filters" style={{ marginBottom: 0 }}>{DAYS.map(([d, l]) => (
              <button key={d} type="button" className={s.days.includes(d) ? 'active' : ''} aria-pressed={s.days.includes(d)}
                onClick={() => setS({ ...s, days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d].sort() })}>{l}</button>))}</div>
          </Field>
          <div className="form-row">
            <Field label="At what hour" hint="24-hour clock. One draft per chosen day, at this hour.">
              <select className="select" value={s.hour} onChange={(e) => setS({ ...s, hour: Number(e.target.value) })}>{Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}</select>
            </Field>
            <Field label="Review window" hint="Hours a draft waits before publishing itself.">
              <select className="select" value={s.review_hours} onChange={(e) => setS({ ...s, review_hours: Number(e.target.value) })}>{[6, 12, 24, 48, 72].map((h) => <option key={h} value={h}>{h} hours</option>)}</select>
            </Field>
          </div>
          <Field label="Write about">
            <div className="filters" style={{ marginBottom: 0 }}>{Object.entries(ARMS).map(([k, l]) => (
              <button key={k} type="button" className={s.arms.includes(k) ? 'active' : ''} aria-pressed={s.arms.includes(k)}
                onClick={() => setS({ ...s, arms: s.arms.includes(k) ? s.arms.filter((x) => x !== k) : [...s.arms, k] })}>{l}</button>))}</div>
          </Field>
          <label className="check"><input type="checkbox" checked={!!s.self_find} onChange={(e) => setS({ ...s, self_find: e.target.checked })} />When the topic queue is empty, find a topic from this week’s news (needs the Tavily key)</label>
        </div>
      </section>}

      {tab === 'keys' && <section className="panel">
        <div className="panel-head"><h2>AI keys</h2><span className="small muted">{isOwner ? 'Owner only' : 'Only the owner can change these'}</span></div>
        <div className="panel-body form">
          {KEYS.map(([k, label, prefix, hint]) => (
            <div key={k} className="form-row" style={{ alignItems: 'end' }}>
              <Field label={`${label} — ${present[k] ? '● set' : '○ not set'}`} hint={hint}>
                <input className="input" type="password" autoComplete="off" placeholder={`${prefix}…`} value={keyInput[k] || ''} onChange={(e) => setKeyInput((o) => ({ ...o, [k]: e.target.value }))} disabled={!isOwner} />
              </Field>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn" disabled={!isOwner || busy || !(keyInput[k] || '').trim()} onClick={() => saveKey(k, prefix)}>{present[k] ? 'Replace' : 'Save'}</button>
                {present[k] && isOwner && <button type="button" className="btn btn-quiet" onClick={() => clearKey(k)} aria-label={`Remove ${label} key`}><Trash2 aria-hidden="true" /></button>}
              </div>
            </div>))}
        </div>
      </section>}

      {tab === 'topics' && <section className="panel">
        <div className="panel-head"><h2>Topic queue</h2></div>
        <div className="panel-body form">
          <form onSubmit={addTopic} className="form-row" style={{ alignItems: 'end' }}>
            <Field label="Add a topic" hint="A sentence is enough: “How to store maize through the rainy season”."><input className="input" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} /></Field>
            <Field label="Arm"><select className="select" value={newArm} onChange={(e) => setNewArm(e.target.value)}>{Object.entries(ARMS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <div><button className="btn" type="submit" disabled={busy || !newTopic.trim()}>Queue it</button></div>
          </form>
          {topics.length === 0 ? <p className="muted small">Queue is empty.{s.self_find ? ' The AI will find its own topics.' : ''}</p> : (
            <div className="table-wrap"><table>
              <thead><tr><th>Topic</th><th>Arm</th><th>Status</th><th></th></tr></thead>
              <tbody>{topics.map((t) => (
                <tr key={t.id} data-status={t.status === 'failed' ? 'cancelled' : t.status === 'done' ? 'delivered' : undefined}>
                  <td>{t.topic}{t.error && <div className="small" style={{ color: 'var(--alert)' }}>{t.error}</div>}</td>
                  <td>{ARMS[t.arm]}</td>
                  <td>{t.status === 'done' && t.post_id ? <Link to={`/posts/${t.post_id}`}>drafted → open</Link> : t.status}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {(t.status === 'queued' || t.status === 'failed') && <button type="button" className="btn btn-sm" disabled={drafting || !anyModel} onClick={() => draftNow(t.id)}>Draft now</button>}{' '}
                    {t.status !== 'drafting' && <button type="button" className="btn btn-sm btn-quiet" aria-label="Remove topic" onClick={() => removeTopic(t.id)}><Trash2 aria-hidden="true" /></button>}
                  </td>
                </tr>))}</tbody>
            </table></div>)}
        </div>
      </section>}

      {tab === 'runs' && <section className="panel">
        <div className="panel-head"><h2>Recent runs</h2></div>
        {runs.length === 0 ? <div className="empty">Nothing has run yet.</div> : (
          <div className="table-wrap"><table>
            <thead><tr><th>When</th><th>Trigger</th><th>Result</th><th>Model</th></tr></thead>
            <tbody>{runs.map((r) => (
              <tr key={r.id} data-status={r.ok ? 'delivered' : 'cancelled'}>
                <td className="small">{when(r.started_at)}</td><td className="muted">{r.trigger}</td>
                <td>{r.ok ? <>{r.post_id ? <Link to={`/posts/${r.post_id}`}>Drafted</Link> : 'OK'} <span className="muted small">{r.detail}</span></> : <span style={{ color: 'var(--alert)' }}>{r.detail}</span>}</td>
                <td className="muted">{r.provider || '—'}</td>
              </tr>))}</tbody>
          </table></div>)}
      </section>}
    </div>
  )
}
