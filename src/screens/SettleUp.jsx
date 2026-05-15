import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useTrip } from '../context/TripContext'
import { formatKES, EXPENSE_CATEGORIES } from '../lib/constants'

function calcSettlement(expenses, members, memberCount) {
  if (!members.length || memberCount === 0) {
    return { transactions: [], balances: [], total: 0, fairShare: 0 }
  }

  const allMemberIds = members.map(m => m.id)
  const paid = {}
  const owes = {}
  for (const m of members) { paid[m.id] = 0; owes[m.id] = 0 }

  let total = 0
  for (const e of expenses) {
    total += e.amount
    if (e.paidBy && paid[e.paidBy] !== undefined) {
      paid[e.paidBy] += e.amount
    }
    // Use splitBetween if set, otherwise split among everyone
    const splitIds = (e.splitBetween?.length > 0)
      ? e.splitBetween.filter(id => owes[id] !== undefined)
      : allMemberIds
    if (splitIds.length > 0) {
      const share = e.amount / splitIds.length
      for (const id of splitIds) owes[id] += share
    }
  }

  const fairShare = total / memberCount
  const balances = members.map(m => {
    const charges = expenses
      .filter(e => {
        const splitIds = e.splitBetween?.length > 0
          ? e.splitBetween.filter(id => owes[id] !== undefined)
          : allMemberIds
        return splitIds.includes(m.id)
      })
      .map(e => {
        const splitIds = e.splitBetween?.length > 0
          ? e.splitBetween.filter(id => owes[id] !== undefined)
          : allMemberIds
        return {
          id:          e.id,
          description: e.description,
          date:        e.date,
          category:    e.category,
          share:       e.amount / splitIds.length,
          splitCount:  splitIds.length,
        }
      })
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    return {
      id:      m.id,
      name:    m.name,
      paid:    paid[m.id],
      owes:    owes[m.id],
      balance: paid[m.id] - owes[m.id],
      charges,
    }
  })

  // Greedy debt minimization
  const creditors = balances.filter(b => b.balance >  0.5).map(b => ({ ...b })).sort((a, b) => b.balance - a.balance)
  const debtors   = balances.filter(b => b.balance < -0.5).map(b => ({ ...b })).sort((a, b) => a.balance - b.balance)

  const transactions = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].balance, -debtors[di].balance)
    if (amount > 0.5) {
      transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount })
    }
    creditors[ci].balance -= amount
    debtors[di].balance   += amount
    if (creditors[ci].balance < 0.5)  ci++
    if (Math.abs(debtors[di].balance) < 0.5) di++
  }

  return { transactions, balances, total, fairShare }
}

