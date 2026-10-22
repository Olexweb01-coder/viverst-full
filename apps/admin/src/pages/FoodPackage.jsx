import { useEffect, useState } from 'react'
import { ImagePlus, Plus, Trash2, ArrowUpRight } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { fromKobo, toKobo, money } from '../lib/format.js'
import { useAuth, useFlash } from '../lib/hooks.js'
import { imageUrl, uploadImage } from '../lib/images.js'
import { PageHead, Note, Field, Group } from '../components/ui.jsx'
import flyer from '@brand-assets/agro/img/food-package-december.webp'

const PAGE_URL = 'https://shopagro.viverst.com/foodpackage'

/* The December Food Package, as on the flyer. Shown here until the first save,
   and the same content the shop falls back to and migration 018 stores. */
const FOOD_PACKAGE_DEFAULT = {
  title: 'December Food Package',
  short: 'DFP',
  intro: 'Rice, a live chicken, groundnut oil and eggs, packed together for the festive season. Choose your package and book it on WhatsApp.',
  season_note: 'This offer is for December. Food packages are still available after December, so message us for the current packages.',
  instalment: true,
  instalment_note: 'Instalment payment available. Ask us how when you book.',
  image: '',
  image_alt: 'December Food Package from Viverst Agro: a bag of Viverst Agro rice, groundnut oil and a live chicken, with a smiling man in a Santa hat holding a DFP box.',
  home_card: true,
  checkout: false,
  packages: [
    { name: 'Merry Package', price_kobo: 4999900, product_slug: '',
      items: ['10 kg of rice', '1 live chicken', 'Groundnut oil (1 L)', 'Half crate of eggs'] },
    { name: 'Jolly Package', price_kobo: 7499900, product_slug: '',
      items: ['Half bag of rice (25 kg)', '1 live chicken', 'Groundnut oil (2 L)', '1 crate of eggs'] },
    { name: 'Berekete Package', price_kobo: 12499900, product_slug: '',
      items: ['Full bag of rice (50 kg)', '1 live chicken', 'Groundnut oil (5 L)', '1 crate of eggs'] },
  ],
}

/* saved row → form: prices as naira text, contents one per line */
const toForm = (v) => {
  const s = { ...FOOD_PACKAGE_DEFAULT, ...(v || {}) }
  const packages = Array.isArray(s.packages) && s.packages.length ? s.packages : FOOD_PACKAGE_DEFAULT.packages
  return { ...s, packages: packages.map((p) => ({ name: p.name || '', price: fromKobo(p.price_kobo), product_slug: p.product_slug || '', items: (p.items || []).join('\n') })) }
}

