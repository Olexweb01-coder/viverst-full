import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { slugify, when } from '../lib/format.js'
import { imageUrl, uploadImage, removeImage } from '../lib/images.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { PageHead, Note, Empty, Field, Chip } from '../components/ui.jsx'

export const ARMS = { global: 'Viverst Global', agro: 'Agro', studio: 'Studio' }
const STATUS = { draft: 'Draft', review: 'In review', scheduled: 'Scheduled', published: 'Published', rejected: 'Rejected' }

function hoursLeft(iso) { return Math.max(0, Math.round((new Date(iso) - Date.now()) / 36e5)) }

export default function Posts() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('status') || 'review'
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      let q = supabase.from('posts').select('id, slug, title, arm, status, author_kind, held, review_until, publish_at, published_at, updated_at').order('updated_at', { ascending: false }).limit(200)
      if (tab !== 'all') q = q.eq('status', tab)
      const { data, error } = await q
      if (!alive) return
      if (error) setError(error.message); else setRows(data)
    })()
    return () => { alive = false }
  }, [tab])

  const setTab = (s) => setParams(s === 'review' ? {} : { status: s })

  return (
    <div className="page">
      <PageHead title="Blog" lede="One blog on viverst.com. Each post is labelled with the arm it comes from. AI drafts wait here for 24 hours before going out on their own.">
        <Link className="btn btn-primary" to="/posts/new"><Plus aria-hidden="true" />Write a post</Link>
      </PageHead>
      <Note kind="error">{error}</Note>
      <div className="filters" role="group" aria-label="Show">
        {[['review', 'In review'], ['draft', 'Drafts'], ['scheduled', 'Scheduled'], ['published', 'Published'], ['rejected', 'Rejected'], ['all', 'All']].map(([k, l]) => (
          <button key={k} type="button" className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>))}
      </div>
      {rows && rows.length === 0 ? (
        <div className="panel"><Empty title={tab === 'review' ? 'Nothing waiting for review' : `No ${STATUS[tab]?.toLowerCase() || ''} posts`} body={tab === 'review' ? 'AI drafts and posts sent for review appear here.' : ''} /></div>
      ) : rows && (
        <div className="panel"><div className="table-wrap"><table>
          <thead><tr><th>Post</th><th>Arm</th><th>By</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id} className="row-link" data-status={p.held ? 'low' : p.status === 'published' ? 'delivered' : p.status === 'rejected' ? 'cancelled' : p.status === 'review' ? 'awaiting_payment' : undefined} onClick={() => nav(`/posts/${p.id}`)}>
              <td><strong>{p.title}</strong></td>
              <td>{ARMS[p.arm]}</td>
              <td className="muted">{p.author_kind === 'ai' ? 'AI' : 'Staff'}</td>
              <td>{p.status === 'review'
                ? <Chip kind={p.held ? 'alert' : 'warn'}>{p.held ? 'Held — has notes' : `Publishes in ${hoursLeft(p.review_until)} h`}</Chip>
                : <Chip kind={{ scheduled: 'brand', published: 'ok', rejected: 'alert', draft: 'dim' }[p.status]}>{p.status === 'scheduled' ? `Scheduled ${when(p.publish_at)}` : STATUS[p.status]}</Chip>}</td>
              <td className="muted small">{when(p.updated_at)}</td>
            </tr>))}</tbody>
        </table></div></div>
      )}
    </div>
  )
}

const BLANK = { title: '', slug: '', arm: 'global', excerpt: '', body: '', cover: '', tags: '', status: 'draft', author_kind: 'staff', sources: [], review_until: null, held: false, publish_at: '', published_at: null }
const toLocal = (iso) => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''

export function PostEdit() {
  const { id } = useParams()
  return <PostEditor key={id ?? 'new'} id={id} />
}

