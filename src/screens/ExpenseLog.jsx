import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, subDays, isToday, isYesterday } from 'date-fns'
import { useSearchParams } from 'react-router-dom'
import { useTrip } from '../context/TripContext'
import { formatKES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../lib/constants'
import { CloseIcon } from '../components/icons'
import { parseExpenseWithClaude, hasClaudeKey } from '../lib/claude'

// ─── Heuristic parser ────────────────────────────────────────────────────────

const DAYS_FULL = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const DAYS_ABBR = ['sun','mon','tue','wed','thu','fri','sat']

const CATEGORY_KW = {
  food:          ['nyama','choma','ugali','lunch','dinner','breakfast','meal','restaurant','chips','pilau','biryani','seafood','fish','pizza','mkate'],
  drinks:        ['beer','wine','cocktail','juice','tusker','whisky','vodka','bar','pombe','drink','soda'],
  transport:     ['uber','taxi','sgr','matatu','boda','ferry','fuel','parking','bolt','tuk','transport'],
  activities:    ['entry','ticket','fort','camel','jet ski','waterpark','park','aws','karting','cruise','dhow','splash','activity'],
  accommodation: ['hotel','airbnb','room','accommodation','lodge'],
  shopping:      ['shopping','souvenir','kanga','kikoi'],
  photography:   ['photo','photography','pics','selfie','photographer'],
  tips:          ['tip','tips','kitu kidogo'],
  data:          ['data','airtime','safaricom'],
}

function parseQuickEntry(raw, members, tripStartDate) {
  const text  = raw.trim()
  const lower = text.toLowerCase()

  // Amount — largest number >= 10
  const amtObj = [...text.matchAll(/\b(\d{1,3}(?:,\d{3})*|\d+)\b/g)]
    .map(m => ({ raw: m[0], val: Number(m[1].replace(/,/g, '')), idx: m.index }))
    .filter(a => a.val >= 10)
    .sort((a, b) => b.val - a.val)[0] ?? null

  // Date
  const now = new Date()
  let date = format(now, 'yyyy-MM-dd')

  if (lower.includes('yesterday')) {
    date = format(subDays(now, 1), 'yyyy-MM-dd')
  } else if (!lower.includes('today')) {
    let dayIdx = DAYS_FULL.findIndex(d => lower.includes(d))
    if (dayIdx < 0) dayIdx = DAYS_ABBR.findIndex(d => new RegExp(`\\b${d}\\b`).test(lower))
    if (dayIdx >= 0) {
      const diff = (now.getDay() - dayIdx + 7) % 7
      date = format(subDays(now, diff), 'yyyy-MM-dd')
    }
    const jm = lower.match(/jul\s+(\d{1,2})|(\d{1,2})\s+jul/)
    if (jm) date = `2026-07-${String(parseInt(jm[1] ?? jm[2])).padStart(2, '0')}`
    const dm = lower.match(/\b(\d{1,2})\/(\d{1,2})\b/)
    if (dm) date = `2026-${String(dm[2]).padStart(2, '0')}-${String(dm[1]).padStart(2, '0')}`
  }

  const isPreTrip = date < tripStartDate

  // Category
  let category = 'other'
  for (const [cat, kws] of Object.entries(CATEGORY_KW)) {
    if (kws.some(k => lower.includes(k))) { category = cat; break }
  }

  // Paid by — member name
  let paidBy = null
  for (const m of members) {
    if (lower.includes(m.name.toLowerCase())) { paidBy = m.id; break }
  }

  // Description — strip amount, date words, member names
  let desc = text
  if (amtObj) desc = (text.slice(0, amtObj.idx) + text.slice(amtObj.idx + amtObj.raw.length)).trim()
  ;['today','yesterday','everyone', ...DAYS_FULL, ...DAYS_ABBR].forEach(w => {
    desc = desc.replace(new RegExp(`\\b${w}\\b`, 'gi'), '').trim()
  })
  for (const m of members) desc = desc.replace(new RegExp(`\\b${m.name}\\b`, 'gi'), '').trim()
  desc = desc.replace(/\s+/g, ' ').trim() || text.trim()

  return { description: desc, amount: amtObj?.val ?? null, category, date, isPreTrip, paidBy }
}

// ─── Grouping + labels ───────────────────────────────────────────────────────

function groupExpenses(expenses) {
  const map = {}
  for (const e of expenses) {
    const k = e.date ?? format(new Date(), 'yyyy-MM-dd')
    if (!map[k]) map[k] = []
    map[k].push(e)
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items, total: items.reduce((s, e) => s + e.amount, 0) }))
}

