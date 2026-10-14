import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Send, Sparkles, Trash2, Plus, Pencil, PanelLeftClose, PanelLeftOpen, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/hooks.js'
import { Note } from '../components/ui.jsx'
import { ARMS } from './Posts.jsx'

const STARTERS = [
  'What needs my attention today?',
  'Summarise this week’s orders.',
  'What does Viverst Studio do?',
  'Search: current maize price in Lagos',
  'Draft a blog post about storing maize through the rains.',
]

/* small markdown: paragraphs, **bold**, bullets, [n] citations */
function Markdown({ text, sources = [] }) {
  const cite = (s) => s.split(/(\[\d+\])/).map((part, j) => {
    const m = part.match(/^\[(\d+)\]$/); if (!m) return part
    const src = sources[Number(m[1]) - 1]
    return src ? <a key={j} className="cite" href={src.url} target="_blank" rel="noreferrer" title={src.title}>{m[1]}</a> : part
  })
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/).map((part, j) => part.startsWith('**') ? <strong key={j}>{cite(part.slice(2, -2))}</strong> : <span key={j}>{cite(part)}</span>)
  return String(text).split(/\n{2,}/).map((b, i) => {
    const lines = b.split('\n')
    if (lines.every((l) => /^\s*[-*•]\s+/.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*•]\s+/, ''))}</li>)}</ul>
    if (/^#{1,3}\s/.test(lines[0])) return <h4 key={i}>{inline(lines[0].replace(/^#+\s/, ''))}</h4>
    return <p key={i}>{lines.map((l, j) => <span key={j}>{inline(l)}{j < lines.length - 1 && <br />}</span>)}</p>
  })
}

