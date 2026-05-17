import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useTrip } from '../context/TripContext'
import { formatKES } from '../lib/constants'
import { SettingsIcon, CloseIcon, LogOutIcon } from '../components/icons'
import { fetchAllUserTrips, fetchTripMemberNames } from '../lib/db'
import { getQueueLength } from '../lib/offlineQueue'

function formatKESCompact(amount) {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `KES ${Math.round(amount / 1_000)}k`
  return formatKES(amount)
}

function SettingsSheet({ onClose }) {
  const { user, signOut }   = useAuth()
  const { state, computed } = useTrip()

  const [alertsMuted, setAlertsMuted] = useState(
    () => localStorage.getItem('safiri_alerts_muted') === 'true'
  )
  const [defaultPayer, setDefaultPayer] = useState(
    () => localStorage.getItem('safiri_default_payer') ?? null
  )
  const [theme, setTheme] = useState(
    () => localStorage.getItem('safiri_theme') ?? 'dark'
  )
  const [copied,           setCopied]           = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('safiri_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const { confirmedMembers, totalBudget, totalSpent, spentPercent, memberSpending } = computed
  const pendingCount = getQueueLength()

  function copyTripSummary() {
    const { trip } = state
    const lines = [`${trip.name} — ${trip.destination || ''}`]
    if (trip.startDate && trip.endDate) {
      lines.push(`${format(parseISO(trip.startDate), 'MMM d')} – ${format(parseISO(trip.endDate), 'MMM d, yyyy')}`)
    }
    lines.push(
      '',
      `Budget  ${formatKES(totalBudget)}`,
      `Spent   ${formatKES(totalSpent)} (${Math.round(spentPercent * 100)}%)`,
      `Left    ${formatKES(totalBudget - totalSpent)}`,
    )
    if (confirmedMembers.length > 0) {
      lines.push('')
      for (const m of confirmedMembers) {
        lines.push(`${m.name}  ${formatKES(Math.round(memberSpending[m.id] ?? 0))}`)
      }
    }
    navigator.clipboard?.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function clearData() {
    Object.keys(localStorage)
      .filter(k => k.startsWith('safiri'))
      .forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-[var(--color-border)]">
          <span className="font-semibold text-[var(--color-text)]">Settings</span>
          <motion.button
            onClick={onClose}
            className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="py-3 overflow-y-auto max-h-[80vh]">

          {/* ── Account ── */}
          <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Account</p>
          <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl px-4 py-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] font-bold text-base shrink-0">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="text-[var(--color-text)] text-sm font-medium truncate">{user?.email}</p>
                <p className="text-[var(--color-muted)] text-xs">Signed in</p>
              </div>
            </div>
          </div>

          {/* ── App ── */}
          <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">App</p>
          <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl divide-y divide-[var(--color-border)] mb-3 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text)] text-sm">Currency</span>
              <span className="text-[var(--color-muted)] text-sm">KES</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text)] text-sm">Theme</span>
              <motion.button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text)]"
                whileTap={{ scale: 0.93 }}
              >
                {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </motion.button>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text)] text-sm">Version</span>
              <span className="text-[var(--color-muted)] text-sm">1.0.0</span>
            </div>
          </div>

          {/* ── Expenses — default payer ── */}
          {state.setupComplete && confirmedMembers.length > 0 && (
            <>
              <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Expenses</p>
              <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl mb-3 overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-[var(--color-text)] text-sm mb-0.5">Default payer</p>
                  <p className="text-[var(--color-muted)] text-[11px] mb-3">
                    Pre-fills "Who paid?" every time you log a new expense
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setDefaultPayer(null); localStorage.removeItem('safiri_default_payer') }}
                      className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: defaultPayer === null ? 'var(--color-primary)' : 'var(--color-surface-3)',
                        color: defaultPayer === null ? 'var(--color-bg)' : 'var(--color-muted)',
                      }}
                    >
                      None
                    </button>
                    {confirmedMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => { setDefaultPayer(m.id); localStorage.setItem('safiri_default_payer', m.id) }}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                        style={{
                          backgroundColor: defaultPayer === m.id ? 'var(--color-primary)' : 'var(--color-surface-3)',
                          color: defaultPayer === m.id ? 'var(--color-bg)' : 'var(--color-muted)',
                        }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Notifications ── */}
          <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Notifications</p>
          <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl divide-y divide-[var(--color-border)] mb-3 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[var(--color-text)] text-sm">Budget alerts</p>
                <p className="text-[var(--color-muted)] text-[11px]">Banner at 75% and 90% spent</p>
              </div>
              <button
                onClick={() => {
                  const next = !alertsMuted
                  setAlertsMuted(next)
                  localStorage.setItem('safiri_alerts_muted', String(next))
                }}
                className="shrink-0 relative w-11 h-6 rounded-full transition-colors"
                style={{ backgroundColor: alertsMuted ? 'var(--color-surface-3)' : 'var(--color-primary)' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: alertsMuted ? '2px' : '22px' }}
                />
              </button>
            </div>
          </div>

          {/* ── Trip — export summary ── */}
          {state.setupComplete && (
            <>
              <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Trip</p>
              <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl divide-y divide-[var(--color-border)] mb-3 overflow-hidden">
                <motion.button
                  onClick={copyTripSummary}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  whileTap={{ backgroundColor: 'var(--color-surface-3)' }}
                >
                  <div>
                    <p className="text-[var(--color-text)] text-sm">Copy trip summary</p>
                    <p className="text-[var(--color-muted)] text-[11px]">Budget, spend &amp; per-member breakdown for the group chat</p>
                  </div>
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="copied"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-[var(--color-success)] text-xs font-semibold shrink-0 ml-3"
                      >
                        Copied!
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[var(--color-muted)] text-sm shrink-0 ml-3"
                      >
                        📋
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </>
          )}

          {/* ── Sync — only when queue is non-empty ── */}
          {pendingCount > 0 && (
            <>
              <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Sync</p>
              <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl px-4 py-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-[var(--color-text)] text-sm">
                    {pendingCount} action{pendingCount !== 1 ? 's' : ''} queued
                  </p>
                  <span className="text-[var(--color-warning)] text-[11px] font-medium">Offline</span>
                </div>
                <p className="text-[var(--color-muted)] text-[11px] mt-0.5">
                  Will sync automatically when back online
                </p>
              </div>
            </>
          )}

          {/* ── Data — clear local data ── */}
          <p className="px-5 py-2 text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">Data</p>
          <div className="mx-4 bg-[var(--color-surface-2)] rounded-2xl mb-4 overflow-hidden">
            {!showClearConfirm ? (
              <motion.button
                onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                whileTap={{ backgroundColor: 'var(--color-surface-3)' }}
              >
                <div>
                  <p className="text-[var(--color-danger)] text-sm">Clear local data</p>
                  <p className="text-[var(--color-muted)] text-[11px]">Resets the app on this device — cannot be undone</p>
                </div>
                <span className="text-[var(--color-danger)] text-sm ml-3">→</span>
              </motion.button>
            ) : (
              <div className="px-4 py-3">
                <p className="text-[var(--color-text)] text-sm font-semibold mb-1">Are you sure?</p>
                <p className="text-[var(--color-muted)] text-[11px] mb-3">
                  All trip data, expenses, and members will be permanently deleted from this device.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={clearData}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Yes, clear everything
                  </motion.button>
                  <motion.button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-[var(--color-muted)] border border-[var(--color-border)]"
                    whileTap={{ scale: 0.97 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sign out ── */}
          <div className="px-4 pt-1 pb-1">
            <motion.button
              onClick={async () => { onClose(); await signOut() }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm font-semibold"
              whileTap={{ scale: 0.97 }}
            >
              <LogOutIcon size={16} stroke="currentColor" />
              Sign out
            </motion.button>
          </div>

        </div>
      </motion.div>
    </>
  )
}

function PastTripCard({ trip, onClone, onUseGroup }) {
  const [action, setAction] = useState(null)

  const days = trip.startDate && trip.endDate
    ? differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1
    : null
  const totalBudget   = trip.budgetPerPerson * trip.groupSize
  const totalSpent    = trip.archivedTotalSpent
  const hasSpend      = totalSpent !== null
  const spentPct      = hasSpend && totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0
  const costPerPerson = hasSpend && trip.archivedMemberCount > 0
    ? Math.round(totalSpent / trip.archivedMemberCount)
    : null

  async function doClone() {
    setAction('clone')
    await onClone(trip)
    setAction(null)
  }

  async function doUseGroup() {
    setAction('group')
    await onUseGroup(trip)
    setAction(null)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 mb-3"
    >
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest mb-0.5">
            {trip.name}
          </p>
          <h3 className="text-[var(--color-text)] font-bold text-base leading-tight">{trip.destination || '—'}</h3>
          {trip.startDate && (
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              {format(parseISO(trip.startDate), 'MMM d')}
              {trip.endDate ? ` – ${format(parseISO(trip.endDate), 'MMM d, yyyy')}` : ''}
              {days ? ` · ${days}d` : ''}
            </p>
          )}
        </div>
        <span className="shrink-0 ml-3 text-[10px] font-medium bg-[var(--color-surface-3)] text-[var(--color-muted)] px-2.5 py-1 rounded-full">
          Completed
        </span>
      </div>

      {totalBudget > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-[var(--color-muted)] mb-1.5">
            <span>{hasSpend ? `${formatKES(totalSpent)} spent` : 'No spend data'}</span>
            <span>{formatKES(totalBudget)} budget</span>
          </div>
          {hasSpend && (
            <div className="h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${spentPct * 100}%`,
                  backgroundColor: spentPct >= 0.9
                    ? 'var(--color-danger)'
                    : spentPct >= 0.75
                      ? 'var(--color-warning)'
                      : 'var(--color-primary)',
                }}
              />
            </div>
          )}
          <div className="flex gap-4 text-[10px] text-[var(--color-muted)]">
            {costPerPerson !== null && <span>{formatKES(costPerPerson)}/person</span>}
            <span>{trip.groupSize} {trip.groupSize === 1 ? 'person' : 'people'}</span>
            {days && <span>{days} days</span>}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <motion.button
          onClick={doClone}
          disabled={!!action}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', opacity: action ? 0.55 : 1 }}
          whileTap={!action ? { scale: 0.95 } : {}}
        >
          {action === 'clone' ? 'Loading…' : 'Clone trip'}
        </motion.button>
        <motion.button
          onClick={doUseGroup}
          disabled={!!action}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] text-center transition-opacity"
          style={{ opacity: action ? 0.55 : 1 }}
          whileTap={!action ? { scale: 0.95 } : {}}
        >
          {action === 'group' ? 'Loading…' : 'Use this group'}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function Home({ onEnterTrip, onCreateTrip, onCloneTrip }) {
  const { user }                        = useAuth()
  const { state, computed }             = useTrip()
  const { trip, setupComplete }         = state
  const [showSettings, setShowSettings] = useState(false)
  const [pastTrips, setPastTrips]       = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingHistory(true)
    fetchAllUserTrips(user.id).then(trips => {
      setPastTrips(trips.filter(t => t.status === 'complete'))
      setLoadingHistory(false)
    })
  }, [user?.id])

  async function handleClone(tripData) {
    const names = await fetchTripMemberNames(tripData.id)
    onCloneTrip({
      _sourceName:      tripData.name,
      _cloneType:       'full',
      name:             tripData.name,
      destination:      tripData.destination,
      startDate:        tripData.startDate,
      endDate:          tripData.endDate,
      budgetPerPerson:  tripData.budgetPerPerson,
      groupSize:        tripData.groupSize,
      transportMode:    tripData.transportMode,
      sgrCostPerPerson: tripData.sgrCostPerPerson,
      carTotalCost:     tripData.carTotalCost,
      carType:          tripData.carType,
      memberNames:      names,
    })
  }

  async function handleUseGroup(tripData) {
    const names = await fetchTripMemberNames(tripData.id)
    onCloneTrip({
      _sourceName: tripData.name,
      _cloneType:  'group',
      groupSize:   names.length || tripData.groupSize,
      memberNames: names,
    })
  }

  const d               = computed.daysToTrip
  const checklistDone   = (state.checklist ?? []).filter(i => i.done).length
  const checklistTotal  = (state.checklist ?? []).length
  const checklistPct    = checklistTotal > 0 ? checklistDone / checklistTotal : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-bg)] px-5 pt-12 pb-10"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[var(--color-text)] text-2xl font-bold">My Trips</h1>
          {user?.email && (
            <p className="text-[var(--color-muted)] text-xs mt-0.5 truncate max-w-[200px]">{user.email}</p>
          )}
        </div>
        <motion.button
          onClick={() => setShowSettings(true)}
          className="shrink-0 p-2 mt-0.5 text-[var(--color-muted)] rounded-full border border-[var(--color-border)]"
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <SettingsIcon size={18} stroke="currentColor" />
        </motion.button>
      </div>

      {setupComplete ? (
        <>
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3">Active</p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 mb-4"
          >
            {/* Trip header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[var(--color-primary)] text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {trip.name}
                </p>
                <h2 className="text-[var(--color-text)] text-xl font-bold">{trip.destination}</h2>
                {trip.startDate && trip.endDate && (
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">
                    {format(parseISO(trip.startDate), 'MMM d')} – {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-medium bg-[var(--color-primary-dim)] text-[var(--color-primary)] px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>

            {/* Countdown */}
            {d > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[var(--color-primary-dim)] text-[var(--color-primary)] px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                <span>🗓</span>
                <span>{d} day{d !== 1 ? 's' : ''} to {trip.destination?.split(',')[0] || 'trip'}</span>
              </div>
            )}
            {d === 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[var(--color-success-dim)] text-[var(--color-success)] px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                <span>🎉</span><span>Trip starts today!</span>
              </div>
            )}
            {d < 0 && computed.tripDaysRemaining > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-[var(--color-warning-dim)] text-[var(--color-warning)] px-3 py-1.5 rounded-full text-sm font-semibold mb-3">
                <span>✈️</span>
                <span>In progress · {computed.tripDaysRemaining} day{computed.tripDaysRemaining !== 1 ? 's' : ''} left</span>
              </div>
            )}

            {/* Member avatars + group readiness */}
            {computed.confirmedMembers.length > 0 && (
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center">
                  {computed.confirmedMembers.slice(0, 5).map((m, i) => (
                    <span
                      key={m.id}
                      className="w-7 h-7 rounded-full bg-[var(--color-primary-dim)] text-[var(--color-primary)] text-[11px] font-bold flex items-center justify-center border-2 border-[var(--color-surface)]"
                      style={{ marginLeft: i === 0 ? 0 : '-6px' }}
                    >
                      {m.name[0].toUpperCase()}
                    </span>
                  ))}
                  {computed.confirmedMembers.length > 5 && (
                    <span
                      className="w-7 h-7 rounded-full bg-[var(--color-surface-3)] text-[var(--color-muted)] text-[10px] font-bold flex items-center justify-center border-2 border-[var(--color-surface)]"
                      style={{ marginLeft: '-6px' }}
                    >
                      +{computed.confirmedMembers.length - 5}
                    </span>
                  )}
                </div>
                <span className="text-[var(--color-muted)] text-xs leading-tight">
                  {computed.confirmedMembers.length} confirmed · {formatKESCompact(computed.totalBudget)} committed
                </span>
              </div>
            )}

            {/* Checklist progress */}
            {checklistTotal > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${checklistPct * 100}%`,
                      backgroundColor: checklistPct >= 1 ? 'var(--color-success)' : 'var(--color-primary)',
                    }}
                  />
                </div>
                <span className="text-[var(--color-muted)] text-xs whitespace-nowrap shrink-0">
                  {checklistDone}/{checklistTotal} tasks
                </span>
              </div>
            )}

            {/* Spend bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-muted)]">{formatKES(computed.totalSpent)} spent</span>
                <span className="text-[var(--color-muted)]">{formatKES(computed.totalBudget)} budget</span>
              </div>
              <div className="h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(computed.spentPercent * 100, 100)}%`,
                    backgroundColor: computed.spentPercent >= 0.9
                      ? 'var(--color-danger)'
                      : computed.spentPercent >= 0.75
                        ? 'var(--color-warning)'
                        : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <motion.button
                onClick={onEnterTrip}
                whileTap={{ scale: 0.95 }}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold px-5 py-2 rounded-xl"
              >
                Enter trip →
              </motion.button>
            </div>
          </motion.div>

          <motion.button
            onClick={onCreateTrip}
            whileTap={{ scale: 0.97 }}
            className="w-full border-2 border-dashed border-[var(--color-border)] rounded-2xl p-5 text-center text-[var(--color-muted)] text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            + Plan a new trip
          </motion.button>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center pt-16 text-center"
        >
          <span className="text-6xl mb-5">🗺️</span>
          <h2 className="text-[var(--color-text)] text-xl font-bold mb-2">No trips yet</h2>
          <p className="text-[var(--color-muted)] text-sm mb-8 max-w-[240px]">
            Plan your first trip — set a budget, build an itinerary, and split costs with your crew.
          </p>
          <motion.button
            onClick={onCreateTrip}
            whileTap={{ scale: 0.95 }}
            className="bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold px-8 py-3 rounded-xl text-sm"
          >
            Plan a trip
          </motion.button>
        </motion.div>
      )}

      {/* Trip history */}
      {(loadingHistory || pastTrips.length > 0) && (
        <div className="mt-8">
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3">
            Past Trips
          </p>
          {loadingHistory ? (
            <div className="text-center text-[var(--color-muted)] text-sm py-6">Loading history…</div>
          ) : (
            pastTrips.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <PastTripCard trip={t} onClone={handleClone} onUseGroup={handleUseGroup} />
              </motion.div>
            ))
          )}
        </div>
      )}

      <AnimatePresence>
        {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
