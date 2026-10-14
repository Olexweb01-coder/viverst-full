/* The shop shows these stock photos for starter products that have no photo
   of their own yet; the admin shows the same, tagged, so what you see here
   matches what customers see. Uploading a real photo replaces it everywhere. */
import maize from '@brand-assets/agro/img/product-maize.webp'
import soybeans from '@brand-assets/agro/img/product-soybeans.webp'
import rice from '@brand-assets/agro/img/product-rice.webp'
import cassava from '@brand-assets/agro/img/product-cassava.webp'
import palm from '@brand-assets/agro/img/product-palm-oil.webp'
import chilli from '@brand-assets/agro/img/product-chilli.webp'
import seed from '@brand-assets/agro/img/product-seed.webp'

const BY_SLUG = {
  'yellow-maize': maize, soybeans, 'parboiled-rice': rice, 'cassava-flour': cassava,
  'red-palm-oil': palm, 'dried-chilli': chilli, 'improved-maize-seed': seed,
}
export const stockPhoto = (slug) => BY_SLUG[slug] || null
