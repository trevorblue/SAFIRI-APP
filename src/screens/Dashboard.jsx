import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ZapIcon, TrendIcon, ChevronRightIcon, CalendarIcon, GroupIcon, CloseIcon, BackIcon } from '../components/icons'
import { useTrip } from '../context/TripContext'
import { formatKES, EXPENSE_CATEGORIES } from '../lib/constants'
import AnimatedNumber from '../components/AnimatedNumber'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

export default function Dashboard() {
  const { state, computed, dispatch } = useTrip()
  const navigate = useNavigate()
  const { onExitTrip } = useOutletContext() || {}
  const [capCat, setCapCat] = useState(null) // category id being edited

  const {
    totalBudget, totalSpent, totalRemaining, spentPercent,
    dailyBudget, dailyBudgetPerPerson, todaySpent, todayRemaining,
    committedTotal, alertLevel, daysToTrip, tripDays,
    byCategory, memberCount, tripAsMonthPercent,
    memberSpending, confirmedMembers,
  } = computed

  const { trip } = state
  const start = parseISO(trip.startDate)
  const end = parseISO(trip.endDate)
  const today = new Date()
  const tripStarted = today >= start && today <= end
  const beforeTrip = today < start

  const remainingColor =
    alertLevel === 'danger' ? 'text-[var(--color-danger)]' :
    alertLevel === 'warning' ? 'text-[var(--color-warning)]' :
    'text-[var(--color-success)]'

  const barColor =
    alertLevel === 'danger' ? 'var(--color-danger)' :
    alertLevel === 'warning' ? 'var(--color-warning)' :
    'var(--color-primary)'

  const activeCategories = EXPENSE_CATEGORIES
    .filter(c => byCategory[c.id])
    .sort((a, b) => (byCategory[b.id] || 0) - (byCategory[a.id] || 0))

  return (
    <motion.div
      className="min-h-full bg-[var(--color-bg)]"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="px-5 pt-12 pb-6">
        {onExitTrip && (
          <button
            onClick={onExitTrip}
            className="flex items-center gap-1.5 text-[var(--color-primary)] text-sm font-medium mb-3 -ml-0.5"
          >
            <BackIcon size={15} stroke="currentColor" />
            My Trips
          </button>
        )}
        <div className="flex items-start justify-between mb-1">
          {/* Tappable trip identity — goes to setup */}
          <motion.button
            onClick={() => navigate('/setup')}
            className="text-left flex-1 mr-3"
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-0.5 flex items-center gap-1">
              {trip.name}
              <span className="text-[var(--color-muted)] text-[10px] normal-case tracking-normal">· tap to edit</span>
            </p>
            <p className="text-[var(--color-muted-2)] text-sm">
              {format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')} · {tripDays}d
            </p>
          </motion.button>

          <motion.button
            onClick={() => navigate('/members')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted-2)] text-xs shrink-0"
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <GroupIcon size={13} stroke="currentColor" />
            {memberCount > 0 ? `${memberCount} pax` : 'Add people'}
          </motion.button>
        </div>

        {beforeTrip && (
          <motion.div
            className="mt-3 px-3 py-2 rounded-xl bg-[var(--color-primary-dim)] border border-[color:var(--color-primary)]/20 flex items-center gap-2"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 28 }}
          >
            <CalendarIcon size={14} stroke="var(--color-primary)" />
            <span className="text-[var(--color-primary)] text-xs font-medium">
              {daysToTrip === 0 ? 'Trip starts today!' : `${daysToTrip} day${daysToTrip !== 1 ? 's' : ''} until departure`}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Main budget card */}
      <motion.div
        variants={fadeUp}
        className="mx-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 mb-4"
      >
        <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-2">
          Total remaining
        </p>

        <AnimatedNumber
          value={totalRemaining}
          prefix="KES "
          className={`text-5xl font-bold tracking-tight mb-1 block ${remainingColor}`}
        />

        <p className="text-[var(--color-muted)] text-sm mb-4">
          of {formatKES(totalBudget)} · {formatKES(totalSpent)} spent
        </p>

        {/* Animated progress bar */}
        <div className="h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spentPercent * 100, 100)}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--color-muted)]">
          <span>{Math.round(spentPercent * 100)}% used</span>
          <span>{formatKES(totalRemaining)} left</span>
        </div>

        {/* Committed vs flexible — only shows at alert level */}
        {alertLevel && (
          <motion.div
            className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="bg-[var(--color-surface-2)] rounded-xl p-3">
              <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-1">Committed</p>
              <p className="text-[var(--color-text)] font-semibold text-sm">{formatKES(committedTotal)}</p>
              <p className="text-[var(--color-muted)] text-[10px]">locked in</p>
            </div>
            <div className="bg-[var(--color-surface-2)] rounded-xl p-3">
              <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide mb-1">Flexible</p>
              <p className="text-[var(--color-success)] font-semibold text-sm">
                {formatKES(Math.max(0, totalRemaining - committedTotal))}
              </p>
              <p className="text-[var(--color-muted)] text-[10px]">still variable</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Daily budget card */}
      <motion.div
        variants={fadeUp}
        className="mx-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium">
            {tripStarted ? 'Today' : 'Daily budget'}
          </p>
          <span className="text-[var(--color-muted)] text-xs">
            {formatKES(dailyBudgetPerPerson)}/person
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <AnimatedNumber
              value={Math.abs(todayRemaining)}
              prefix="KES "
              className={`text-3xl font-bold tracking-tight block ${
                todayRemaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
              }`}
            />
            <p className="text-[var(--color-muted)] text-xs mt-0.5">
              {tripStarted
                ? todayRemaining >= 0 ? 'remaining today' : "over today's budget"
                : `per day · ${formatKES(dailyBudget)} group total`}
            </p>
          </div>
          {tripStarted && (
            <div className="text-right">
              <p className="text-[var(--color-muted)] text-xs">spent</p>
              <p className="text-[var(--color-text)] font-semibold">{formatKES(todaySpent)}</p>
            </div>
          )}
        </div>

        {tripStarted && dailyBudget > 0 && (
          <div className="mt-3 h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: todaySpent > dailyBudget
                  ? 'var(--color-danger)'
                  : 'var(--color-primary)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todaySpent / dailyBudget) * 100, 100)}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        )}
      </motion.div>

      {/* Month context */}
      {tripAsMonthPercent && (
        <motion.div
          variants={fadeUp}
          className="mx-4 mb-4 px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center gap-3"
        >
          <span className="text-lg">📅</span>
          <p className="text-[var(--color-muted)] text-xs">
            This trip is{' '}
            <span className="text-[var(--color-text)] font-semibold">
              {Math.round(tripAsMonthPercent)}%
            </span>{' '}
            of your monthly budget
          </p>
        </motion.div>
      )}

      {/* Member overview */}
      {confirmedMembers.length > 0 && (
        <motion.div variants={fadeUp} className="mx-4 mb-4">
          <motion.button
            onClick={() => navigate('/members')}
            className="w-full flex items-center justify-between mb-3 px-1"
            whileTap={{ scale: 0.98 }}
          >
            <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium">Group</p>
            <ChevronRightIcon size={14} stroke="var(--color-muted)" />
          </motion.button>
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
            {confirmedMembers.map((member, i) => {
              const budget    = member.budget ?? trip.budgetPerPerson
              const spent     = memberSpending[member.id] || 0
              const remaining = budget - spent
              const pct       = budget > 0 ? Math.min(spent / budget, 1) : 0
              const barColor  = pct >= 0.9 ? 'var(--color-danger)' : pct >= 0.75 ? 'var(--color-warning)' : 'var(--color-success)'
              return (
                <motion.div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, type: 'spring', stiffness: 380, damping: 28 }}
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--color-primary-dim)] flex items-center justify-center text-[var(--color-primary)] text-xs font-bold shrink-0">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[var(--color-text)] text-sm">{member.name}</span>
                      <span className={`text-xs font-medium tabular-nums ${remaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}>
                        {formatKES(Math.abs(remaining))} {remaining < 0 ? 'over' : 'left'}
                      </span>
                    </div>
                    <div className="h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct * 100}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.04 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <motion.div variants={fadeUp} className="mx-4 mb-4">
        <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3 px-1">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ActionCard
            icon={<ZapIcon size={18} stroke="currentColor" />}
            label="Can we afford this?"
            color="primary"
            onClick={() => navigate('/afford')}
          />
          <ActionCard
            icon={<TrendIcon size={18} stroke="currentColor" />}
            label="Log an expense"
            color="success"
            onClick={() => navigate('/expenses')}
          />
        </div>
      </motion.div>

      {/* Category breakdown */}
      {activeCategories.length > 0 && (
        <motion.div variants={fadeUp} className="mx-4 mb-6">
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <motion.button
              onClick={() => navigate('/expenses')}
              whileTap={{ scale: 0.96 }}
            >
              <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium">
                By category
              </p>
            </motion.button>
            <span className="text-[var(--color-muted)] text-[10px]">tap row to set cap</span>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
            {activeCategories.map((cat, i) => {
              const spent   = byCategory[cat.id] || 0
              const cap     = state.categoryCaps?.[cat.id]
              const barMax  = cap ?? totalBudget
              const pct     = barMax > 0 ? (spent / barMax) * 100 : 0
              const overCap = cap && spent > cap
              const nearCap = cap && !overCap && spent / cap >= 0.8
              const barFill = overCap ? 'var(--color-danger)' : nearCap ? 'var(--color-warning)' : 'var(--color-primary)'
              return (
                <motion.button
                  key={cat.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
                  whileTap={{ backgroundColor: 'var(--color-surface-2)' }}
                  onClick={() => setCapCat(cat.id)}
                >
                  <span className="text-lg w-7 text-center shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[var(--color-text)] text-sm">{cat.label}</span>
                      <div className="flex items-center gap-2">
                        {cap && (
                          <span className={`text-[10px] tabular-nums ${overCap ? 'text-[var(--color-danger)] font-semibold' : nearCap ? 'text-[var(--color-warning)]' : 'text-[var(--color-muted)]'}`}>
                            {overCap ? '⚠ over cap' : `cap ${formatKES(cap)}`}
                          </span>
                        )}
                        <span className="text-[var(--color-text)] text-sm font-medium tabular-nums">
                          {formatKES(spent)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: barFill }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.04 }}
                      />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {activeCategories.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="mx-4 mb-8 text-center py-8"
        >
          <motion.p
            className="text-4xl mb-3"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            🏖️
          </motion.p>
          <p className="text-[var(--color-text)] font-medium mb-1">No expenses yet</p>
          <p className="text-[var(--color-muted)] text-sm">
            Tap <strong>+</strong> below to log your first expense
          </p>
        </motion.div>
      )}

      <AnimatePresence>
        {capCat && (
          <SetCapSheet
            catId={capCat}
            currentCap={state.categoryCaps?.[capCat]}
            currentSpent={byCategory[capCat] || 0}
            onClose={() => setCapCat(null)}
            onSave={amount => {
              dispatch({ type: 'SET_CATEGORY_CAP', payload: { category: capCat, amount } })
              setCapCat(null)
            }}
            onClear={() => {
              dispatch({ type: 'SET_CATEGORY_CAP', payload: { category: capCat, amount: null } })
              setCapCat(null)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SetCapSheet({ catId, currentCap, currentSpent, onClose, onSave, onClear }) {
  const cat = EXPENSE_CATEGORIES.find(c => c.id === catId)
  const [raw, setRaw] = useState(currentCap ? String(currentCap) : '')

  function save() {
    const val = parseFloat(raw)
    if (!val || val <= 0) return
    onSave(val)
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
          <span className="font-semibold text-[var(--color-text)]">
            {cat?.icon} Spending cap — {cat?.label}
          </span>
          <motion.button onClick={onClose} whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="var(--color-muted)" />
          </motion.button>
        </div>
        <div className="px-5 pt-4 pb-4 space-y-4">
          <p className="text-[var(--color-muted)] text-sm">
            Currently spent: <span className="text-[var(--color-text)] font-semibold">{formatKES(currentSpent)}</span>
            {currentCap && <span> · Cap: <span className="text-[var(--color-text)] font-semibold">{formatKES(currentCap)}</span></span>}
          </p>
          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Maximum spend for this category (KES)</p>
            <input
              type="number"
              inputMode="numeric"
              className="input-field"
              placeholder="e.g. 3000"
              value={raw}
              onChange={e => setRaw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
            />
          </div>
          <motion.button
            onClick={save}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold text-sm"
          >
            Set cap
          </motion.button>
          {currentCap && (
            <motion.button
              onClick={onClear}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-2xl text-[var(--color-muted)] text-sm font-medium"
            >
              Remove cap
            </motion.button>
          )}
        </div>
      </motion.div>
    </>
  )
}

function ActionCard({ icon, label, color, onClick }) {
  const colorMap = {
    primary: 'bg-[var(--color-primary-dim)] text-[var(--color-primary)] border-[color:var(--color-primary)]/20',
    success: 'bg-[var(--color-success-dim)] text-[var(--color-success)] border-[color:var(--color-success)]/20',
  }
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-4 rounded-2xl border ${colorMap[color]} text-left w-full`}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
    >
      {icon}
      <span className="text-sm font-medium leading-tight">{label}</span>
    </motion.button>
  )
}
