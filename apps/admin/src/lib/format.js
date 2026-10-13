const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })
export const money = (kobo) => naira.format((Number(kobo) || 0) / 100)
export const toKobo = (nairaText) => Math.round(parseFloat(String(nairaText).replace(/[^\d.]/g, '')) * 100) || 0
export const fromKobo = (kobo) => ((Number(kobo) || 0) / 100).toFixed(2)
export const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
export const when = (iso) => iso ? new Date(iso).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
export const day = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : ''
