import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImagePlus, X } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fromKobo, toKobo, slugify } from '../lib/format.js'
import { imageUrl, uploadImage, removeImage } from '../lib/images.js'
import { PageHead, Note, Field } from '../components/ui.jsx'
import { useFlash } from '../lib/hooks.js'

const BLANK = { name: '', slug: '', category_id: '', summary: '', description: '', unit: '', price: '', compare_at: '', images: [], active: false, featured: false, sort: 0 }

/* keyed by id so moving from one product to another (or to “new”) always
   starts from a clean form instead of reusing the previous one's state */
export default function ProductEdit() {
  const { id } = useParams()
  return <Editor key={id ?? 'new'} id={id} />
}

function Editor({ id }) {
  const isNew = !id
  const nav = useNavigate()
  const [form, setForm] = useState(BLANK)
  const [cats, setCats] = useState([])
  const [loaded, setLoaded] = useState(isNew)
  const [error, setError] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)
  const [newCat, setNewCat] = useState('')
  const slugTouched = useRef(false)

  useEffect(() => {
    let alive = true
    supabase.from('product_categories').select('id, name').order('sort').order('name')
      .then(({ data }) => { if (alive && data) setCats(data) })
    if (!isNew) {
      supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
        if (!alive) return
        if (error || !data) { setError(error?.message || 'That product no longer exists.'); setLoaded(true); return }
        setForm({
          name: data.name, slug: data.slug, category_id: data.category_id || '', summary: data.summary, description: data.description,
          unit: data.unit, price: fromKobo(data.price_kobo), compare_at: data.compare_at_kobo == null ? '' : fromKobo(data.compare_at_kobo),
          images: data.images || [], active: data.active, featured: data.featured, sort: data.sort,
        })
        slugTouched.current = true
        setLoaded(true)
      })
    }
    return () => { alive = false }
  }, [id, isNew])

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === 'name' && !slugTouched.current) next.slug = slugify(v)
      if (k === 'slug') slugTouched.current = true
      return next
    })
  }

  async function addCategory() {
    const name = newCat.trim()
    if (!name) return
    const { data, error } = await supabase.from('product_categories').insert({ name, slug: slugify(name) }).select('id, name').single()
    if (error) { setError(error.message); return }
    setCats((c) => [...c, data]); setForm((f) => ({ ...f, category_id: data.id })); setNewCat('')
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true); setError('')
    try {
      const paths = []
      for (const f of files) {
        if (f.size > 4 * 1024 * 1024) throw new Error(`${f.name} is over 4 MB. Resize it and try again.`)
        paths.push(await uploadImage(f))
      }
      setForm((f) => ({ ...f, images: [...f.images, ...paths] }))
    } catch (err) { setError(err.message) }
    setBusy(false)
  }

  async function dropImage(path) {
    setForm((f) => ({ ...f, images: f.images.filter((p) => p !== path) }))
    await removeImage(path)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true); setError('')
    const row = {
      name: form.name.trim(), slug: slugify(form.slug || form.name), category_id: form.category_id || null,
      summary: form.summary.trim(), description: form.description, unit: form.unit.trim(),
      price_kobo: toKobo(form.price), compare_at_kobo: form.compare_at === '' ? null : toKobo(form.compare_at),
      images: form.images, active: form.active, featured: form.featured, sort: Number(form.sort) || 0,
    }
    if (!row.name) { setError('Give the product a name.'); setBusy(false); return }
    if (row.price_kobo <= 0) { setError('Price must be more than ₦0.'); setBusy(false); return }
    const q = isNew ? supabase.from('products').insert(row).select('id').single() : supabase.from('products').update(row).eq('id', id).select('id').single()
    const { data, error } = await q
    setBusy(false)
    if (error) { setError(error.code === '23505' ? 'Another product already uses that web address (slug). Change it.' : error.message); return }
    if (isNew) nav(`/products/${data.id}`, { replace: true })
    setFlash('Saved.')
  }

  async function remove() {
    if (!window.confirm(`Delete “${form.name}”? Past orders keep their copy of it.`)) return
    setBusy(true)
    const { error } = await supabase.from('products').delete().eq('id', id)
    setBusy(false)
    if (error) { setError(error.message); return }
    nav('/products', { replace: true })
  }

  if (!loaded) return <div className="page"><p className="muted">Loading…</p></div>

  return (
    <div className="page">
      <PageHead title={isNew ? 'New product' : form.name || 'Product'}>
        <Link className="btn btn-quiet" to="/products"><ArrowLeft aria-hidden="true" />All products</Link>
      </PageHead>

      <form className="panel panel-body form" onSubmit={save}>
        <Note kind="error">{error}</Note>
        <Note kind="ok">{flash}</Note>

        <div className="form-row">
          <Field label="Name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Web address" hint="Part of the product's link in the shop. Letters, numbers and dashes.">
            <input className="input" value={form.slug} onChange={set('slug')} />
          </Field>
        </div>

        <div className="form-row">
          <Field label="Category">
            <select className="select" value={form.category_id} onChange={set('category_id')}>
              <option value="">No category</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Add a category" hint="Type a name and press Add.">
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }} />
              <button type="button" className="btn" onClick={addCategory} disabled={!newCat.trim()}>Add</button>
            </div>
          </Field>
        </div>

        <div className="form-row">
          <Field label="Sold as" hint="What one unit is: “50 kg bag”, “5 L keg”, “crate of 12”.">
            <input className="input" required value={form.unit} onChange={set('unit')} />
          </Field>
          <Field label="Price per unit">
            <div className="input-prefix"><span>₦</span><input inputMode="decimal" required value={form.price} onChange={set('price')} /></div>
          </Field>
          <Field label="Was price" hint="Optional. Shown struck through next to the price.">
            <div className="input-prefix"><span>₦</span><input inputMode="decimal" value={form.compare_at} onChange={set('compare_at')} /></div>
          </Field>
        </div>

        <Field label="One-line summary" hint="Shows under the name in lists. Keep it to a sentence.">
          <input className="input" value={form.summary} onChange={set('summary')} maxLength={160} />
        </Field>
        <Field label="Description" hint="Shown on the product's own page.">
          <textarea className="textarea" value={form.description} onChange={set('description')} />
        </Field>

        <Field label="Photos" hint="First photo is the main one. JPG, PNG or WebP, up to 4 MB each.">
          <div className="images">
            {form.images.map((p) => (
              <figure key={p}><img src={imageUrl(p)} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => dropImage(p)}><X /></button></figure>))}
            <label className="add"><input type="file" accept="image/*" multiple onChange={onFiles} disabled={busy} /><ImagePlus aria-hidden="true" />{busy ? 'Uploading…' : 'Add photos'}</label>
          </div>
        </Field>

        <div className="form-row">
          <label className="check"><input type="checkbox" checked={form.active} onChange={set('active')} />Show in the shop</label>
          <label className="check"><input type="checkbox" checked={form.featured} onChange={set('featured')} />Feature on the shop’s front page</label>
          <Field label="Order in lists" hint="Lower numbers come first."><input className="input" type="number" value={form.sort} onChange={set('sort')} /></Field>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}</button>
          {!isNew && <button className="btn btn-danger right" type="button" onClick={remove} disabled={busy}>Delete</button>}
        </div>
      </form>
    </div>
  )
}
