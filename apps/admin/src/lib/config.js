/* The publishable key is designed to ship inside the app: it can only do what
   the database's row-level rules allow. Secrets never live here. */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://puuouftwclqkrrnnzkay.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_4g1ggURteogjrNMHtLx0NA_eY1K6yjD'
export const IMAGE_BUCKET = 'product-images'
