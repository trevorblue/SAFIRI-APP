import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { formatKES, ACTIVITY_LIBRARY, AREA_COLORS } from '../lib/constants'

// ── Encode / decode ──────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function encodeSharePayload(state, computed) {
  const payload = {
    v: 1,
    trip: state.trip,
    members: computed.confirmedMembers.map(m => ({ name: m.name })),
    budget: {
      total:     computed.totalBudget,
      spent:     computed.totalSpent,
      remaining: computed.totalRemaining,
      pct:       computed.spentPercent,
    },
    itinerary: state.itinerary,
    ts: Date.now(),
  }
  return btoa(encodeURIComponent(JSON.stringify(payload)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decodeSharePayload(str) {
  try {
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice((b64.length + 3) % 4)
    return JSON.parse(decodeURIComponent(atob(padded)))
  } catch {
    return null
  }
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function ShareView() {
  const [searchParams] = useSearchParams()
  const encoded = searchParams.get('d')
  const data    = useMemo(() => encoded ? decodeSharePayload(encoded) : null, [encoded])

  const [activeDate, setActiveDate] = useState(null)

  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 gap-4">
        <span className="text-5xl">🔗</span>
        <p className="text-[var(--color-text)] font-semibold text-lg text-center">Invalid or expired link</p>
        <p className="text-[var(--color-muted)] text-sm text-center">Ask your trip treasurer to share a new link.</p>
      </div>
    )
  }

  const { trip, members, budget, itinerary, ts } = data
  const start = parseISO(trip.startDate)
  const end   = parseISO(trip.endDate)
  const tripDays = differenceInCalendarDays(end, start) + 1

  const alertLevel =
    budget.pct >= 0.9 ? 'danger' :
    budget.pct >= 0.75 ? 'warning' : null

  const remainingColor =
    alertLevel === 'danger' ? 'text-[var(--color-danger)]' :
    alertLevel === 'warning' ? 'text-[var(--color-warning)]' :
    'text-[var(--color-success)]'

  const barColor =
    alertLevel === 'danger' ? 'var(--color-danger)' :
    alertLevel === 'warning' ? 'var(--color-warning)' :
    'var(--color-primary)'

  const dates    = [...new Set(itinerary.map(i => i.date))].sort()
  const today    = format(new Date(), 'yyyy-MM-dd')
  const selectedDate = activeDate ?? (dates.find(d => d >= today) ?? dates[0] ?? trip.startDate)

  const dayItems = itinerary
    .filter(i => i.date === selectedDate)
    .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'))

  // eslint-disable-next-line react-hooks/purity
  const snapshotAge = ts ? Math.round((Date.now() - ts) / 60000) : null

  return (
    <div className="min-h-full bg-[var(--color-bg)] pb-8">
      {/* Read-only banner */}
      <div className="bg-[var(--color-primary-dim)] border-b border-[color:var(--color-primary)]/20 px-5 py-2 flex items-center justify-between">
        <span className="text-[var(--color-primary)] text-xs font-semibold">👁 Read-only group view</span>
        {snapshotAge !== null && (
          <span className="text-[var(--color-muted)] text-[10px]">
            {snapshotAge < 1 ? 'just now' : snapshotAge < 60 ? `${snapshotAge}m ago` : `${Math.round(snapshotAge / 60)}h ago`}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-1">{trip.name}</p>
        <h1 className="text-[var(--color-text)] text-2xl font-bold mb-0.5">{trip.destination}</h1>
        <p className="text-[var(--color-muted)] text-sm">
          {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')} · {tripDays}d
        </p>
      </div>

      {/* Budget card */}
      <div className="mx-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 mb-4">
        <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-2">Remaining</p>
        <p className={`text-4xl font-bold tracking-tight mb-1 ${remainingColor}`}>
          {formatKES(budget.remaining)}
        </p>
        <p className="text-[var(--color-muted)] text-sm mb-3">
          of {formatKES(budget.total)} · {formatKES(budget.spent)} spent
        </p>
        <div className="h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budget.pct * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--color-muted)] mt-1.5">
          <span>{Math.round(budget.pct * 100)}% used</span>
          <span>{formatKES(budget.remaining)} left</span>
        </div>
      </div>

      {/* Members */}
      {members.length > 0 && (
        <div className="mx-4 mb-4">
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3 px-1">
            Group ({members.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {members.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-3 py-1.5"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] text-[10px] font-bold">
                  {m.name[0].toUpperCase()}
                </div>
                <span className="text-[var(--color-text)] text-xs font-medium">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itinerary */}
      <div className="mx-4">
        <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3 px-1">Schedule</p>

        {/* Day tabs */}
        <div className="overflow-x-auto hide-scrollbar mb-3">
          <div className="flex gap-2 min-w-max">
            {dates.map(date => {
              const isActive = date === selectedDate
              const isToday  = date === today
              const n = date < trip.startDate ? 0 : differenceInCalendarDays(parseISO(date), parseISO(trip.startDate)) + 1
              return (
                <motion.button
                  key={date}
                  onClick={() => setActiveDate(date)}
                  whileTap={{ scale: 0.93 }}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border shrink-0 min-w-[68px] ${
                    isActive
                      ? 'bg-[var(--color-primary)] border-transparent'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                  }`}
                >
                  <span className={`text-xs font-bold leading-none mb-0.5 ${isActive ? 'text-[var(--color-bg)]' : 'text-[var(--color-text)]'}`}>
                    {n === 0 ? 'Pre-trip' : `Day ${n}`}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'text-[var(--color-bg)]/70' : 'text-[var(--color-muted)]'}`}>
                    {format(parseISO(date), 'EEE d')}
                  </span>
                  {isToday && !isActive && (
                    <span className="text-[8px] mt-0.5 font-bold text-[var(--color-primary)] uppercase tracking-wide">Today</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="space-y-2"
          >
            {dayItems.map((item, i) => {
              const act      = item.activityId ? ACTIVITY_LIBRARY.find(a => a.id === item.activityId) : null
              const name     = item.customName ?? act?.name ?? 'Activity'
              const location = item.location   ?? act?.location ?? ''
              const area     = item.area       ?? act?.area ?? null
              const dotClr   = (area && AREA_COLORS[area]) ? AREA_COLORS[area] : 'var(--color-primary)'
              const cancelled = item.status === 'cancelled'
              return (
                <motion.div
                  key={item.id}
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex flex-col items-center w-9 shrink-0 pt-2">
                    <span className="text-[var(--color-muted)] text-[10px] font-medium leading-none mb-1.5">
                      {item.startTime ?? '–'}
                    </span>
                    <div
                      className="w-3 h-3 rounded-full border-2 border-[var(--color-bg)]"
                      style={{ backgroundColor: cancelled ? 'var(--color-muted)' : dotClr }}
                    />
                  </div>
                  <div className={`flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-3.5 py-3 ${cancelled ? 'opacity-40' : ''}`}>
                    <p className={`text-[var(--color-text)] text-sm font-semibold ${cancelled ? 'line-through' : ''}`}>{name}</p>
                    {location && (
                      <p className="text-[var(--color-muted)] text-xs mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotClr }} />
                        {location}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {item.startTime && item.endTime && (
                        <span className="text-[var(--color-muted)] text-[10px]">{item.startTime} → {item.endTime}</span>
                      )}
                      {item.status === 'done' && (
                        <span className="text-[10px] font-medium text-[var(--color-success)] bg-[var(--color-success-dim)] px-1.5 py-0.5 rounded-full">Done ✓</span>
                      )}
                      {cancelled && (
                        <span className="text-[10px] font-medium text-[var(--color-muted)] bg-[var(--color-surface-3)] px-1.5 py-0.5 rounded-full">Cancelled</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {dayItems.length === 0 && (
              <p className="text-[var(--color-muted)] text-sm text-center py-8">Nothing scheduled for this day</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="text-[var(--color-muted)] text-[10px] text-center mt-8 px-5">
        This is a read-only snapshot shared by the trip treasurer · Safiri
      </p>
    </div>
  )
}
