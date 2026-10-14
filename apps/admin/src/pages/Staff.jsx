import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { day } from '../lib/format.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { PageHead, Note, Field } from '../components/ui.jsx'
import { ROLES } from '../lib/constants.js'


export default function Staff() {
  const { staff: me } = useAuth()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('editor')

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('staff').select('user_id, email, name, role, active, created_at').order('created_at')
    if (error) setError(error.message); else setRows(data)
  }, [])
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t) }, [load])

  async function add(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const { error } = await supabase.rpc('add_staff', { p_email: email.trim(), p_name: name.trim(), p_role: role })
    setBusy(false)
    if (error) { setError(error.message); return }
    setEmail(''); setName(''); setRole('editor'); setFlash('Added.'); load()
  }

  async function setRow(user_id, patch, msg) {
    setBusy(true); setError('')
    const { error } = await supabase.from('staff').update(patch).eq('user_id', user_id)
    setBusy(false)
    if (error) setError(error.message); else { setFlash(msg); load() }
  }

  if (me?.role !== 'owner') return <div className="page"><PageHead title="Staff" /><Note kind="info">Only the owner can manage staff.</Note></div>

  return (
    <div className="page">
      <PageHead title="Staff" lede="Who can sign in to the admin and what they can change." />
      <Note kind="error">{error}</Note>
      <Note kind="ok">{flash}</Note>

      <form className="panel" onSubmit={add}>
        <div className="panel-head"><h2>Add someone</h2></div>
        <div className="panel-body form">
          <p className="muted small">They need a Supabase account first: create it under Authentication → Users (tick “Auto confirm”), then add the same email here.</p>
          <div className="form-row">
            <Field label="Email"><input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Role"><select className="select" value={role} onChange={(e) => setRole(e.target.value)}>{ROLES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          </div>
          <div className="form-actions"><button className="btn btn-primary" type="submit" disabled={busy}>Add to staff</button></div>
        </div>
      </form>

      {rows && (
        <div className="panel"><div className="table-wrap"><table>
          <thead><tr><th>Person</th><th>Role</th><th>Since</th><th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.user_id} data-status={r.active ? undefined : 'inactive'}>
              <td><strong>{r.name}</strong><div className="muted small">{r.email}{r.user_id === me.user_id ? ' · you' : ''}</div></td>
              <td>
                <select className="select" aria-label={`Role for ${r.email}`} value={r.role} disabled={busy || r.user_id === me.user_id} onChange={(e) => setRow(r.user_id, { role: e.target.value }, 'Role changed.')}>
                  {ROLES.map(([k]) => <option key={k} value={k}>{k}</option>)}
                </select>
              </td>
              <td className="muted small">{day(r.created_at)}</td>
              <td>{r.user_id !== me.user_id && (
                r.active
                  ? <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => setRow(r.user_id, { active: false }, 'Access removed.')}>Remove access</button>
                  : <button type="button" className="btn btn-sm" disabled={busy} onClick={() => setRow(r.user_id, { active: true }, 'Access restored.')}>Restore</button>)}
              </td>
            </tr>))}</tbody>
        </table></div></div>
      )}
    </div>
  )
}
