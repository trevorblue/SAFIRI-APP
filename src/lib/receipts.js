import { supabase } from './supabase'

const BUCKET = 'receipts'

export async function uploadReceipt(file, expenseId, tripId) {
  if (!supabase || !file) return null
  const ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
  const path = `${tripId}/${expenseId}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) { console.error('uploadReceipt:', error); return null }
  return path  // store path, not a public URL
}

export async function getReceiptSignedUrl(pathOrUrl, expiresIn = 3600) {
  if (!supabase || !pathOrUrl) return null
  // Handle legacy full URLs stored before this change
  if (pathOrUrl.startsWith('http')) return pathOrUrl
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, expiresIn)
  if (error) { console.error('getReceiptSignedUrl:', error); return null }
  return data.signedUrl
}

export async function deleteReceipt(pathOrUrl) {
  if (!supabase || !pathOrUrl) return
  const path = pathOrUrl.startsWith('http')
    ? (() => { try { return new URL(pathOrUrl).pathname.split(`/${BUCKET}/`)[1] } catch { return null } })()
    : pathOrUrl
  if (path) await supabase.storage.from(BUCKET).remove([path])
}
