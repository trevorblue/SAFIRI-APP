import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fetchTripForJoin, joinTripById } from '../lib/db'

function fmtRange(start, end) {
  try {
    const s = format(new Date(start), 'd MMM')
    const e = end ? format(new Date(end), 'd MMM yyyy') : ''
    return e ? `${s} – ${e}` : s
  } catch {
    return ''
  }
}

export default function JoinTrip({ tripId, onDone }) {
  const [trip, setTrip]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [name, setName]       = useState('')
  const [joining, setJoining] = useState(false)
  const [result, setResult]   = useState(null) // { tripName, destination } on success
  const [err, setErr]         = useState(null)
  const [declined, setDeclined] = useState(false)

  useEffect(() => {
    fetchTripForJoin(tripId).then(data => {
      setTrip(data)
      setLoading(false)
    })
  }, [tripId])

  async function handleJoin() {
    if (!name.trim() || joining) return
    setJoining(true)
    const res = await joinTripById(tripId, name.trim())
    setJoining(false)
    if (res?.error) {
      setErr(res.error)
    } else {
      setResult(res)
    }
  }

  function waMessage() {
    const dest = result?.destination || result?.tripName || 'the trip'
    return encodeURIComponent(
      `Hey! I just joined the ${result?.tripName} group on Safiri — see you in ${dest}! 🇰🇪`
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[390px]">
        <AnimatePresence mode="wait">

          {/* Loading */}
          {loading && (
            <motion.div key="loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-[var(--color-muted)] text-sm">Loading trip…</p>
            </motion.div>
          )}

          {/* Trip not found */}
          {!loading && !trip && (
            <motion.div key="notfound"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-[var(--color-text)] font-semibold text-lg mb-2">Trip not found</p>
              <p className="text-[var(--color-muted)] text-sm mb-8">
                This invite link may have expired or the trip is no longer active.
              </p>
              <motion.button onClick={onDone}
                className="px-6 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium"
                whileTap={{ scale: 0.96 }}>
                Go back
              </motion.button>
            </motion.div>
          )}

          {/* Success */}
          {result && (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <motion.p
                className="text-6xl mb-4"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
              >
                🎉
              </motion.p>
              <p className="text-[var(--color-text)] font-bold text-2xl mb-1">
                You're in, {name}!
              </p>
              <p className="text-[var(--color-muted)] text-sm mb-8">
                You've been added to <span className="text-[var(--color-text)] font-medium">{result.tripName}</span>.<br />
                The trip organiser can now see you in the group.
              </p>

              <a
                href={`https://wa.me/?text=${waMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#25D366] text-white font-semibold text-base mb-3"
              >
                <span className="text-xl">📲</span>
                Tell the group on WhatsApp
              </a>

              <motion.button onClick={onDone}
                className="w-full py-3 rounded-2xl text-[var(--color-muted)] text-sm font-medium"
                whileTap={{ scale: 0.96 }}>
                Done
              </motion.button>
            </motion.div>
          )}

          {/* Maybe later */}
          {declined && (
            <motion.div key="declined"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <p className="text-5xl mb-4">👋</p>
              <p className="text-[var(--color-text)] font-bold text-xl mb-2">No problem!</p>
              <p className="text-[var(--color-muted)] text-sm mb-8 max-w-[260px] mx-auto">
                This link still works anytime. Just open it again when you're ready to join.
              </p>
              <motion.button onClick={onDone}
                className="w-full py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium"
                whileTap={{ scale: 0.96 }}>
                Close
              </motion.button>
            </motion.div>
          )}

          {/* Join form */}
          {!loading && trip && !result && !declined && (
            <motion.div key="form"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              {/* Trip card */}
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 mb-6">
                <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-1">
                  You're invited
                </p>
                <h2 className="text-[var(--color-text)] text-2xl font-bold mb-0.5">{trip.name}</h2>
                {trip.destination && (
                  <p className="text-[var(--color-muted)] text-sm mb-3">{trip.destination}</p>
                )}
                <div className="flex gap-3">
                  {trip.startDate && (
                    <div className="bg-[var(--color-surface-2)] rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">Dates</p>
                      <p className="text-[var(--color-text)] text-xs font-semibold">
                        {fmtRange(trip.startDate, trip.endDate)}
                      </p>
                    </div>
                  )}
                  {trip.budgetPerPerson > 0 && (
                    <div className="bg-[var(--color-surface-2)] rounded-xl px-3 py-2 text-center flex-1">
                      <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">Budget</p>
                      <p className="text-[var(--color-text)] text-xs font-semibold">
                        KES {Number(trip.budgetPerPerson).toLocaleString()} / person
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Name input */}
              <div className="mb-4">
                <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="e.g. Kevin"
                  className="input-field text-lg"
                  autoFocus
                />
              </div>

              {err && (
                <p className="text-[var(--color-danger)] text-sm mb-3">{err}</p>
              )}

              <motion.button
                onClick={handleJoin}
                disabled={!name.trim() || joining}
                className="w-full py-4 rounded-2xl font-semibold text-base mb-3"
                style={{
                  backgroundColor: name.trim() ? 'var(--color-primary)' : 'var(--color-surface-3)',
                  color:           name.trim() ? 'var(--color-bg)'      : 'var(--color-muted)',
                }}
                whileTap={name.trim() ? { scale: 0.96 } : {}}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {joining ? 'Joining…' : 'Join trip'}
              </motion.button>

              <motion.button onClick={() => setDeclined(true)}
                className="w-full py-3 rounded-2xl text-[var(--color-muted)] text-sm font-medium"
                whileTap={{ scale: 0.96 }}>
                Maybe later
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
