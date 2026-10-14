/* Mirrors public.delivery_fee() so the shop can show the fee as the customer
   fills in their address. The server recomputes it when the order is placed;
   this is only for display. */
export function deliveryFee(d, state, area) {
  if (!d) return 0
  if (d.mode !== 'zones') return Number(d.flat_fee_kobo) || 0
  const norm = (x) => String(x || '').trim().toLowerCase()
  if (norm(state) === norm(d.home_state)) {
    const hit = (d.areas || []).find((a) => norm(a.name) === norm(area))
    return Number(hit ? hit.fee_kobo : d.home_default_kobo) || 0
  }
  const own = d.state_fees?.[String(state || '').trim()]
  return Number(own ?? d.outside_default_kobo) || 0
}
export const zoned = (d) => d?.mode === 'zones'