function groupLabel(iso) {
  const d = new Date(iso); const now = new Date()
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'Previous 7 days'
  if (diff < 30) return 'Previous 30 days'
  return d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

export default function Assistant() {
  const nav = useNavigate()
  const { staff } = useAuth()
  const [params, setParams] = useSearchParams()
  const chatId = params.get('c')
  const [chats, setChats] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [listOpen, setListOpen] = useState(false)           // phone: slide-over
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('viverst-admin:chat-list') === 'closed' } catch { return false } })  // desktop: remembered
  const toggleList = () => {
    if (window.matchMedia('(max-width: 960px)').matches) { setListOpen((o) => !o); return }
    setCollapsed((c) => { try { localStorage.setItem('viverst-admin:chat-list', c ? 'open' : 'closed') } catch { /* ignore */ } return !c })
  }
  const [renaming, setRenaming] = useState(null)
  const [renameText, setRenameText] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const justCreated = useRef(null)   // a chat we created this turn: don't reload it over the reply

  const loadChats = useCallback(async () => {
    const { data, error } = await supabase.from('assistant_chats').select('id, title, created_at, updated_at').order('updated_at', { ascending: false }).limit(200)
    if (error) setError(error.message); else setChats(data)
  }, [])
  useEffect(() => { const t = setTimeout(loadChats, 0); return () => clearTimeout(t) }, [loadChats])

  useEffect(() => {
    if (!chatId) return
    if (justCreated.current === chatId) { justCreated.current = null; return }
    let alive = true
    supabase.from('assistant_chats').select('messages').eq('id', chatId).maybeSingle().then(({ data }) => { if (alive) setMessages(data?.messages || []) })
    return () => { alive = false }
  }, [chatId])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages, busy])

  const openChat = (id) => { setParams(id ? { c: id } : {}); if (!id) setMessages([]); setListOpen(false); setError(''); setDone('') }
  const newChat = () => { openChat(null); setTimeout(() => inputRef.current?.focus(), 0) }

  async function persist(id, msgs, title) {
    const row = { messages: msgs.map(({ role, content, actions, sources }) => ({ role, content, actions, sources })) }
    if (title) row.title = title
    if (id) { await supabase.from('assistant_chats').update(row).eq('id', id); return id }
    const { data, error } = await supabase.from('assistant_chats').insert({ ...row, staff_id: staff?.user_id, title: title || 'New chat' }).select('id').single()
    if (error) throw new Error(error.message)
    return data.id
  }

  async function send(text) {
    const content = (text ?? input).trim()
    if (!content || busy) return
    setInput(''); setError(''); setDone('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next); setBusy(true)
    try {
      let id = chatId
      if (!id) { id = await persist(null, next, content.slice(0, 60)); justCreated.current = id; setParams({ c: id }, { replace: true }); loadChats() }
      const { data, error } = await supabase.functions.invoke('assistant', { body: { messages: next.map(({ role, content }) => ({ role, content })) } })
      if (error) {
        let detail = error.message
        try { const b = await error.context?.json(); if (b?.error) detail = b.error } catch { /* keep */ }
        throw new Error(detail)
      }
      if (!data?.ok) throw new Error(data?.error || 'No answer.')
      const withReply = [...next, { role: 'assistant', content: data.answer, actions: data.actions || [], sources: data.sources || [] }]
      setMessages(withReply)
      await persist(id, withReply); loadChats()
    } catch (e) { setError(`The assistant couldn’t answer: ${e.message}`) }
    setBusy(false)
  }

  async function act(a) {
    if (a.type === 'open') { nav(a.path); return }
    if (a.type === 'queue_topic') {
      const { error } = await supabase.from('ai_topics').insert({ topic: a.topic, arm: a.arm || 'global', created_by: staff?.user_id })
      if (error) { setError(error.message); return }
      setDone(`Queued “${a.topic}” for ${ARMS[a.arm] || 'Viverst Global'}. Draft it from Automation → Topics, or wait for the schedule.`)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this chat?')) return
    await supabase.from('assistant_chats').delete().eq('id', id)
    if (id === chatId) openChat(null)
    loadChats()
  }
  async function rename(id) {
    const title = renameText.trim(); setRenaming(null)
    if (!title) return
    await supabase.from('assistant_chats').update({ title }).eq('id', id); loadChats()
  }

  const groups = []
  for (const c of chats || []) { const g = groupLabel(c.updated_at); const last = groups[groups.length - 1]; if (last?.label === g) last.items.push(c); else groups.push({ label: g, items: [c] }) }
  const current = chats?.find((c) => c.id === chatId)

  return (
    <div className={`assistant-wrap${collapsed ? ' collapsed' : ''}`}>
      <aside className={`chat-list${listOpen ? ' open' : ''}`} aria-label="Conversations">
        <div className="chat-list-head">
          <button type="button" className="btn btn-primary" onClick={newChat}><Plus aria-hidden="true" />New chat</button>
          <button type="button" className="btn btn-quiet btn-sm chat-list-close" onClick={() => setListOpen(false)} aria-label="Close list"><X aria-hidden="true" /></button>
        </div>
        <div className="chat-list-body">
          {chats && chats.length === 0 && <p className="muted small" style={{ padding: '8px 10px' }}>Your chats will appear here.</p>}
          {groups.map((g) => (
            <div key={g.label} className="chat-group">
              <div className="chat-group-label">{g.label}</div>
              {g.items.map((c) => (
                <div key={c.id} className={`chat-item${c.id === chatId ? ' active' : ''}`}>
                  {renaming === c.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); rename(c.id) }} className="chat-rename">
                      <input className="input" value={renameText} onChange={(e) => setRenameText(e.target.value)} aria-label="Chat title" autoFocus />
                      <button type="submit" className="btn btn-sm btn-quiet" aria-label="Save title"><Check /></button>
                    </form>
                  ) : (
                    <>
                      <button type="button" className="chat-item-open" onClick={() => openChat(c.id)}>{c.title}</button>
                      <span className="chat-item-tools">
                        <button type="button" className="btn btn-quiet btn-sm" aria-label="Rename chat" onClick={() => { setRenaming(c.id); setRenameText(c.title) }}><Pencil /></button>
                        <button type="button" className="btn btn-quiet btn-sm" aria-label="Delete chat" onClick={() => remove(c.id)}><Trash2 /></button>
                      </span>
                    </>
                  )}
                </div>))}
            </div>))}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-top">
          <button type="button" className="btn btn-quiet btn-sm chat-list-toggle" onClick={toggleList} aria-label={collapsed ? 'Show conversations' : 'Hide conversations'} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}</button>
          {collapsed && <button type="button" className="btn btn-quiet btn-sm" onClick={newChat} aria-label="New chat"><Plus aria-hidden="true" /></button>}
          <h1>{current?.title || 'Assistant'}</h1>
        </div>
        <Note kind="error">{error}</Note>
        <Note kind="ok">{done}</Note>
        <div className="chat-log" aria-live="polite">
          {messages.length === 0 && !busy && (
            <div className="chat-empty">
              <span className="chat-empty-mark"><Sparkles aria-hidden="true" /></span>
              <h2>How can I help?</h2>
              <p>I know the three businesses, I read the live numbers before every answer, and I can search the web when you ask.</p>
              <div className="chat-starters">{STARTERS.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`bubble bubble-${m.role}`}>
              <div className="bubble-body">{m.role === 'assistant' ? <Markdown text={m.content} sources={m.sources} /> : m.content}</div>
              {m.sources?.length > 0 && <div className="bubble-sources">{m.sources.map((s, j) => <a key={j} href={s.url} target="_blank" rel="noreferrer">{j + 1}. {s.title}</a>)}</div>}
              {m.actions?.length > 0 && <div className="bubble-actions">{m.actions.map((a, j) => (
                <button key={j} type="button" className="btn btn-sm" onClick={() => act(a)}>{a.type === 'queue_topic' ? `Queue blog topic: ${a.topic}` : a.label || 'Open'}</button>))}</div>}
            </div>
          ))}
          {busy && <div className="bubble bubble-assistant"><div className="bubble-body typing"><span /><span /><span /></div></div>}
          <div ref={endRef} />
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input ref={inputRef} className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message the assistant…" aria-label="Message" disabled={busy} />
          <button className="btn btn-primary" type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send aria-hidden="true" /></button>
        </form>
      </section>
    </div>
  )
}
