import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import { formatKES } from '../lib/constants'
import { CloseIcon, WalletIcon } from '../components/icons'
import { createTrip, loadUserTrip } from '../lib/db'

function fmtRange(start, end) {
  try {
    const s = format(new Date(start), 'd MMM')
    const e = end ? format(new Date(end), 'd MMM yyyy') : ''
    return e ? `${s} – ${e}` : s
  } catch {
    return ''
  }
}

const STATUS_META = {
  confirmed: { bg: 'bg-[var(--color-success-dim)]', text: 'text-[var(--color-success)]', label: 'Confirmed' },
  maybe:     { bg: 'bg-[var(--color-warning-dim)]', text: 'text-[var(--color-warning)]',  label: 'Maybe'     },
  dropped:   { bg: 'bg-[var(--color-surface-2)]',   text: 'text-[var(--color-muted)]',    label: 'Dropped'   },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

export default function Members() {
  const { state, dispatch, computed } = useTrip()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [showAdd,      setShowAdd]      = useState(searchParams.get('add') === 'true')
  const [showInvite,   setShowInvite]   = useState(false)
  const [contribMember, setContribMember] = useState(null)

  const { members, trip, expenses, contributions } = state
  const { totalBudget, cashContributed } = computed

  const confirmedMembers = members.filter(m => m.status === 'confirmed')
  const confirmedIds     = confirmedMembers.map(m => m.id)
  const others           = members.filter(m => m.status !== 'confirmed')

  // Per-member share of group expenses (splitBetween; falls back to all confirmed)
  const spendingByMember = {}
  for (const e of expenses.filter(x => !x.isPreTrip)) {
    const splitIds = e.splitBetween?.length > 0 ? e.splitBetween : confirmedIds
    if (splitIds.length > 0) {
      const share = e.amount / splitIds.length
      for (const id of splitIds) {
        spendingByMember[id] = (spendingByMember[id] || 0) + share
      }
    }
  }

  return (
    <motion.div
      className="min-h-full bg-[var(--color-bg)] pb-10"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="px-5 pt-12 pb-5">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-1">Group</p>
        <div className="flex items-end justify-between">
          <h1 className="text-[var(--color-text)] text-3xl font-bold">Members</h1>
          <div className="text-right">
            <div>
              <span className="text-[var(--color-text)] font-bold text-xl">{confirmedMembers.length}</span>
              <span className="text-[var(--color-muted)] text-xs ml-1">confirmed</span>
            </div>
            {state.groupSize > confirmedMembers.length && (
              <p className="text-[var(--color-muted)] text-[10px] mt-0.5">{state.groupSize} expected</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Budget pool summary */}
      {members.length > 0 && (
        <motion.div
          variants={fadeUp}
          className="mx-4 mb-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-wide mb-1">Total budget pool</p>
          <p className="text-[var(--color-text)] text-3xl font-bold">{formatKES(totalBudget)}</p>
          <p className="text-[var(--color-muted)] text-xs mt-0.5">
            {confirmedMembers.length > 0
              ? `${confirmedMembers.length} confirmed · individual allocations`
              : `${state.groupSize} people × ${formatKES(trip.budgetPerPerson)}`}
          </p>
        </motion.div>
      )}

      {confirmedMembers.length > 0 && (
        <motion.div
          data-tour="pool-analysis"
          variants={fadeUp}
          className="mx-4 mb-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
        >
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-wide font-medium">Pool analysis</p>
          {(() => {
            const expected  = trip.budgetPerPerson * state.groupSize
            const actual    = confirmedMembers.reduce((s, m) => s + (m.budget ?? trip.budgetPerPerson), 0)
            const gap       = actual - expected
            const minBudget = Math.min(...confirmedMembers.map(m => m.budget ?? trip.budgetPerPerson))
            return (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[var(--color-surface-2)] rounded-xl p-3">
                    <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">Target</p>
                    <p className="text-[var(--color-text)] font-semibold text-sm">{formatKES(expected)}</p>
                    <p className="text-[var(--color-muted)] text-[10px]">{state.groupSize} × {formatKES(trip.budgetPerPerson)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${gap < 0 ? 'bg-[var(--color-danger-dim)]' : 'bg-[var(--color-success-dim)]'}`}>
                    <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">Committed</p>
                    <p className="text-[var(--color-text)] font-semibold text-sm">{formatKES(actual)}</p>
                    <p className={`text-[10px] font-medium ${gap < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                      {gap < 0 ? `${formatKES(Math.abs(gap))} under plan` : gap > 0 ? `${formatKES(gap)} over plan` : 'On target'}
                    </p>
                  </div>
                </div>
                <div className="bg-[var(--color-primary-dim)] border border-[color:var(--color-primary)]/20 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">Activity cap</p>
                    <p className="text-[var(--color-primary)] font-bold text-xl tabular-nums">{formatKES(minBudget)}</p>
                  </div>
                  <div className="text-right max-w-[140px]">
                    <p className="text-[var(--color-primary)] text-xs font-medium">max per person</p>
                    <p className="text-[var(--color-muted)] text-[10px]">
                      {minBudget < trip.budgetPerPerson ? 'limited by lowest contributor' : 'everyone at full share'}
                    </p>
                  </div>
                </div>
              </>
            )
          })()}
        </motion.div>
      )}

      {/* Member list */}
      <div className="px-4 space-y-3">
        <AnimatePresence>
          {[...confirmedMembers, ...others].map((member, i) => {
            const budget    = member.budget ?? trip.budgetPerPerson
            const share     = spendingByMember[member.id] || 0
            const cashIn    = cashContributed?.[member.id] ?? 0
            const remaining = budget - share
            const pct       = budget > 0 ? Math.min(share / budget, 1) : 0
            const meta      = STATUS_META[member.status] ?? STATUS_META.maybe
            const barColor  = pct >= 0.9 ? 'var(--color-danger)' : pct >= 0.75 ? 'var(--color-warning)' : 'var(--color-success)'
            const memberContribs = (contributions ?? []).filter(c => c.memberId === member.id)

            return (
              <motion.div
                key={member.id}
                data-tour="member-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 380, damping: 28 }}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4"
              >
                {/* Name row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] font-bold text-base">
                      {member.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[var(--color-text)] font-semibold leading-none mb-1">{member.name}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {member.budget != null && (
                      <span className="text-[10px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-dim)] px-2 py-0.5 rounded-full">
                        Custom
                      </span>
                    )}
                    <motion.button
                      onClick={() => dispatch({ type: 'REMOVE_MEMBER', payload: member.id })}
                      className="text-[var(--color-muted)] p-1 rounded-full"
                      whileTap={{ scale: 0.8 }}
                    >
                      <CloseIcon size={14} stroke="currentColor" />
                    </motion.button>
                  </div>
                </div>

                {/* Budget stats — SHARE (not Spent) */}
                <div data-tour="member-stats" className="grid grid-cols-3 gap-2 mb-3 text-center">
                  {[
                    { label: 'Budget',                    value: formatKES(budget),            color: 'text-[var(--color-text)]'    },
                    { label: 'Share',                     value: formatKES(share),             color: 'text-[var(--color-text)]'    },
                    { label: remaining < 0 ? 'Over' : 'Left',
                      value: formatKES(Math.abs(remaining)),
                      color: remaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[var(--color-surface-2)] rounded-xl py-2 px-1">
                      <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={`font-semibold text-xs ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Share bar */}
                <div className="h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden mb-1">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.04 }}
                  />
                </div>
                <p className="text-[var(--color-muted)] text-[10px] mb-3">
                  their portion of group expenses
                </p>

                {/* Cash put in row */}
                <div data-tour="member-cash" className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <WalletIcon size={12} stroke="var(--color-muted)" />
                    <span className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide">Cash put in</span>
                    <span className={`text-xs font-semibold tabular-nums ${cashIn === 0 ? 'text-[var(--color-muted)]' : cashIn >= share ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'}`}>
                      {formatKES(cashIn)}
                    </span>
                    {cashIn > 0 && cashIn < share && (
                      <span className="text-[10px] text-[var(--color-danger)]">{formatKES(share - cashIn)} still owed</span>
                    )}
                    {cashIn >= share && share > 0 && (
                      <span className="text-[10px] text-[var(--color-success)]">covered ✓</span>
                    )}
                  </div>
                  {member.status === 'confirmed' && (
                    <motion.button
                      onClick={() => setContribMember(member)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-xl bg-[var(--color-primary-dim)] text-[var(--color-primary)]"
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    >
                      + Add cash
                    </motion.button>
                  )}
                </div>

                {/* Contribution history */}
                {memberContribs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {memberContribs.map(c => (
                      <div key={c.id} className="flex items-center justify-between bg-[var(--color-surface-2)] rounded-xl px-3 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[var(--color-text)] text-[11px] font-medium truncate">{c.note ?? 'Cash contribution'}</p>
                          <p className="text-[var(--color-muted)] text-[10px]">{c.date}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[var(--color-success)] text-xs font-semibold tabular-nums">{formatKES(c.amount)}</span>
                          <motion.button
                            onClick={() => dispatch({ type: 'REMOVE_CONTRIBUTION', payload: c.id })}
                            className="text-[var(--color-muted)] p-0.5"
                            whileTap={{ scale: 0.8 }}
                          >
                            <CloseIcon size={12} stroke="currentColor" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Empty state */}
        {members.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.p
              className="text-5xl mb-3"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              👥
            </motion.p>
            <p className="text-[var(--color-text)] font-semibold mb-1">No members yet</p>
            <p className="text-[var(--color-muted)] text-sm max-w-[240px] mx-auto">
              {state.groupSize > 1
                ? `Your trip expects ${state.groupSize} travellers. Add them below or invite via link.`
                : 'Add your travel mates to track who\'s spending what'}
            </p>
          </motion.div>
        )}

        {/* Invite via WhatsApp */}
        <motion.button
          onClick={() => setShowInvite(true)}
          className="w-full py-3.5 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/8 text-[#25D366] text-sm font-medium flex items-center justify-center gap-2 mt-1"
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            <span className="text-base">📲</span>
            Share invite link
        </motion.button>

        {/* Add member button */}
        <motion.button
          data-tour="members-add"
          onClick={() => setShowAdd(true)}
          className="w-full py-4 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] text-sm flex items-center justify-center gap-2 mt-1"
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-xl leading-none">+</span>
          Add a member
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <AddMemberSheet
            tripBudget={trip.budgetPerPerson}
            onClose={() => setShowAdd(false)}
          />
        )}
        {showInvite && (
          <InviteSheet
            trip={trip}
            tripDbId={state.tripDbId}
            userId={user?.id}
            state={state}
            dispatch={dispatch}
            onClose={() => setShowInvite(false)}
          />
        )}
        {contribMember && (
          <ContributionSheet
            member={contribMember}
            onClose={() => setContribMember(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Invite Sheet ─────────────────────────────────────────────────────────────

function InviteSheet({ trip, tripDbId, userId, state, dispatch, onClose }) {
  const [copied,  setCopied]  = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncErr, setSyncErr] = useState(null)

  async function handleSync() {
    if (!userId || syncing) return
    setSyncing(true)
    setSyncErr(null)
    const tripId = await createTrip(userId, state)
    if (!tripId) {
      setSyncing(false)
      setSyncErr('Could not sync — check your connection and try again.')
      return
    }
    const dbState = await loadUserTrip(userId)
    if (dbState) dispatch({ type: 'LOAD_FROM_DB', payload: dbState })
    else dispatch({ type: 'SET_TRIP_DB_ID', payload: tripId })
    setSyncing(false)
  }

  if (!tripDbId) {
    return (
      <>
        <motion.div className="fixed inset-0 z-50 bg-black/50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} />
        <motion.div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)]"
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
          </div>
          <div className="px-5 py-8 text-center">
            <p className="text-3xl mb-3">🔗</p>
            <p className="text-[var(--color-text)] font-semibold mb-2">Trip not yet synced</p>
            <p className="text-[var(--color-muted)] text-sm mb-5">
              This trip only exists on this device. Sync it to the cloud to get an invite link.
            </p>
            {syncErr && <p className="text-[var(--color-danger)] text-xs mb-3">{syncErr}</p>}
            <motion.button onClick={handleSync}
              disabled={syncing}
              className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold mb-3"
              whileTap={{ scale: 0.96 }}>
              {syncing ? 'Syncing…' : 'Sync now'}
            </motion.button>
            <motion.button onClick={onClose}
              className="w-full py-2.5 rounded-2xl text-[var(--color-muted)] text-sm"
              whileTap={{ scale: 0.96 }}>
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </>
    )
  }

  const inviteUrl = `${window.location.origin}/?join=${tripDbId}`
  const dateRange = fmtRange(trip.startDate, trip.endDate)
  const waText    = encodeURIComponent(
    `Hey! We're going to ${trip.destination || trip.name} 🇰🇪\n` +
    (dateRange ? `📅 ${dateRange}\n` : '') +
    `💰 Budget: KES ${Number(trip.budgetPerPerson).toLocaleString()} per person\n\n` +
    `Track group expenses on Safiri:\n${inviteUrl}`
  )
  const waLink = `https://wa.me/?text=${waText}`

  function copyLink() {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)]">
          <div>
            <span className="font-semibold text-[var(--color-text)]">Invite to trip</span>
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              Anyone with this link can join {trip.name}
            </p>
          </div>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="px-5 py-5 space-y-3">
          {/* Link preview */}
          <div className="bg-[var(--color-surface-2)] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-[var(--color-muted)] text-xs truncate flex-1 font-mono">{inviteUrl}</p>
            <motion.button
              onClick={copyLink}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-xl"
              style={{
                backgroundColor: copied ? 'var(--color-success-dim)' : 'var(--color-primary-dim)',
                color:           copied ? 'var(--color-success)'     : 'var(--color-primary)',
              }}
              whileTap={{ scale: 0.9 }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </motion.button>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#25D366] text-white font-semibold text-base"
          >
            <span className="text-xl">📲</span>
            Send via WhatsApp
          </a>

          <p className="text-[var(--color-muted)] text-[11px] text-center px-4">
            Recipient taps the link, enters their name, and gets added instantly — no account needed.
          </p>
        </div>
      </motion.div>
    </>
  )
}

// ─── Add Member Sheet ─────────────────────────────────────────────────────────

function AddMemberSheet({ tripBudget, onClose }) {
  const { dispatch } = useTrip()
  const [name,   setName]   = useState('')
  const [status, setStatus] = useState('confirmed')
  const [custom, setCustom] = useState(false)
  const [budget, setBudget] = useState('')

  function save() {
    if (!name.trim()) return
    dispatch({
      type: 'ADD_MEMBER',
      payload: {
        id:       crypto.randomUUID(),
        name:     name.trim(),
        status,
        budget:   custom && budget ? Number(budget) : null,
        joinedAt: new Date().toISOString(),
      },
    })
    onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)]">
          <span className="font-semibold text-[var(--color-text)]">Add member</span>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="e.g. Brian" className="input-field" autoFocus />
          </div>

          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Status</label>
            <div className="flex gap-2">
              {[['confirmed', '✓ Confirmed'], ['maybe', '? Maybe']].map(([s, lbl]) => (
                <motion.button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  animate={{
                    backgroundColor: status === s ? 'var(--color-primary)' : 'var(--color-surface-2)',
                    color:           status === s ? 'var(--color-bg)'      : 'var(--color-muted)',
                  }}
                  transition={{ duration: 0.15 }}>
                  {lbl}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide">
                <WalletIcon size={14} stroke="var(--color-muted-2)" />
                Custom budget
              </label>
              <motion.button onClick={() => setCustom(b => !b)}
                className="w-10 h-5 rounded-full relative"
                animate={{ backgroundColor: custom ? 'var(--color-primary)' : 'var(--color-surface-3)' }}
                transition={{ duration: 0.15 }}>
                <motion.span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                  animate={{ left: custom ? '22px' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }} />
              </motion.button>
            </div>
            <AnimatePresence mode="wait">
              {custom ? (
                <motion.input key="input" type="number" value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder={`Default: ${tripBudget.toLocaleString()}`}
                  className="input-field" inputMode="numeric"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              ) : (
                <motion.p key="hint" className="text-[var(--color-muted)] text-xs"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Uses trip default: {formatKES(tripBudget)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pb-2">
          <motion.button onClick={save}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{
              backgroundColor: name.trim() ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color:           name.trim() ? 'var(--color-bg)'      : 'var(--color-muted)',
            }}
            whileTap={name.trim() ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
            Add to group
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}

// ─── Add Cash Contribution Sheet ──────────────────────────────────────────────

function ContributionSheet({ member, onClose }) {
  const { dispatch } = useTrip()
  const [amount, setAmount] = useState('')
  const [note,   setNote]   = useState('')
  const [date,   setDate]   = useState(format(new Date(), 'yyyy-MM-dd'))

  const canSave = Number(amount) > 0

  function save() {
    if (!canSave) return
    dispatch({
      type: 'ADD_CONTRIBUTION',
      payload: {
        id:        crypto.randomUUID(),
        memberId:  member.id,
        amount:    Number(amount),
        note:      note.trim() || null,
        date,
        createdAt: new Date().toISOString(),
      },
    })
    onClose()
  }

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)]"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-[var(--color-border)]">
          <div>
            <span className="font-semibold text-[var(--color-text)]">Add cash contribution</span>
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              {member.name} put money into the group fund
            </p>
          </div>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Amount (KES)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xl font-light pointer-events-none">KES</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0" inputMode="numeric" autoFocus
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl py-4 pl-16 pr-4 text-3xl font-bold text-[var(--color-text)] text-right focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Note (optional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder="e.g. topped up" className="input-field text-sm" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-2">
          <motion.button onClick={save}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{
              backgroundColor: canSave ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color:           canSave ? 'var(--color-bg)'      : 'var(--color-muted)',
            }}
            whileTap={canSave ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
            Save contribution
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
