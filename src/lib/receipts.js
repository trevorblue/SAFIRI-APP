import { supabase } from './supabase'

const BUCKET = 'receipts'

export async function uploadReceipt(file, expenseId, tripId) {
  if (!supabase || !file) return null
  const ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
  const path = `${tripId}/${expenseId}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) { console.error('uploadReceipt:', error); return null }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl ?? null
}

export async function deleteReceipt(receiptUrl) {
  if (!supabase || !receiptUrl) return
  try {
    const url  = new URL(receiptUrl)
    const path = url.pathname.split(`/${BUCKET}/`)[1]
    if (path) await supabase.storage.from(BUCKET).remove([path])
  } catch {
    // ignore — URL may already be invalid
  }
}