export default function FoodPackage() {
  const { staff } = useAuth()
  const canEdit = staff?.role === 'owner' || staff?.role === 'manager'
  const [f, setF] = useState(null)
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [flash, setFlash] = useFlash()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.from('settings').select('key, value').eq('key', 'food_package')
      if (!alive) return
      if (error) { setError(error.message); return }
      setF(toForm(data?.[0]?.value))
      const { data: list } = await supabase.from('products').select('slug, name, unit, price_kobo, active').order('name')
      if (alive) setProducts((list || []).filter((p) => p.active !== false))
    })()
    return () => { alive = false }
  }, [])

  const set = (key) => (e) => setF((o) => ({ ...o, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setP = (i, key) => (e) => setF((o) => ({ ...o, packages: o.packages.map((p, j) => j === i ? { ...p, [key]: e.target.value } : p) }))
  const addPackage = () => setF((o) => ({ ...o, packages: [...o.packages, { name: '', price: '', product_slug: '', items: '' }] }))
  const removePackage = (i) => setF((o) => ({ ...o, packages: o.packages.filter((_, j) => j !== i) }))

  async function onImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Choose an image file: JPG, PNG or WebP.'); return }
    if (file.size > 4 * 1024 * 1024) { setError('That image is over 4 MB. Save it smaller and try again.'); return }
    setBusy(true); setError('')
    try {
      const path = await uploadImage(file, 'food-package')
      setF((o) => ({ ...o, image: path }))
      setFlash('Image uploaded. Save to put it on the page.')
    } catch (err) { setError(err.message || 'The upload failed.') }
    setBusy(false)
  }

  async function save() {
    setError(''); setWarn('')
    const packages = f.packages
      .map((p) => ({ name: p.name.trim(), price_kobo: toKobo(p.price), product_slug: p.product_slug, items: p.items.split('\n').map((x) => x.trim()).filter(Boolean) }))
      .filter((p) => p.name || p.price_kobo || p.items.length)
    if (!f.title.trim()) { setError('Give the offer a title.'); return }
    if (!packages.length) { setError('Add at least one package.'); return }
    const bad = packages.find((p) => !p.name || p.price_kobo <= 0)
    if (bad) { setError(`Each package needs a name and a price${bad.name ? `: check “${bad.name}”` : ''}.`); return }
    if (f.checkout && !packages.some((p) => p.product_slug)) { setError('Online checkout is on, but no package is linked to a shop product. Link at least one, or turn checkout off.'); return }
    const value = {
      title: f.title.trim(), short: f.short.trim(), intro: f.intro.trim(), season_note: f.season_note.trim(),
      instalment: !!f.instalment, instalment_note: f.instalment_note.trim(),
      image: f.image || '', image_alt: f.image_alt.trim(),
      home_card: !!f.home_card, checkout: !!f.checkout, packages,
    }
    setBusy(true)
    const { error } = await supabase.from('settings').upsert({ key: 'food_package', value }, { onConflict: 'key' })
    if (error) { setBusy(false); setError(error.message); return }
    // the shop reads through public_settings; until migration 018 runs it cannot see this row
    const { data: seen } = await supabase.from('public_settings').select('key').eq('key', 'food_package')
    setBusy(false)
    if (!seen?.length) setWarn('Saved, but the shop cannot see it yet. Run supabase/migrations/018_food_package.sql once in Supabase → SQL Editor, then refresh the shop.')
    else setFlash('Saved. The food package page is updated.')
  }

  if (!f) return <div className="page"><PageHead title="Food package" /><Note kind="error">{error}</Note>{!error && <p className="muted">Loading…</p>}</div>

  const linked = (slug) => products.find((p) => p.slug === slug)

  return (
    <div className="page">
      <PageHead title="Food package"
        lede={canEdit ? 'The food package page in the shop, and its card on the shop homepage.' : 'Only owners and managers can change the food package.'}>
        <a className="btn btn-sm" href={PAGE_URL} target="_blank" rel="noopener noreferrer">Open the page <ArrowUpRight size={14} aria-hidden="true" /></a>
      </PageHead>
      <Note kind="error">{error}</Note>
      <Note kind="info">{warn}</Note>
      <Note kind="ok">{flash}</Note>
      <fieldset disabled={!canEdit || busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>

        <section className="panel">
          <div className="panel-head"><h2>Offer</h2><button type="button" className="btn btn-sm" onClick={save}>Save</button></div>
          <div className="panel-body form">
            <label className="check"><input type="checkbox" checked={!!f.home_card} onChange={set('home_card')} />Show the card on the shop homepage</label>
            <Field label="Title" hint="The page heading, e.g. December Food Package."><input className="input" value={f.title} onChange={set('title')} /></Field>
            <Field label="Short name" hint="Shown small above the title, e.g. DFP."><input className="input" value={f.short} onChange={set('short')} /></Field>
            <Field label="Introduction" hint="One or two sentences under the title."><textarea className="input" rows={3} value={f.intro} onChange={set('intro')} /></Field>
            <Field label="Season note" hint="When the offer runs and what happens after. Leave empty to hide it."><textarea className="input" rows={2} value={f.season_note} onChange={set('season_note')} /></Field>
            <label className="check"><input type="checkbox" checked={!!f.instalment} onChange={set('instalment')} />Instalment payment available</label>
            {f.instalment && <Field label="Instalment note"><input className="input" value={f.instalment_note} onChange={set('instalment_note')} /></Field>}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Image</h2><button type="button" className="btn btn-sm" onClick={save}>Save</button></div>
          <div className="panel-body form">
            <Group label="Flyer" hint="Square works best. JPG, PNG or WebP, up to 4 MB.">
              <div className="images">
                <figure><img src={f.image ? imageUrl(f.image) : flyer} alt="" /></figure>
                <label className="add"><input type="file" accept="image/*" onChange={onImage} disabled={busy} /><ImagePlus aria-hidden="true" />{busy ? 'Uploading…' : 'Replace image'}</label>
              </div>
              {f.image && <button type="button" className="btn btn-sm" onClick={() => setF((o) => ({ ...o, image: '' }))}>Use the original December flyer</button>}
            </Group>
            <Field label="Image description" hint="Read aloud by screen readers. Say what the picture shows."><textarea className="input" rows={2} value={f.image_alt} onChange={set('image_alt')} /></Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Packages</h2><button type="button" className="btn btn-sm" onClick={save}>Save</button></div>
          <div className="panel-body form">
            {f.packages.map((p, i) => {
              const prod = linked(p.product_slug)
              const mismatch = f.checkout && prod && toKobo(p.price) !== Number(prod.price_kobo)
              return (
                <Group key={i} label={p.name || `Package ${i + 1}`}>
                  <Field label="Name"><input className="input" value={p.name} onChange={setP(i, 'name')} /></Field>
                  <Field label="Price (₦)"><input className="input" inputMode="decimal" value={p.price} onChange={setP(i, 'price')} /></Field>
                  <Field label="What’s in it" hint="One item per line."><textarea className="input" rows={4} value={p.items} onChange={setP(i, 'items')} /></Field>
                  <Field label="Shop product for online payment" hint="Only used when online checkout is on. Create the package as a product first, under Products.">
                    <select className="input" value={p.product_slug} onChange={setP(i, 'product_slug')}>
                      <option value="">Not linked: WhatsApp booking only</option>
                      {products.map((x) => <option key={x.slug} value={x.slug}>{x.name} · {money(x.price_kobo)}</option>)}
                    </select>
                  </Field>
                  {mismatch && <Note kind="info">The linked product costs {money(prod.price_kobo)}, not {money(toKobo(p.price))}. Online, customers pay the product’s price, so the page shows that. Make them match.</Note>}
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removePackage(i)} disabled={f.packages.length <= 1}>
                    <Trash2 size={14} aria-hidden="true" /> Remove this package
                  </button>
                </Group>
              )
            })}
            <button type="button" className="btn btn-sm" onClick={addPackage}><Plus size={14} aria-hidden="true" /> Add a package</button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head"><h2>Booking</h2><button type="button" className="btn btn-sm" onClick={save}>Save</button></div>
          <div className="panel-body form">
            <label className="check"><input type="checkbox" checked={!!f.checkout} onChange={set('checkout')} />Let customers buy online through the shop checkout</label>
            <p className="muted">On: a package linked to a shop product that is in stock shows Buy now, which goes to the checkout and Paystack, and the order arrives in Orders. Its WhatsApp button is then only for paying in instalments (shown while “Instalment payment available” is ticked).</p>
            <p className="muted">A package that cannot be bought online (checkout off, not linked, or sold out) shows Book on WhatsApp instead. WhatsApp messages go to the number in Settings, or +234 906 034 2734 when that is empty.</p>
          </div>
        </section>
      </fieldset>
    </div>
  )
}
