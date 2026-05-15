import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context/TripContext'
import { formatKES } from '../lib/constants'

const TABS = ['Spend check', 'SGR vs Car']

export default function AffordCalculator() {
  const [tab, setTab] = useState(0)

  return (
    <div className="min-h-full bg-[var(--color-bg)] px-5 pt-12 pb-8">
      <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-1">Check</p>
      <h1 className="text-[var(--color-text)] text-2xl font-bold mb-5">Can we afford this?</h1>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[var(--color-surface)] rounded-2xl p-1 mb-5">
        {TABS.map((label, i) => (
          <motion.button
            key={label}
            onClick={() => setTab(i)}
            whileTap={{ scale: 0.97 }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === i
                ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                : 'text-[var(--color-muted)]'
            }`}
          >
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 0 ? (
          <motion.div key="spend" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            <SpendCheck />
          </motion.div>
        ) : (
          <motion.div key="transport" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
            <TransportSim />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Spend Check ────────────────────────────────────────────────────────────

function SpendCheck() {
  const { computed } = useTrip()
  const [raw, setRaw]           = useState('')
  const [perPerson, setPerPerson] = useState(false)

  const amount      = parseFloat(raw) || 0
  const total       = perPerson ? amount * computed.memberCount : amount
  const perPersonAmt = computed.memberCount > 0 ? total / computed.memberCount : total

  const flex  = computed.flexibleRemaining
  const after = flex - total
  const pct   = flex > 0 ? total / flex : 1

  let verdict = null
  if (amount > 0) {
    if (after >= 0 && pct <= 0.4) verdict = 'yes'
    else if (after >= 0)          verdict = 'tight'
    else                          verdict = 'no'
  }

  const verdictConfig = {
    yes:   { label: 'You can afford this  ✓', color: 'var(--color-success)', dim: 'var(--color-success-dim)' },
    tight: { label: 'Possible, but tight  ⚡', color: 'var(--color-warning)', dim: 'var(--color-warning-dim)' },
    no:    { label: 'Over flexible budget  ✗', color: 'var(--color-danger)',  dim: 'var(--color-danger-dim)'  },
  }

  return (
    <div className="space-y-3">
      {/* Amount input */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-[var(--color-muted)] text-lg font-medium shrink-0">KES</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-[var(--color-text)] text-4xl font-bold outline-none placeholder:text-[var(--color-border-strong)]"
          />
        </div>
        <div className="flex gap-2">
          {['Total', `Per person (×${computed.memberCount})`].map((label, i) => (
            <motion.button
              key={i}
              onClick={() => setPerPerson(i === 1)}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                perPerson === (i === 1)
                  ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Budget context */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 space-y-2.5">
        <BalRow label="Flexible remaining" value={formatKES(flex)} highlight />
        <BalRow label="Already committed"  value={formatKES(computed.committedTotal)} muted />
        <div className="border-t border-[var(--color-border)] pt-2.5">
          <BalRow label="Total trip budget" value={formatKES(computed.totalBudget)} muted />
        </div>
      </div>

      {/* Verdict */}
      <AnimatePresence>
        {amount > 0 && verdict && (
          <motion.div
            key="verdict"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="rounded-2xl p-4"
            style={{ background: verdictConfig[verdict].dim }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: verdictConfig[verdict].color }}>
              {verdictConfig[verdict].label}
            </p>
            <div className="space-y-2">
              <BalRow label={perPerson ? `Total (${computed.memberCount} people)` : 'This purchase'} value={formatKES(total)} />
              {!perPerson && computed.memberCount > 1 && <BalRow label="Per person" value={formatKES(perPersonAmt)} muted />}
              {perPerson && <BalRow label="Entered per person" value={formatKES(amount)} muted />}
              <div className="border-t border-black/10 my-1" />
              <BalRow
                label="Flexible balance after"
                value={formatKES(after)}
                valueColor={after < 0 ? 'var(--color-danger)' : 'var(--color-success)'}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!amount && (
        <p className="text-center text-[var(--color-muted)] text-sm pt-6">Enter an amount above to check</p>
      )}
    </div>
  )
}

// ─── Transport Simulator ────────────────────────────────────────────────────

function TransportSim() {
  const { state } = useTrip()
  const [groupSize, setGroupSize] = useState(state.groupSize ?? 4)
  const [sgrPP,     setSgrPP]     = useState(state.trip.sgrCostPerPerson ?? 1000)
  const [carCost,   setCarCost]   = useState(state.trip.carTotalCost     ?? 0)

  const sgrTotal    = sgrPP * groupSize
  const crossover   = sgrPP > 0 ? carCost / sgrPP : Infinity // group size where car == sgr
  const carIsCheaper = carCost > 0 && carCost < sgrTotal
  const sgrIsCheaper = !carIsCheaper && carCost > 0
  const carPerPerson = groupSize > 0 ? carCost / groupSize : 0

  const maxBar = Math.max(sgrTotal, carCost, 1)

  return (
    <div className="space-y-4">
      {/* Inputs */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 space-y-4">
        {/* Group size stepper */}
        <div>
          <p className="text-[var(--color-muted)] text-xs font-medium mb-2">Group size</p>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setGroupSize(s => Math.max(1, s - 1))}
              whileTap={{ scale: 0.85 }}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] text-lg font-bold flex items-center justify-center"
            >−</motion.button>
            <span className="flex-1 text-center text-[var(--color-text)] text-2xl font-bold">{groupSize}</span>
            <motion.button
              onClick={() => setGroupSize(s => Math.min(20, s + 1))}
              whileTap={{ scale: 0.85 }}
              className="w-9 h-9 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text)] text-lg font-bold flex items-center justify-center"
            >+</motion.button>
          </div>
        </div>

        {/* SGR cost */}
        <div>
          <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">SGR cost per person (KES)</p>
          <input
            type="number"
            inputMode="numeric"
            className="input-field"
            value={sgrPP}
            onChange={e => setSgrPP(Number(e.target.value) || 0)}
            placeholder="1000"
          />
        </div>

        {/* Car cost */}
        <div>
          <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Car total cost (KES)</p>
          <input
            type="number"
            inputMode="numeric"
            className="input-field"
            value={carCost}
            onChange={e => setCarCost(Number(e.target.value) || 0)}
            placeholder="e.g. 4500"
          />
        </div>
      </div>

      {/* Comparison bars */}
      {carCost > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-4 space-y-4">
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium">Comparison</p>

          {/* SGR bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[var(--color-text)] text-sm font-medium">🚆 SGR</span>
              <div className="text-right">
                <span className="text-[var(--color-text)] text-sm font-bold tabular-nums">{formatKES(sgrTotal)}</span>
                <span className="text-[var(--color-muted)] text-xs ml-1">({formatKES(sgrPP)}/person)</span>
              </div>
            </div>
            <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: sgrIsCheaper ? 'var(--color-success)' : carIsCheaper ? 'var(--color-danger)' : 'var(--color-primary)' }}
                animate={{ width: `${(sgrTotal / maxBar) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              />
            </div>
          </div>

          {/* Car bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[var(--color-text)] text-sm font-medium">🚗 Car</span>
              <div className="text-right">
                <span className="text-[var(--color-text)] text-sm font-bold tabular-nums">{formatKES(carCost)}</span>
                <span className="text-[var(--color-muted)] text-xs ml-1">({formatKES(carPerPerson)}/person)</span>
              </div>
            </div>
            <div className="h-3 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: carIsCheaper ? 'var(--color-success)' : 'var(--color-muted)' }}
                animate={{ width: `${(carCost / maxBar) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              />
            </div>
          </div>

          {/* Verdict */}
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: carIsCheaper ? 'var(--color-success-dim)' : 'var(--color-primary-dim)',
            }}
          >
            {carIsCheaper ? (
              <p className="text-[var(--color-success)] text-sm font-semibold">
                🚗 Car saves {formatKES(sgrTotal - carCost)} ({formatKES(sgrPP - carPerPerson)}/person)
              </p>
            ) : sgrIsCheaper ? (
              <p className="text-[var(--color-primary)] text-sm font-semibold">
                🚆 SGR saves {formatKES(carCost - sgrTotal)} at this group size
              </p>
            ) : (
              <p className="text-[var(--color-muted)] text-sm">Same cost at this group size</p>
            )}
          </div>

          {/* Crossover info */}
          {sgrPP > 0 && carCost > 0 && isFinite(crossover) && (
            <p className="text-[var(--color-muted)] text-xs text-center">
              Car becomes cheaper at{' '}
              <span className="text-[var(--color-text)] font-semibold">
                {Math.ceil(crossover)} people
              </span>
              {' '}or more
            </p>
          )}
        </div>
      )}

      {carCost === 0 && (
        <p className="text-center text-[var(--color-muted)] text-sm pt-4">
          Enter a car total cost above to compare with SGR
        </p>
      )}
    </div>
  )
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function BalRow({ label, value, muted, highlight, valueColor }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-[var(--color-primary)]' : muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'
        }`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
    </div>
  )
}
