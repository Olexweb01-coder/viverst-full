const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
export const money = (kobo) => naira.format((Number(kobo) || 0) / 100)
