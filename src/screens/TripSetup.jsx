import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useTrip } from '../context/TripContext'
import { formatKES } from '../lib/constants'
import { seedDemoData } from '../lib/demoSeed'
import {
  BackIcon, ForwardIcon, MapPinIcon, CalendarIcon,
  WalletIcon, TrainIcon, CarIcon, CloseIcon,
} from '../components/icons'

const STEPS = 3

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
}

const transition = { type: 'spring', stiffness: 340, damping: 34 }

export default function TripSetup() {
  const { state, dispatch } = useTrip()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [_showReset, _setShowReset] = useState(false)

  const [form, setFormState] = useState({
    name: state.trip.name,
    destination: state.trip.destination,
    startDate: state.trip.startDate,
    endDate: state.trip.endDate,
    preTripDate: state.trip.preTripDate ?? '',
    budgetPerPerson: state.trip.budgetPerPerson,
    monthlyBudget: state.monthlyBudget ?? '',
    transportMode: state.trip.transportMode ?? 'sgr',
    sgrCostPerPerson: state.trip.sgrCostPerPerson ?? 1000,
    carTotalCost: state.trip.carTotalCost ?? 0,
    groupSize: state.groupSize ?? 1,
    // Pre-fill names from existing members; empty strings for unfilled slots
    memberNames: Array.from({ length: state.groupSize ?? 1 }, (_, i) => state.members?.[i]?.name ?? ''),
    budgetMode: 'perPerson',
  })

  function set(key, val) {
    setFormState(f => {
      if (key === 'groupSize') {
        const names = Array.from({ length: val }, (_, i) => f.memberNames?.[i] ?? (state.members?.[i]?.name ?? ''))
        return { ...f, groupSize: val, memberNames: names }
      }
      return { ...f, [key]: val }
    })
  }

  function next() { setDir(1); setStep(s => Math.min(s + 1, STEPS - 1)) }
  function back() { setDir(-1); setStep(s => Math.max(s - 1, 0)) }

  function save() {
    const perPerson = form.budgetMode === 'total'
      ? Math.round(Number(form.budgetPerPerson) / form.groupSize)
      : Number(form.budgetPerPerson)
    dispatch({
      type: 'COMPLETE_SETUP',
      payload: {
        ...form,
        budgetPerPerson: perPerson,
        groupSize: form.groupSize,
        monthlyBudget: form.monthlyBudget ? Number(form.monthlyBudget) : null,
      },
    })
    navigate('/')
  }

  function resetToWizard() {
    dispatch({ type: 'RESET_SETUP' })
  }

  const tripDays = form.startDate && form.endDate
    ? differenceInCalendarDays(parseISO(form.endDate), parseISO(form.startDate)) + 1
    : 0
  const dailyBudget = tripDays > 0 && form.budgetPerPerson
    ? Math.round(Number(form.budgetPerPerson) / tripDays)
    : 0

  return (
    <div className="fixed inset-0 bg-[var(--color-bg)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <motion.button
          onClick={step === 0 ? () => navigate(-1) : back}
          className="p-2 rounded-full text-[var(--color-muted)]"
          whileTap={{ scale: 0.85 }}
        >
          <BackIcon size={22} stroke="currentColor" />
        </motion.button>

        <div className="flex gap-2">
          {Array.from({ length: STEPS }).map((_, i) => (
            <motion.span
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 24 : 6,
                backgroundColor: i <= step ? 'var(--color-primary)' : 'var(--color-surface-3)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          ))}
        </div>

        <motion.button
          onClick={() => navigate('/')}
          className="p-2 rounded-full text-[var(--color-muted)]"
          whileTap={{ scale: 0.85 }}
        >
          <CloseIcon size={18} stroke="currentColor" />
        </motion.button>
      </div>

      {/* Step content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={dir} mode="wait" initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="absolute inset-0 px-5 pt-6 pb-4 overflow-y-auto"
          >
            {step === 0 && <Step1 form={form} set={set} />}
            {step === 1 && <Step2 form={form} set={set} tripDays={tripDays} dailyBudget={dailyBudget} />}
            {step === 2 && <Step3 form={form} set={set} tripDays={tripDays} dailyBudget={dailyBudget} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="px-5 pb-6 pt-4 space-y-3">
        <motion.button
          onClick={step < STEPS - 1 ? next : save}
          className="w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          {step < STEPS - 1 ? <>Continue <ForwardIcon size={18} stroke="currentColor" /></> : 'Save changes'}
        </motion.button>

        {/* Reset to wizard */}
        {step === 0 && (
          <motion.button
            onClick={resetToWizard}
            className="w-full py-3 text-[var(--color-muted)] text-sm text-center"
            whileTap={{ scale: 0.97 }}
          >
            Re-run setup wizard →
          </motion.button>
        )}

        {/* Dev: load rich demo data */}
        {step === 0 && (
          <motion.button
            onClick={seedDemoData}
            className="w-full py-2.5 text-[var(--color-muted)] text-xs text-center border border-dashed border-[var(--color-border)] rounded-xl"
            whileTap={{ scale: 0.97 }}
          >
            Load demo data (testing)
          </motion.button>
        )}
      </div>
    </div>
  )
}

/* Reuse the same step components */
function Field({ label, icon, hint, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[var(--color-muted-2)] text-xs font-medium mb-2 uppercase tracking-wide">
        {icon}{label}
      </label>
      {children}
      {hint && <p className="text-[var(--color-muted)] text-xs mt-1">{hint}</p>}
    </div>
  )
}

function Chip({ label, value, accent }) {
  return (
    <div className={`flex-1 rounded-xl px-3 py-2 text-center ${
      accent ? 'bg-[var(--color-primary-dim)] border border-[color:var(--color-primary)]/20'
              : 'bg-[var(--color-surface-2)] border border-[var(--color-border)]'
    }`}>
      <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide">{label}</p>
      <p className={`font-bold text-sm ${accent ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>{value}</p>
    </div>
  )
}

function TransportOption({ active, onClick, icon, label, detail }) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border text-center transition-colors ${
        active ? 'bg-[var(--color-primary-dim)] border-[color:var(--color-primary)]/40 text-[var(--color-primary)]'
               : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-muted)]'
      }`}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      {icon}
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-[10px] opacity-70">{detail}</span>
    </motion.button>
  )
}

function Step1({ form, set }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-2">Trip details</p>
        <h2 className="text-[var(--color-text)] text-3xl font-bold leading-tight">Edit your trip</h2>
      </div>
      <Field label="Trip name" icon={<span className="text-base">✈️</span>}>
        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Mombasa Weekend" className="input-field" />
      </Field>
      <Field label="Destination" icon={<MapPinIcon size={16} stroke="var(--color-primary)" />}>
        <input type="text" value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="e.g. Mombasa, Kenya" className="input-field" />
      </Field>
    </div>
  )
}

function Step2({ form, set, tripDays, dailyBudget }) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-2">Dates</p>
        <h2 className="text-[var(--color-text)] text-3xl font-bold leading-tight">When's the trip?</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date" icon={<CalendarIcon size={16} stroke="var(--color-primary)" />}>
          <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input-field" />
        </Field>
        <Field label="End date" icon={<CalendarIcon size={16} stroke="var(--color-muted)" />}>
          <input type="date" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} className="input-field" />
        </Field>
      </div>
      <Field label="Pre-trip departure (optional)" icon={<span className="text-base">🚂</span>}>
        <input type="date" value={form.preTripDate} onChange={e => set('preTripDate', e.target.value)} className="input-field" />
      </Field>
      {tripDays > 0 && (
        <div className="flex gap-3">
          <Chip label="Duration" value={`${tripDays} day${tripDays !== 1 ? 's' : ''}`} />
          {dailyBudget > 0 && <Chip label="Daily budget" value={formatKES(dailyBudget)} accent />}
        </div>
      )}
    </div>
  )
}

