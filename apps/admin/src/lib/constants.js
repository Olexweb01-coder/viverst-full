export const SITES = { main: 'Viverst Global', agro: 'Viverst Agro', studio: 'Viverst Studio' }
export const ARMS = { global: 'Viverst Global', agro: 'Agro', studio: 'Studio' }
export const ROLES = [
  ['owner', 'Owner — everything, including staff and payment keys'],
  ['manager', 'Manager — orders, stock, products, events, content, settings'],
  ['editor', 'Editor — orders, stock, products, events, content'],
  ['writer', 'Writer — blog, automation and the assistant only'],
]
export const OPS_ROLES = ['owner', 'manager', 'editor']
export const isOps = (role) => OPS_ROLES.includes(role)
