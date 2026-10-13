import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, ExternalLink, Plus, RefreshCw, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { slugify, when } from '../lib/format.js'
import { imageUrl, uploadImage, removeImage } from '../lib/images.js'
import { useFlash } from '../lib/hooks.js'
import { loadRegistrationSummary, tabLink } from '../lib/registrations.js'
import { PageHead, Note, Empty, Field, Group, Chip } from '../components/ui.jsx'

export const SITES = { main: 'Viverst Global', agro: 'Viverst Agro', studio: 'Viverst Studio' }

export default function Events() {
  const nav = useNavigate()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('upcoming')
  const [sheet, setSheet] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [{ data, error }, summary] = await Promise.all([
        supabase.from('events')
          .select('id, site, slug, title, starts_at, ends_at, location, status, registration, event_registrations(count)')
          .order('starts_at', { ascending: false }),
        loadRegistrationSummary(),
      ])
      if (!alive) return
      if (error) setError(error.message); else setRows(data)
      setSheet(summary)
    })()
    return () => { alive = false }
  }, [])

  const signups = (e) => sheet?.bySlug?.[e.slug]?.count ?? (e.registration ? (e.event_registrations?.[0]?.count ?? 0) : null)
  const inAdmin = new Set((rows || []).map((e) => e.slug))

  const now = Date.now()
  const shown = (rows || []).filter((e) => filter === 'all' || (filter === 'upcoming' ? new Date(e.starts_at) >= now : new Date(e.starts_at) < now))

  return (
    <div className="page">
      <PageHead title="Events" lede="Published events appear on the chosen site's Events page. Registrations land here.">
        <Link className="btn btn-primary" to="/events/new"><Plus aria-hidden="true" />New event</Link>
      </PageHead>
      <Note kind="error">{error}</Note>
      {rows && rows.length === 0 ? (
        <div className="panel"><Empty title="No events yet" body="Create one and choose which site it belongs to."><Link className="btn btn-primary" to="/events/new">New event</Link></Empty></div>
      ) : rows && (
        <>
          <div className="filters" role="group" aria-label="Filter">
            {[['upcoming', 'Upcoming'], ['past', 'Past'], ['all', 'All']].map(([k, l]) => (
              <button key={k} type="button" className={filter === k ? 'active' : ''} onClick={() => setFilter(k)}>{l}</button>))}
          </div>
          <div className="panel"><div className="table-wrap"><table>
            <thead><tr><th>Event</th><th>Site</th><th>When</th><th>Status</th><th className="num">Signups</th></tr></thead>
            <tbody>{shown.map((e) => (
              <tr key={e.id} className="row-link" data-status={e.status === 'published' ? undefined : e.status === 'cancelled' ? 'cancelled' : 'inactive'} onClick={() => nav(`/events/${e.id}`)}>
                <td><strong>{e.title}</strong><div className="muted small">{e.location}</div></td>
                <td>{SITES[e.site]}</td>
                <td className="small">{when(e.starts_at)}</td>
                <td><Chip kind={{ published: 'ok', draft: 'dim', cancelled: 'alert' }[e.status]}>{e.status}</Chip></td>
                <td className="num">{signups(e) == null ? '—' : sheet?.bySlug?.[e.slug]
                  ? <a href={tabLink(sheet, sheet.bySlug[e.slug])} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} title="View leads in Google Sheets">{signups(e)} <ExternalLink aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: '-2px' }} /></a>
                  : signups(e)}</td>
              </tr>))}</tbody>
          </table></div></div>
        </>
      )}

      {sheet && (
        <div className="panel">
          <div className="panel-head"><h2>Registrations sheet</h2>
            <div className="page-actions">
              {sheet.url && <a className="btn btn-sm" href={sheet.url} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />Open in Google Sheets</a>}
              <button type="button" className="btn btn-sm btn-quiet" onClick={async () => setSheet(await loadRegistrationSummary(true))}><RefreshCw aria-hidden="true" />Refresh</button>
            </div></div>
          {!sheet.ok ? <div className="panel-body"><p className="muted">{sheet.reason}</p></div>
          : sheet.events.length === 0 ? <div className="empty">No registrations recorded yet.</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>Event (as registered on the site)</th><th className="num">Signups</th><th>Leads</th><th></th></tr></thead>
              <tbody>{sheet.events.map((ev) => (
                <tr key={ev.eventId}>
                  <td><strong>{ev.title || ev.eventId}</strong><div className="muted small">{ev.eventId}{!inAdmin.has(ev.eventId) && ' · not yet in the admin'}</div></td>
                  <td className="num">{ev.count}</td>
                  <td>{ev.gid != null ? <a href={tabLink(sheet, ev)} target="_blank" rel="noreferrer">View leads <ExternalLink aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: '-2px' }} /></a> : <span className="muted">no tab yet</span>}</td>
                  <td></td>
                </tr>))}</tbody>
            </table></div>}
          <div className="panel-body small muted" style={{ paddingTop: 0 }}>Names, phones and emails stay in the sheet. The admin only reads counts. Match an admin event to a sheet entry by giving it the same web address.</div>
        </div>
      )}
    </div>
  )
}