function dateLabel(str) {
  try {
    const d = parseISO(str)
    if (isToday(d))     return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'EEE, d MMM')
  } catch { return str }
}

// ─── Animations ──────────────────────────────────────────────────────────────

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
const fadeUp  = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } } }

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ExpenseLog() {
  const { state, dispatch } = useTrip()
  const [searchParams, setSearchParams] = useSearchParams()
  const [quick, setQuick] = useState('')
  const [sheet, setSheet] = useState(null)
  const [parsing, setParsing] = useState(false)

  // Open pre-filled sheet when navigated from itinerary "Log →" button
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSheet({
        initial: {
          amount:      searchParams.get('amount') ? Number(searchParams.get('amount')) : '',
          description: decodeURIComponent(searchParams.get('desc') ?? ''),
          date:        searchParams.get('date') ?? format(new Date(), 'yyyy-MM-dd'),
          category:    'activities',
        },
      })
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const confirmedMembers = state.members.filter(m => m.status === 'confirmed')
  const groups     = useMemo(() => groupExpenses(state.expenses), [state.expenses])
  const tripTotal  = state.expenses.filter(e => !e.isPreTrip).reduce((s, e) => s + e.amount, 0)
  const preTotal   = state.expenses.filter(e =>  e.isPreTrip).reduce((s, e) => s + e.amount, 0)

  const openParse = useCallback(async () => {
    if (!quick.trim()) return
    if (hasClaudeKey) {
      setParsing(true)
      try {
        const result = await parseExpenseWithClaude(quick, confirmedMembers, state.trip.startDate)
        if (result) {
          setSheet({ initial: result })
          setQuick('')
          return
        }
      } catch {
        // fall through to local parser
      } finally {
        setParsing(false)
      }
    }
    const parsed = parseQuickEntry(quick, confirmedMembers, state.trip.startDate)
    setSheet({ initial: parsed })
    setQuick('')
  }, [quick, confirmedMembers, state.trip.startDate])

  function handleSave(data) {
    dispatch({ type: 'ADD_EXPENSE', payload: { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data } })
    setSheet(null)
  }

  return (
    <motion.div className="min-h-full bg-[var(--color-bg)] pb-10" variants={stagger} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={fadeUp} className="px-5 pt-12 pb-4">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-1">Spending</p>
        <div className="flex items-end justify-between">
          <h1 className="text-[var(--color-text)] text-3xl font-bold">Expenses</h1>
          <div className="text-right">
            <p className="text-[var(--color-text)] font-bold text-xl tabular-nums">{formatKES(tripTotal)}</p>
            <p className="text-[var(--color-muted)] text-xs">trip total</p>
          </div>
        </div>
        {preTotal > 0 && (
          <p className="text-[var(--color-muted)] text-xs mt-1">+ {formatKES(preTotal)} pre-trip</p>
        )}
      </motion.div>

      {/* Quick entry bar */}
      <motion.div variants={fadeUp} className="mx-4 mb-5">
        <div className="flex gap-2">
          <input
            type="text"
            value={quick}
            onChange={e => setQuick(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !parsing && openParse()}
            placeholder='"nyama choma 3500 saturday"'
            className="input-field flex-1 text-sm"
            disabled={parsing}
          />
          <motion.button
            onClick={quick.trim() ? openParse : () => setSheet({ initial: {} })}
            disabled={parsing}
            className="px-4 rounded-2xl font-semibold text-sm shrink-0"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', opacity: parsing ? 0.7 : 1 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {parsing ? '…' : quick.trim() ? 'Parse →' : '+ Add'}
          </motion.button>
        </div>
        <p className="text-[var(--color-muted)] text-[10px] mt-1.5 px-1">
          {hasClaudeKey
            ? 'AI powered — type anything natural and hit Parse'
            : 'Type spend + amount (+ who paid, day) and hit Parse — or tap + Add'}
        </p>
      </motion.div>

      {/* Empty state */}
      {groups.length === 0 && (
        <motion.div variants={fadeUp} className="text-center py-16 px-8">
          <motion.p className="text-5xl mb-3" animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
            💸
          </motion.p>
          <p className="text-[var(--color-text)] font-semibold mb-1">No expenses yet</p>
          <p className="text-[var(--color-muted)] text-sm">Type what you spent above and hit <strong>Parse</strong></p>
        </motion.div>
      )}

      {/* Expense list */}
      {groups.length > 0 && (
        <div className="px-4 space-y-5">
          {groups.map(group => (
            <motion.div key={group.date} variants={fadeUp}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text)] text-sm font-semibold">{dateLabel(group.date)}</span>
                  {group.date < state.trip.startDate && (
                    <span className="text-[10px] font-medium text-[var(--color-warning)] bg-[var(--color-warning-dim)] px-1.5 py-0.5 rounded-full">
                      pre-trip
                    </span>
                  )}
                </div>
                <span className="text-[var(--color-muted)] text-xs tabular-nums">{formatKES(group.total)}</span>
              </div>

              <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
                <AnimatePresence>
                  {group.items.map(expense => {
                    const cat    = EXPENSE_CATEGORIES.find(c => c.id === expense.category)
                    const member = confirmedMembers.find(m => m.id === expense.paidBy)
                    const pm     = PAYMENT_METHODS.find(p => p.id === expense.paymentMethod)
                    return (
                      <motion.div
                        key={expense.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="text-xl w-7 text-center shrink-0">{cat?.icon ?? '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--color-text)] text-sm font-medium truncate">{expense.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {member && (
                              <span className="text-[10px] text-[var(--color-primary)] bg-[var(--color-primary-dim)] px-1.5 py-0.5 rounded-full">
                                {member.name}
                              </span>
                            )}
                            {pm && <span className="text-[10px] text-[var(--color-muted)]">{pm.label}</span>}
                            {expense.splitBetween?.length > 0 && expense.splitBetween.length < confirmedMembers.length && (
                              <span className="text-[10px] text-[var(--color-muted)]">
                                {expense.splitBetween.length}/{confirmedMembers.length} members
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[var(--color-text)] font-semibold text-sm tabular-nums">{formatKES(expense.amount)}</span>
                          <motion.button
                            onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: expense.id })}
                            className="text-[var(--color-muted)] p-1 rounded-full"
                            whileTap={{ scale: 0.8 }}
                          >
                            <CloseIcon size={14} stroke="currentColor" />
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {sheet && (
          <AddExpenseSheet
            initial={sheet.initial}
            tripStartDate={state.trip.startDate}
            members={confirmedMembers}
            onSave={handleSave}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add Expense Sheet ────────────────────────────────────────────────────────

function AddExpenseSheet({ initial, tripStartDate, members, onSave, onClose }) {
  const [form, setForm] = useState({
    description:   initial?.description   ?? '',
    amount:        initial?.amount        ?? '',
    category:      initial?.category      ?? 'food',
    date:          initial?.date          ?? format(new Date(), 'yyyy-MM-dd'),
    paidBy:        initial?.paidBy        ?? null,
    paymentMethod: 'mpesa',
    isPreTrip:     initial?.isPreTrip     ?? false,
    splitBetween:  initial?.splitBetween  ?? members.map(m => m.id),
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function handleDate(d) {
    set('date', d)
    set('isPreTrip', d < tripStartDate)
  }

  const canSave = Number(form.amount) > 0 && form.description.trim() && (members.length === 0 || form.splitBetween.length > 0)

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)] max-h-[90vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)] shrink-0">
          <span className="font-semibold text-[var(--color-text)]">Log expense</span>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        {/* Scrollable form */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Amount — big */}
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">
              Amount (KES)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xl font-light pointer-events-none">KES</span>
              <input
                type="number"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0"
                className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-2xl py-4 pl-16 pr-4 text-3xl font-bold text-[var(--color-text)] text-right focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                inputMode="numeric"
                autoFocus={!initial?.amount}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Nyama choma at Mama Ngina"
              className="input-field"
            />
          </div>

          {/* Category grid 5×2 */}
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  onClick={() => set('category', cat.id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border ${
                    form.category === cat.id
                      ? 'bg-[var(--color-primary-dim)] border-[color:var(--color-primary)]/30'
                      : 'bg-[var(--color-surface-2)] border-[var(--color-border)]'
                  }`}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <span className={`text-[9px] leading-none mt-0.5 ${form.category === cat.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
                    {cat.label.split(' ')[0]}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Date + Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Date</label>
              <input type="date" value={form.date} onChange={e => handleDate(e.target.value)} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Payment</label>
              <div className="space-y-1.5">
                {PAYMENT_METHODS.map(p => (
                  <motion.button key={p.id} onClick={() => set('paymentMethod', p.id)}
                    className="w-full py-1.5 px-2 rounded-xl text-xs font-medium"
                    animate={{
                      backgroundColor: form.paymentMethod === p.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      color:           form.paymentMethod === p.id ? 'var(--color-bg)'      : 'var(--color-muted)',
                    }}
                    transition={{ duration: 0.15 }} whileTap={{ scale: 0.94 }}>
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Paid by */}
          {members.length > 0 && (
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Paid by</label>
              <div className="flex flex-wrap gap-2">
                {[{ id: null, name: 'Group' }, ...members].map(m => (
                  <motion.button key={m.id ?? 'group'} onClick={() => set('paidBy', m.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium"
                    animate={{
                      backgroundColor: form.paidBy === m.id ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      color:           form.paidBy === m.id ? 'var(--color-bg)'      : 'var(--color-muted)',
                    }}
                    transition={{ duration: 0.15 }} whileTap={{ scale: 0.92 }}>
                    {m.name}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Split between */}
          {members.length > 1 && (
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">
                Split between
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = form.splitBetween.includes(m.id)
                  return (
                    <motion.button
                      key={m.id}
                      onClick={() => set('splitBetween', selected
                        ? form.splitBetween.filter(id => id !== m.id)
                        : [...form.splitBetween, m.id]
                      )}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      animate={{
                        backgroundColor: selected ? 'var(--color-primary)' : 'var(--color-surface-2)',
                        color:           selected ? 'var(--color-bg)'      : 'var(--color-muted)',
                      }}
                      transition={{ duration: 0.15 }} whileTap={{ scale: 0.92 }}
                    >
                      {m.name}
                    </motion.button>
                  )
                })}
              </div>
              {form.splitBetween.length > 0 && form.splitBetween.length < members.length && (
                <p className="text-[var(--color-muted)] text-[10px] mt-1.5 px-1">
                  Only these {form.splitBetween.length} member{form.splitBetween.length > 1 ? 's' : ''} share this cost
                </p>
              )}
              {form.splitBetween.length === 0 && (
                <p className="text-[var(--color-danger)] text-[10px] mt-1.5 px-1">
                  Select at least one member
                </p>
              )}
            </div>
          )}

          {/* Pre-trip toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide">Pre-trip</p>
              <p className="text-[var(--color-muted)] text-[10px] mt-0.5">Won't count against trip budget</p>
            </div>
            <motion.button onClick={() => set('isPreTrip', !form.isPreTrip)}
              className="w-10 h-5 rounded-full relative shrink-0"
              animate={{ backgroundColor: form.isPreTrip ? 'var(--color-primary)' : 'var(--color-surface-3)' }}
              transition={{ duration: 0.15 }}>
              <motion.span className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ left: form.isPreTrip ? '22px' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }} />
            </motion.button>
          </div>
        </div>

        {/* Save — always visible */}
        <div className="px-5 py-3 shrink-0 border-t border-[var(--color-border)]">
          <motion.button
            onClick={() => canSave && onSave({ ...form, amount: Number(form.amount) })}
            className="w-full py-4 rounded-2xl font-semibold text-base"
            style={{
              backgroundColor: canSave ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color:           canSave ? 'var(--color-bg)'      : 'var(--color-muted)',
            }}
            whileTap={canSave ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            Save expense
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
