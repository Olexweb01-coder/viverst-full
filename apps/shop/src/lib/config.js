export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://puuouftwclqkrrnnzkay.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4g1ggURteogjrNMHtLx0NA_eY1K6yjD'
export const IMAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/product-images/`
export const SHOP = {
  name: 'Viverst Agro Shop',
  parent: 'Viverst Agro', parentUrl: 'https://agro.viverst.com',
  group: 'Viverst Global Limited', groupUrl: 'https://www.viverst.com',
  email: 'agro@viverst.com', city: 'Lagos', country: 'Nigeria',
}
/* The shop is Viverst Agro's, so it links to Agro's profiles. */
export const SOCIALS = [
  { network: 'instagram', url: 'https://www.instagram.com/viverstagro/' },
  { network: 'facebook', url: 'https://www.facebook.com/viverstagro/' },
  { network: 'linkedin', url: 'https://www.linkedin.com/company/viverstagro/' },
]