const BLANK = { site: 'agro', title: '', slug: '', summary: '', body: '', location: '', starts_at: '', ends_at: '', cover: '', registration: true, capacity: '', status: 'draft' }
const toLocal = (iso) => iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
const fromLocal = (s) => s ? new Date(s).toISOString() : null

export function EventEdit() {
  const { id } = useParams()
  return <EventEditor key={id ?? 'new'} id={id} />
}

function EventEditor({ id }) {
  const isNew = !id
  const nav = useNavigate()
  const [form, setForm] = useState(BLANK)
  const [loaded, setLoaded] = useState(isNew)
  const [regs, setRegs] = useState(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [sheet, setSheet] = useState(null)
  useEffect(() => { if (!isNew) loadRegistrationSummary().then(setSheet) }, [isNew])
  const sheetEv = sheet?.bySlug?.[form.slug]

  const loadRegs = useCallback(async () => {
    if (isNew) return
    const { data } = await supabase.from('event_registrations').select('id, name, email, phone, organisation, created_at').eq('event_id', id).order('created_at', { ascending: false })
    setRegs(data || [])
  }, [id, isNew])

  useEffect(() => {
    if (isNew) return
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()
      if (!alive) return
      if (error || !data) { setError(error?.message || 'That event no longer exists.'); setLoaded(true); return }
      setForm({ ...data, starts_at: toLocal(data.starts_at), ends_at: toLocal(data.ends_at), capacity: data.capacity ?? '', cover: data.cover || '' })
      setLoaded(true)
      await loadRegs()
    })()
    return () => { alive = false }
  }, [id, isNew, loadRegs])

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [k]: v, ...(k === 'title' && !slugTouched ? { slug: slugify(v) } : {}) }))
    if (k === 'slug') setSlugTouched(true)
  }

  async function onCover(e) {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setBusy(true); setError('')
    try { const p = await uploadImage(f, 'events', 'content-images'); setForm((x) => ({ ...x, cover: p })) } catch (err) { setError(err.message) }
    setBusy(false)
  }

  async function save(e, statusOverride) {
    e?.preventDefault()
    setBusy(true); setError('')
    const row = {
      site: form.site, title: form.title.trim(), slug: slugify(form.slug || form.title), summary: form.summary.trim(), body: form.body,
      location: form.location.trim(), starts_at: fromLocal(form.starts_at), ends_at: fromLocal(form.ends_at), cover: form.cover || null,
      registration: !!form.registration, capacity: form.capacity === '' ? null : Number(form.capacity), status: statusOverride || form.status,
    }
    if (!row.title) { setError('Give the event a title.'); setBusy(false); return }
    if (!row.starts_at) { setError('Set when it starts.'); setBusy(false); return }
    if (row.ends_at && row.ends_at < row.starts_at) { setError('It can’t end before it starts.'); setBusy(false); return }
    const q = isNew ? supabase.from('events').insert(row).select('id').single() : supabase.from('events').update(row).eq('id', id).select('id').single()
    const { data, error } = await q
    setBusy(false)
    if (error) { setError(error.code === '23505' ? 'Another event on this site already uses that web address. Change it.' : error.message); return }
    setForm((f) => ({ ...f, status: row.status }))
    if (isNew) nav(`/events/${data.id}`, { replace: true })
    setFlash(row.status === 'published' ? 'Published.' : 'Saved.')
  }

  async function remove() {
    if (!window.confirm(`Delete “${form.title}” and its ${regs?.length ?? 0} registration(s)?`)) return
    setBusy(true)
    const { error } = await supabase.from('events').delete().eq('id', id)
    setBusy(false)
    if (error) { setError(error.message); return }
    nav('/events', { replace: true })
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [['Name', 'Email', 'Phone', 'Organisation', 'Registered'].map(esc).join(',')]
    for (const r of regs) lines.push([r.name, r.email, r.phone, r.organisation, when(r.created_at)].map(esc).join(','))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = `${form.slug || 'event'}-registrations.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!loaded) return <div className="page"><p className="muted">Loading…</p></div>

  return (
    <div className="page">
      <PageHead title={isNew ? 'New event' : form.title || 'Event'}>
        <Link className="btn btn-quiet" to="/events"><ArrowLeft aria-hidden="true" />All events</Link>
      </PageHead>
      <form className="panel panel-body form" onSubmit={save}>
        <Note kind="error">{error}</Note>
        <Note kind="ok">{flash}</Note>
        <div className="form-row">
          <Field label="Which site"><select className="select" value={form.site} onChange={set('site')}>{Object.entries(SITES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Title"><input className="input" required value={form.title} onChange={set('title')} /></Field>
          <Field label="Web address" hint="Part of the event's link."><input className="input" value={form.slug} onChange={set('slug')} /></Field>
        </div>
        <div className="form-row">
          <Field label="Starts"><input className="input" type="datetime-local" required value={form.starts_at} onChange={set('starts_at')} /></Field>
          <Field label="Ends" hint="Optional."><input className="input" type="datetime-local" value={form.ends_at} onChange={set('ends_at')} /></Field>
          <Field label="Location" hint="Venue, or “Online”."><input className="input" value={form.location} onChange={set('location')} /></Field>
        </div>
        <Field label="One-line summary"><input className="input" value={form.summary} onChange={set('summary')} maxLength={200} /></Field>
        <Field label="Details" hint="Shown on the event page. Blank lines separate paragraphs."><textarea className="textarea" value={form.body} onChange={set('body')} /></Field>
        <Group label="Cover image" hint="JPG, PNG or WebP, up to 4 MB.">
          <div className="images">
            {form.cover && <figure><img src={imageUrl(form.cover, 'content-images')} alt="" /><button type="button" aria-label="Remove cover" onClick={async () => { const c = form.cover; setForm((f) => ({ ...f, cover: '' })); await removeImage(c, 'content-images') }}><X /></button></figure>}
            {!form.cover && <label className="add"><input type="file" accept="image/*" onChange={onCover} disabled={busy} />{busy ? 'Uploading…' : 'Add cover'}</label>}
          </div>
        </Group>
        <div className="form-row">
          <label className="check"><input type="checkbox" checked={!!form.registration} onChange={set('registration')} />Take registrations on the site</label>
          <Field label="Capacity" hint="Optional. Registration closes when reached."><input className="input" type="number" min="1" value={form.capacity} onChange={set('capacity')} /></Field>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={busy}>{form.status === 'published' ? 'Save changes' : 'Save draft'}</button>
          {form.status !== 'published' && <button className="btn btn-primary" type="button" disabled={busy} onClick={(e) => save(e, 'published')}>Publish</button>}
          {form.status === 'published' && <button className="btn" type="button" disabled={busy} onClick={(e) => save(e, 'draft')}>Unpublish</button>}
          {!isNew && form.status !== 'cancelled' && <button className="btn" type="button" disabled={busy} onClick={(e) => save(e, 'cancelled')}>Mark cancelled</button>}
          {!isNew && <button className="btn btn-danger right" type="button" disabled={busy} onClick={remove}>Delete</button>}
        </div>
      </form>

      {!isNew && regs && (
        <div className="panel">
          <div className="panel-head"><h2>Registrations ({sheetEv ? sheetEv.count : regs.length}{form.capacity ? ` of ${form.capacity}` : ''})</h2>
            <div className="page-actions">
              {sheetEv && <a className="btn btn-sm btn-primary" href={tabLink(sheet, sheetEv)} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />View leads in Google Sheets</a>}
              {regs.length > 0 && <button type="button" className="btn btn-sm" onClick={exportCsv}><Download aria-hidden="true" />Download CSV</button>}
            </div></div>
          {sheetEv && <div className="panel-body small muted">{sheetEv.count} signup{sheetEv.count === 1 ? '' : 's'} recorded in the sheet for “{sheetEv.title || form.slug}”. {regs.length ? 'The rows below came through the site’s own form instead.' : ''}</div>}
          {regs.length === 0 ? (!sheetEv && <div className="empty">No one has registered yet.</div>) : (
            <div className="table-wrap"><table>
              <thead><tr><th>Name</th><th>Contact</th><th>Organisation</th><th>Registered</th></tr></thead>
              <tbody>{regs.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.email}<div className="muted small">{r.phone}</div></td><td className="muted">{r.organisation || '—'}</td><td className="muted small">{when(r.created_at)}</td></tr>)}</tbody>
            </table></div>)}
        </div>
      )}
    </div>
  )
}