export default function SettleUp() {
  const { state, computed } = useTrip()

  const { transactions, balances, total, fairShare } = useMemo(
    () => calcSettlement(
      state.expenses.filter(e => !e.isPreTrip),
      computed.confirmedMembers,
      computed.memberCount,
    ),
    [state.expenses, computed.confirmedMembers, computed.memberCount],
  )

  const [expandedId, setExpandedId] = useState(null)
  const [expandedTxId, setExpandedTxId] = useState(null)
  const hasExpenses = state.expenses.filter(e => !e.isPreTrip).length > 0
  const hasMembers  = computed.confirmedMembers.length > 0

  return (
    <div className="min-h-full bg-[var(--color-bg)] px-5 pt-12 pb-8">
      <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-1">End of trip</p>
      <h1 className="text-[var(--color-text)] text-2xl font-bold mb-2">Settle Up</h1>
      <p className="text-[var(--color-muted)] text-sm mb-6">Who owes who after the trip</p>

      {!hasMembers ? (
        <Empty icon="👥" title="No confirmed members" desc="Add members in the Members screen first" />
      ) : !hasExpenses ? (
        <Empty icon="🧾" title="No trip expenses yet" desc="Log expenses with 'paid by' to calculate debts" />
      ) : (
        <>
          {/* Summary */}
          <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-4">
            <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3">Summary</p>
            <div className="space-y-2">
              <Row label="Total trip spend"               value={formatKES(total)} />
              <Row label={`Fair share (÷${computed.memberCount})`} value={formatKES(fairShare)} muted />
            </div>
          </div>

          {/* Per-member contributions */}
          <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden mb-4">
            <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium px-4 pt-4 pb-3">Contributions</p>
            <div className="divide-y divide-[var(--color-border)]">
              {balances.map(m => (
                <div key={m.id}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  >
                    <div className="text-left">
                      <p className="text-[var(--color-text)] text-sm font-medium">{m.name}</p>
                      <p className="text-[var(--color-muted)] text-xs">
                        paid {formatKES(m.paid)} · owes {formatKES(m.owes)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: m.balance >  0.5 ? 'var(--color-success)'
                               : m.balance < -0.5 ? 'var(--color-danger)'
                               :                    'var(--color-muted)',
                        }}
                      >
                        {m.balance >  0.5 ? `+${formatKES(m.balance)}`
                       : m.balance < -0.5 ? `-${formatKES(-m.balance)}`
                       :                    'Settled ✓'}
                      </span>
                      {m.charges.length > 0 && (
                        <motion.span
                          className="text-[var(--color-muted)] text-xs leading-none"
                          animate={{ rotate: expandedId === m.id ? 180 : 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          ▾
                        </motion.span>
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === m.id && m.charges.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 space-y-2 bg-[var(--color-surface-2)]">
                          {m.charges.map(c => {
                            const cat = EXPENSE_CATEGORIES.find(x => x.id === c.category)
                            let dateStr = c.date
                            try { dateStr = format(parseISO(c.date), 'EEE d MMM') } catch { /* keep raw */ }
                            return (
                              <div key={c.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-base shrink-0">{cat?.icon ?? '📌'}</span>
                                  <div className="min-w-0">
                                    <p className="text-[var(--color-text)] text-xs font-medium truncate">{c.description}</p>
                                    <p className="text-[var(--color-muted)] text-[10px]">
                                      {dateStr}{c.splitCount > 1 ? ` · ÷${c.splitCount}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[var(--color-text)] text-xs font-semibold tabular-nums shrink-0 ml-3">
                                  {formatKES(c.share)}
                                </span>
                              </div>
                            )
                          })}
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                            <span className="text-[var(--color-muted)] text-xs">Total owed</span>
                            <span className="text-[var(--color-text)] text-xs font-bold tabular-nums">{formatKES(m.owes)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Payments needed */}
          {transactions.length > 0 ? (
            <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
              <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium px-4 pt-4 pb-3">Payments needed</p>
              <div className="divide-y divide-[var(--color-border)]">
                {transactions.map((t, i) => {
                  const debtor = balances.find(b => b.name === t.from)
                  const isOpen = expandedTxId === i
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <button
                        className="w-full flex items-center justify-between px-4 py-3"
                        onClick={() => setExpandedTxId(isOpen ? null : i)}
                      >
                        <p className="text-sm text-[var(--color-text)] text-left">
                          <span className="font-semibold">{t.from}</span>
                          <span className="text-[var(--color-muted)]"> → </span>
                          <span className="font-semibold">{t.to}</span>
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[var(--color-primary)] font-bold text-sm">{formatKES(t.amount)}</span>
                          {debtor?.charges.length > 0 && (
                            <motion.span
                              className="text-[var(--color-muted)] text-xs leading-none"
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                              ▾
                            </motion.span>
                          )}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isOpen && debtor?.charges.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 space-y-2 bg-[var(--color-surface-2)]">
                              <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wide pb-1">
                                What {t.from} was charged for
                              </p>
                              {debtor.charges.map(c => {
                                const cat = EXPENSE_CATEGORIES.find(x => x.id === c.category)
                                let dateStr = c.date
                                try { dateStr = format(parseISO(c.date), 'EEE d MMM') } catch { /* keep raw */ }
                                return (
                                  <div key={c.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-base shrink-0">{cat?.icon ?? '📌'}</span>
                                      <div className="min-w-0">
                                        <p className="text-[var(--color-text)] text-xs font-medium truncate">{c.description}</p>
                                        <p className="text-[var(--color-muted)] text-[10px]">
                                          {dateStr}{c.splitCount > 1 ? ` · ÷${c.splitCount}` : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[var(--color-text)] text-xs font-semibold tabular-nums shrink-0 ml-3">
                                      {formatKES(c.share)}
                                    </span>
                                  </div>
                                )
                              })}
                              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                                <span className="text-[var(--color-muted)] text-xs">Total {t.from} owes</span>
                                <span className="text-[var(--color-text)] text-xs font-bold tabular-nums">{formatKES(debtor.owes)}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-surface)] rounded-2xl p-5 text-center">
              <p className="text-[var(--color-success)] font-semibold">All settled! ✓</p>
              <p className="text-[var(--color-muted)] text-xs mt-1">Everyone paid their fair share</p>
            </div>
          )}

          <p className="text-[var(--color-muted)] text-xs text-center mt-4">
            Only expenses with a "paid by" are included
          </p>
        </>
      )}
    </div>
  )
}

function Row({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{label}</span>
      <span className={`text-sm font-semibold ${muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>{value}</span>
    </div>
  )
}

function Empty({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-[var(--color-text)] font-semibold">{title}</p>
      <p className="text-[var(--color-muted)] text-sm text-center max-w-[220px]">{desc}</p>
    </div>
  )
}