function PostEditor({ id }) {
  const isNew = !id
  const nav = useNavigate()
  const { staff } = useAuth()
  const [form, setForm] = useState(BLANK)
  const [loaded, setLoaded] = useState(isNew)
  const [notes, setNotes] = useState([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [schedule, setSchedule] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
    if (error || !data) { setError(error?.message || 'That post no longer exists.'); setLoaded(true); return }
    setForm({ ...data, cover: data.cover || '', tags: (data.tags || []).join(', '), publish_at: toLocal(data.publish_at) })
    setSchedule(toLocal(data.publish_at))
    const { data: n } = await supabase.from('review_notes').select('id, note, created_at, staff_id').eq('post_id', id).order('created_at')
    setNotes(n || [])
    setLoaded(true)
  }, [id])
  useEffect(() => { if (!isNew) { const t = setTimeout(load, 0); return () => clearTimeout(t) } }, [isNew, load])

  const set = (k) => (e) => {
    const v = e.target.value
    setForm((f) => ({ ...f, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }))
    if (k === 'slug') setSlugTouched(true)
  }

  function rowFromForm(extra = {}) {
    return {
      title: form.title.trim(), slug: slugify(form.slug || form.title), arm: form.arm, excerpt: form.excerpt.trim(), body: form.body,
      cover: form.cover || null, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean), ...extra,
    }
  }

  async function persist(row) {
    if (!row.title) throw new Error('Give the post a title.')
    const q = isNew
      ? supabase.from('posts').insert({ ...row, author_kind: 'staff', author_id: staff?.user_id }).select('id').single()
      : supabase.from('posts').update(row).eq('id', id).select('id').single()
    const { data, error } = await q
    if (error) throw new Error(error.code === '23505' ? 'Another post already uses that web address. Change it.' : error.message)
    return data.id
  }

  async function act(kind) {
    setBusy(true); setError('')
    try {
      let row
      if (kind === 'draft') row = rowFromForm({ status: 'draft', held: false })
      if (kind === 'publish') row = rowFromForm({ status: 'published', published_at: new Date().toISOString(), held: false })
      if (kind === 'reject') row = rowFromForm({ status: 'rejected', held: false })
      if (kind === 'schedule') {
        if (!schedule) throw new Error('Pick a date and time to schedule.')
        row = rowFromForm({ status: 'scheduled', publish_at: new Date(schedule).toISOString(), held: false })
      }
      if (kind === 'review') row = rowFromForm()
      const newId = await persist(row)
      if (kind === 'review') {
        const { error } = await supabase.rpc('send_post_to_review', { p_post_id: newId, p_hours: 24 })
        if (error) throw new Error(error.message)
      }
      if (isNew) { nav(`/posts/${newId}`, { replace: true }); return }
      await load()
      setFlash({ draft: 'Saved as draft.', publish: 'Published.', reject: 'Rejected.', schedule: 'Scheduled.', review: 'Sent to review. It will publish itself in 24 hours unless someone leaves a note.' }[kind])
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  async function addNote(e) {
    e.preventDefault()
    if (!note.trim()) return
    setBusy(true); setError('')
    const { error } = await supabase.from('review_notes').insert({ post_id: id, staff_id: staff?.user_id, note: note.trim() })
    setBusy(false)
    if (error) { setError(error.message); return }
    setNote(''); setFlash('Note added. The post is now held until someone publishes or rejects it.'); await load()
  }

  async function onCover(e) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setBusy(true); setError('')
    try { const p = await uploadImage(f, 'posts', 'content-images'); setForm((x) => ({ ...x, cover: p })) } catch (err) { setError(err.message) }
    setBusy(false)
  }

  async function remove() {
    if (!window.confirm(`Delete “${form.title}”?`)) return
    setBusy(true)
    const { error } = await supabase.from('posts').delete().eq('id', id)
    setBusy(false)
    if (error) { setError(error.message); return }
    nav('/posts', { replace: true })
  }

  if (!loaded) return <div className="page"><p className="muted">Loading…</p></div>
  const inReview = form.status === 'review'

  return (
    <div className="page">
      <PageHead title={isNew ? 'Write a post' : form.title || 'Post'}>
        <Link className="btn btn-quiet" to="/posts"><ArrowLeft aria-hidden="true" />Blog</Link>
      </PageHead>
      <Note kind="error">{error}</Note>
      <Note kind="ok">{flash}</Note>

      {!isNew && (
        <div className={`note ${inReview ? (form.held ? 'note-error' : 'note-info') : 'note-info'}`} style={{ marginBottom: 16 }}>
          <strong>{STATUS[form.status]}.</strong>{' '}
          {inReview && !form.held && <>Publishes on its own {when(form.review_until)} unless someone leaves a note below.</>}
          {inReview && form.held && <>Held: a note was left, so it will not publish until you press Publish or Reject.</>}
          {form.status === 'scheduled' && <>Goes out {when(form.publish_at)}.</>}
          {form.status === 'published' && <>Live since {when(form.published_at)}.</>}
          {form.author_kind === 'ai' && <> Drafted by the AI{form.sources?.length ? ` from ${form.sources.length} source(s)` : ''}.</>}
        </div>
      )}

      <form className="panel panel-body form" onSubmit={(e) => { e.preventDefault(); act('draft') }}>
        <div className="form-row">
          <Field label="Title"><input className="input" required value={form.title} onChange={set('title')} /></Field>
          <Field label="From which arm"><select className="select" value={form.arm} onChange={set('arm')}>{Object.entries(ARMS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Web address"><input className="input" value={form.slug} onChange={set('slug')} /></Field>
        </div>
        <Field label="Excerpt" hint="One or two sentences shown in lists and previews."><textarea className="textarea" style={{ minHeight: 60 }} value={form.excerpt} onChange={set('excerpt')} maxLength={300} /></Field>
        <Field label="Body" hint="Plain text with blank lines between paragraphs. Markdown works: **bold**, ## Heading, - lists, [link](https://…)."><textarea className="textarea" style={{ minHeight: 360, fontFamily: 'var(--font-mono)', fontSize: 13.5 }} value={form.body} onChange={set('body')} /></Field>
        <div className="form-row">
          <Field label="Cover image">
            <div className="images">
              {form.cover && <figure><img src={imageUrl(form.cover, 'content-images')} alt="" /><button type="button" aria-label="Remove cover" onClick={async () => { const c = form.cover; setForm((f) => ({ ...f, cover: '' })); await removeImage(c, 'content-images') }}><X /></button></figure>}
              {!form.cover && <label className="add"><input type="file" accept="image/*" onChange={onCover} disabled={busy} />{busy ? 'Uploading…' : 'Add cover'}</label>}
            </div>
          </Field>
          <Field label="Tags" hint="Comma-separated."><input className="input" value={form.tags} onChange={set('tags')} /></Field>
        </div>
        {form.sources?.length > 0 && (
          <Field label="Sources the AI used">
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{form.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer">{s.title || s.url}</a></li>)}</ul>
          </Field>
        )}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={busy}>Save draft</button>
          {form.status !== 'published' && <button className="btn" type="button" disabled={busy} onClick={() => act('review')}>Send to review (24 h)</button>}
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => act('publish')}>{form.status === 'published' ? 'Update live post' : 'Publish now'}</button>
          {!isNew && form.status !== 'published' && <button className="btn btn-danger" type="button" disabled={busy} onClick={() => act('reject')}>Reject</button>}
          {!isNew && <button className="btn btn-quiet right" type="button" disabled={busy} onClick={remove}>Delete</button>}
        </div>
        {form.status !== 'published' && (
          <div className="form-row" style={{ alignItems: 'end' }}>
            <Field label="Or schedule for"><input className="input" type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} /></Field>
            <div><button className="btn" type="button" disabled={busy || !schedule} onClick={() => act('schedule')}>Schedule</button></div>
          </div>
        )}
      </form>

      {!isNew && (
        <div className="panel">
          <div className="panel-head"><h2>Review notes</h2></div>
          <div className="panel-body form">
            {notes.length === 0 && <p className="muted small">No notes. {inReview && 'Leaving one holds the post so it cannot publish by itself.'}</p>}
            {notes.map((n) => <div key={n.id} className="note note-info"><div>{n.note}</div><div className="muted small">{when(n.created_at)}</div></div>)}
            <form onSubmit={addNote} className="form-row" style={{ alignItems: 'end' }}>
              <Field label="Add a note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. tighten the intro, check the price quoted" /></Field>
              <div><button className="btn" type="submit" disabled={busy || !note.trim()}>Add note</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