function Step3({ form, set, tripDays, _dailyBudget }) {
  const isTotal = form.budgetMode === 'total'
  const budgetNum = Number(form.budgetPerPerson) || 0
  const perPerson = isTotal ? (form.groupSize > 0 ? Math.round(budgetNum / form.groupSize) : 0) : budgetNum
  const total = isTotal ? budgetNum : budgetNum * form.groupSize
  const dailyPerPerson = tripDays > 0 && perPerson > 0 ? Math.round(perPerson / tripDays) : 0

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-2">Money</p>
        <h2 className="text-[var(--color-text)] text-3xl font-bold leading-tight">Budget & transport</h2>
      </div>

      {/* Group size stepper */}
      <div>
        <label className="flex items-center gap-1.5 text-[var(--color-muted-2)] text-xs font-medium mb-3 uppercase tracking-wide">
          <span className="text-base">👥</span> Group size
        </label>
        <div className="flex items-center gap-4">
          <motion.button onClick={() => set('groupSize', Math.max(1, form.groupSize - 1))}
            className="w-11 h-11 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-xl flex items-center justify-center"
            whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>−</motion.button>
          <div className="flex-1 text-center">
            <motion.span key={form.groupSize} className="text-4xl font-bold text-[var(--color-text)] block"
              initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}>{form.groupSize}</motion.span>
            <span className="text-[var(--color-muted)] text-xs">{form.groupSize === 1 ? 'person' : 'people'}</span>
          </div>
          <motion.button onClick={() => set('groupSize', Math.min(20, form.groupSize + 1))}
            className="w-11 h-11 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] text-xl flex items-center justify-center"
            whileTap={{ scale: 0.88 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>+</motion.button>
        </div>
      </div>

      {/* Who's coming — member names */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide">
            <span className="text-base">👤</span> Who's coming?
          </label>
          <span className="text-[var(--color-muted)] text-[10px]">optional · tracks spending</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: Math.min(form.groupSize, 8) }).map((_, i) => (
            <motion.input
              key={i}
              type="text"
              value={form.memberNames?.[i] ?? ''}
              onChange={e => {
                const names = [...(form.memberNames ?? [])]
                names[i] = e.target.value
                set('memberNames', names)
              }}
              placeholder={`Person ${i + 1}`}
              className="input-field text-sm"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 28 }}
            />
          ))}
        </div>
        {form.groupSize > 8 && (
          <p className="text-[var(--color-muted)] text-xs mt-1.5">
            +{form.groupSize - 8} more can be added on the Members screen
          </p>
        )}
      </div>

      {/* Budget toggle */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-1.5 text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide">
            <WalletIcon size={16} stroke="var(--color-primary)" /> Budget (KES)
          </label>
          <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)] text-xs">
            {['perPerson', 'total'].map(mode => (
              <motion.button key={mode} onClick={() => set('budgetMode', mode)} className="px-3 py-1.5 font-medium"
                animate={{ backgroundColor: form.budgetMode === mode ? 'var(--color-primary)' : 'var(--color-surface-2)', color: form.budgetMode === mode ? 'var(--color-bg)' : 'var(--color-muted)' }}
                transition={{ duration: 0.18 }}>
                {mode === 'perPerson' ? 'Per person' : 'Total'}
              </motion.button>
            ))}
          </div>
        </div>
        <input type="number" value={form.budgetPerPerson} onChange={e => set('budgetPerPerson', e.target.value)}
          placeholder={isTotal ? `e.g. ${25000 * form.groupSize}` : 'e.g. 25000'} className="input-field" inputMode="numeric" />
        {budgetNum > 0 && (
          <div className="flex gap-2 mt-2">
            {isTotal ? <Chip label="Per person" value={formatKES(perPerson)} accent /> : <Chip label="Group total" value={formatKES(total)} />}
            {dailyPerPerson > 0 && <Chip label="Per day" value={formatKES(dailyPerPerson)} accent={!isTotal} />}
          </div>
        )}
      </div>

      {/* Transport */}
      <div>
        <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-semibold mb-3">Getting there</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <TransportOption active={form.transportMode === 'sgr'} onClick={() => set('transportMode', 'sgr')}
            icon={<TrainIcon size={20} stroke="currentColor" />} label="SGR"
            detail={form.sgrCostPerPerson ? `KES ${Number(form.sgrCostPerPerson).toLocaleString()}/person` : 'Set cost below'} />
          <TransportOption active={form.transportMode === 'car'} onClick={() => set('transportMode', 'car')}
            icon={<CarIcon size={20} stroke="currentColor" />} label="Car rental"
            detail={form.carTotalCost ? `KES ${Number(form.carTotalCost).toLocaleString()} total` : 'Set cost below'} />
        </div>

        <AnimatePresence mode="wait">
          {form.transportMode === 'sgr' && (
            <motion.div key="sgr" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} className="space-y-2">
              <Field label="SGR cost per person (KES)" icon={<TrainIcon size={14} stroke="var(--color-primary)" />} hint="Round trip: 2,000 · One way: 1,000">
                <input type="number" value={form.sgrCostPerPerson} onChange={e => set('sgrCostPerPerson', e.target.value)}
                  placeholder="e.g. 2000" className="input-field" inputMode="numeric" />
              </Field>
              {Number(form.sgrCostPerPerson) > 0 && (
                <Chip label="Group SGR total" value={formatKES(Number(form.sgrCostPerPerson) * form.groupSize)} />
              )}
            </motion.div>
          )}
          {form.transportMode === 'car' && (
            <motion.div key="car" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} className="space-y-2">
              <Field label="Car rental total (KES)" icon={<CarIcon size={14} stroke="var(--color-primary)" />} hint="Shared equally among the group">
                <input type="number" value={form.carTotalCost} onChange={e => set('carTotalCost', e.target.value)}
                  placeholder="e.g. 15000" className="input-field" inputMode="numeric" />
              </Field>
              {Number(form.carTotalCost) > 0 && form.groupSize > 0 && (
                <Chip label="Per person" value={formatKES(Math.round(Number(form.carTotalCost) / form.groupSize))} accent />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
