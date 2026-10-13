import { supabase } from './supabase.js'
import { IMAGE_BUCKET } from './config.js'

/* images are stored as paths inside a bucket; the sites turn them into public
   URLs at render time, so moving a bucket never breaks data. */
export const imageUrl = (path, bucket = IMAGE_BUCKET) => path?.startsWith('http') ? path : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

export async function uploadImage(file, folder = 'products', bucket = IMAGE_BUCKET) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false })
  if (error) throw error
  return path
}

export async function removeImage(path, bucket = IMAGE_BUCKET) {
  if (!path || path.startsWith('http')) return
  await supabase.storage.from(bucket).remove([path])
}
