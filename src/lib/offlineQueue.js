import { syncExpenseAction, syncMemberAction } from './db'

const QUEUE_KEY = 'safiri_sync_queue'

function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') }
  catch { return [] }
}

function saveQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

export function enqueueAction(action, tripId) {
  const q = getQueue()
  q.push({ action, tripId, queuedAt: Date.now() })
  saveQueue(q)
}

export function getQueueLength() {
  return getQueue().length
}

export async function flushQueue() {
  const q = getQueue()
  if (q.length === 0) return 0

  const failed = []
  for (const item of q) {
    try {
      const { action, tripId } = item
      if (['ADD_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(action.type)) {
        await syncExpenseAction(action, tripId)
      } else if (['ADD_MEMBER', 'UPDATE_MEMBER', 'REMOVE_MEMBER'].includes(action.type)) {
        await syncMemberAction(action, tripId)
      }
    } catch {
      failed.push(item)
    }
  }

  saveQueue(failed)
  return q.length - failed.length
}
