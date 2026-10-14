import { useEffect, useMemo, useReducer } from 'react'
import { CartCtx as Ctx } from './cartContext.js'

/* The cart holds product ids and quantities plus a display snapshot, so the
   page can render without refetching. Prices shown here are for display only:
   the server recomputes every total from the live catalogue at checkout. */
const KEY = 'viverst-shop:cart'

function load() { try { const v = JSON.parse(window.localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : [] } catch { return [] } }
function reducer(items, a) {
  switch (a.type) {
    case 'add': {
      const i = items.findIndex((x) => x.id === a.item.id)
      if (i >= 0) return items.map((x, j) => j === i ? { ...x, qty: Math.min(99, x.qty + (a.qty || 1)) } : x)
      return [...items, { ...a.item, qty: Math.min(99, a.qty || 1) }]
    }
    case 'set': return items.map((x) => x.id === a.id ? { ...x, qty: Math.max(1, Math.min(99, a.qty)) } : x)
    case 'remove': return items.filter((x) => x.id !== a.id)
    case 'clear': return []
    default: return items
  }
}
export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => { try { window.localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ } }, [items])
  const value = useMemo(() => ({
    items, dispatch,
    count: items.reduce((s, x) => s + x.qty, 0),
    subtotal: items.reduce((s, x) => s + x.qty * Number(x.price_kobo), 0),
    add: (p, qty = 1) => dispatch({ type: 'add', qty, item: { id: p.id, slug: p.slug, name: p.name, unit: p.unit, price_kobo: p.price_kobo, image: p.image } }),
    setQty: (id, qty) => dispatch({ type: 'set', id, qty }),
    remove: (id) => dispatch({ type: 'remove', id }),
    clear: () => dispatch({ type: 'clear' }),
  }), [items])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
