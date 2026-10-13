import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Sparkles, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/hooks.js'
import { PageHead, Note } from '../components/ui.jsx'
import { ARMS } from './Posts.jsx'

const KEY = 'viverst-admin:assistant'
const STARTERS = [
  'What needs my attention today?',
  'Summarise this week’s orders.',
  'Which products are running low?',
  'Draft a blog post about storing maize through the rains.',
  'Write a reply to a customer asking when their order ships.',
]

/* very small markdown: paragraphs, **bold**, bullet lines */
function Markdown({ text }) {
  const blocks = String(text).split(/\n{2,}/)
  return blocks.map((b, i) => {
    const lines = b.split('\n')
    const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l))
    const inline = (s) => s.split(/(\*\*[^*]+\*\*)/).map((part, j) => part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part)
    if (isList) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>)}</ul>
    return <p key={i}>{lines.map((l, j) => <span key={j}>{inline(l)}{j < lines.length - 1 && <br />}</span>)}</p>
  })
}

export default function Assistant() {
  const nav = useNavigate()
  const { staff } = useAuth()
  const [messages, setMessages] = useState(() => { try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] } })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const endRef = useRef(null)

  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(messages.slice(-40))) } catch { /* ignore */ } }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, busy])

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    setInput(''); setError(''); setDone('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next); setBusy(true)
    const { data, error } = await supabase.functions.invoke('assistant', { body: { messages: next.map(({ role, content }) => ({ role, content })) } })
    setBusy(false)
    if (error) {
      let detail = error.message
      try { const b = await error.context?.json(); if (b?.error) detail = b.error } catch { /* keep */ }
      setError(`The assistant couldn’t answer: ${detail}`); return
    }
    if (!data?.ok) { setError(data?.error || 'No answer.'); return }
    setMessages((m) => [...m, { role: 'assistant', content: data.answer, actions: data.actions || [], provider: data.provider }])
  }

  async function act(a) {
    if (a.type === 'open') { nav(a.path); return }
    if (a.type === 'queue_topic') {
      const { error } = await supabase.from('ai_topics').insert({ topic: a.topic, arm: a.arm || 'global', created_by: staff?.user_id })
      if (error) { setError(error.message); return }
      setDone(`Queued “${a.topic}” for ${ARMS[a.arm] || 'Viverst Global'}. Draft it from Automation → Topics, or wait for the schedule.`)
    }
  }

  function clear() { setMessages([]); setError(''); setDone(''); try { sessionStorage.removeItem(KEY) } catch { /* ignore */ } }

  return (
    <div className="page assistant">
      <PageHead title="Assistant" lede="Ask about orders, stock, the blog or events. It reads the live numbers before every answer, and can queue a blog topic or point you to the right screen.">
        {messages.length > 0 && <button type="button" className="btn btn-quiet btn-sm" onClick={clear}><Trash2 aria-hidden="true" />Clear chat</button>}
      </PageHead>
      <Note kind="error">{error}</Note>
      <Note kind="ok">{done}</Note>

      <div className="chat panel">
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-empty">
              <Sparkles aria-hidden="true" />
              <p>Try one of these, or type your own.</p>
              <div className="chat-starters">{STARTERS.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble bubble-${m.role}`}>
              <div className="bubble-body">{m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}</div>
              {m.actions?.length > 0 && <div className="bubble-actions">{m.actions.map((a, j) => (
                <button key={j} type="button" className="btn btn-sm" onClick={() => act(a)}>{a.type === 'queue_topic' ? `Queue blog topic: ${a.topic}` : a.label || 'Open'}</button>))}</div>}
            </div>
          ))}
          {busy && <div className="bubble bubble-assistant"><div className="bubble-body muted">Thinking…</div></div>}
          <div ref={endRef} />
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about the business…" aria-label="Message" disabled={busy} />
          <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send aria-hidden="true" /></button>
        </form>
      </div>
    </div>
  )
}
