import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { formatKES, EXPENSE_CATEGORIES, ACTIVITY_LIBRARY } from '../lib/constants'
import { fetchArchivedTrip } from '../lib/db'
import { getReceiptSignedUrl } from '../lib/receipts'

const TABS = ['Summary', 'Expenses', 'Members', 'Settle Up', 'Itinerary', 'Checklist']

// ── Settle Up logic (copied from SettleUp.jsx) ──────────────────────────────

function calcSettlement(expenses, members, contributions = []) {
  if (!members.length) return { transactions: [], balances: [], total: 0 }
  const allIds = members.map(m => m.id)
  const paid = {}
  const owes = {}
  for (const m of members) { paid[m.id] = 0; owes[m.id] = 0 }

  let total = 0
  for (const e of expenses) {
    total += e.amount
    if (e.paymentSource !== 'kitty' && e.paidBy && paid[e.paidBy] !== undefined) {
      paid[e.paidBy] += e.amount
    }
    const splitIds = (e.splitBetween?.length > 0)
      ? e.splitBetween.filter(id => owes[id] !== undefined)
      : allIds
    if (splitIds.length > 0) {
      if (e.splitMode === 'custom' && e.customSplits) {
        for (const id of splitIds) owes[id] += Number(e.customSplits[id] ?? 0)
      } else {
        const share = e.amount / splitIds.length
        for (const id of splitIds) owes[id] += share
      }
    }
  }
  for (const c of contributions) {
    if (paid[c.memberId] !== undefined) paid[c.memberId] += c.amount
  }

  const balances = members.map(m => ({
    id: m.id, name: m.name,
    paid: paid[m.id], owes: owes[m.id],
    balance: paid[m.id] - owes[m.id],
  }))

  const creditors = balances.filter(b => b.balance >  0.5).map(b => ({ ...b })).sort((a, b) => b.balance - a.balance)
  const debtors   = balances.filter(b => b.balance < -0.5).map(b => ({ ...b })).sort((a, b) => a.balance - b.balance)
  const transactions = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].balance, -debtors[di].balance)
    if (amount > 0.5) transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount })
    creditors[ci].balance -= amount
    debtors[di].balance   += amount
    if (creditors[ci].balance < 0.5)           ci++
    if (Math.abs(debtors[di].balance) < 0.5)   di++
  }
  return { transactions, balances, total }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold px-1 mb-2 mt-5 first:mt-0">
      {children}
    </p>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl ${className}`}>
      {children}
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center py-12 gap-2">
      <span className="text-3xl">{icon}</span>
      <p className="text-[var(--color-text)] font-semibold text-sm">{title}</p>
      {desc && <p className="text-[var(--color-muted)] text-xs text-center max-w-[220px]">{desc}</p>}
    </div>
  )
}

// ── Tab: Summary ─────────────────────────────────────────────────────────────

function SummaryTab({ data }) {
  const { trip, members, expenses, groupSize, budgetMilestones } = data

  const confirmedMembers = members.filter(m => m.status === 'confirmed')
  const memberCount = confirmedMembers.length || groupSize || 1
  const tripExpenses = expenses.filter(e => !e.isPreTrip && e.status !== 'pending')
  const totalBudget = confirmedMembers.length > 0
    ? confirmedMembers.reduce((s, m) => s + (m.budget ?? trip.budgetPerPerson), 0)
    : trip.budgetPerPerson * memberCount
  const totalSpent = tripExpenses.reduce((s, e) => s + e.amount, 0)
  const spentPct = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0

  const allIds = confirmedMembers.map(m => m.id)
  const memberSpending = {}
  for (const m of confirmedMembers) memberSpending[m.id] = 0
  for (const e of tripExpenses) {
    const splitIds = e.splitBetween?.length > 0 ? e.splitBetween.filter(id => memberSpending[id] !== undefined) : allIds
    if (splitIds.length > 0) {
      if (e.splitMode === 'custom' && e.customSplits) {
        for (const id of splitIds) memberSpending[id] = (memberSpending[id] || 0) + Number(e.customSplits[id] ?? 0)
      } else {
        const share = e.amount / splitIds.length
        for (const id of splitIds) memberSpending[id] = (memberSpending[id] || 0) + share
      }
    }
  }

  const byCategory = {}
  for (const e of tripExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
  }
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const startDate = trip.startDate ? parseISO(trip.startDate) : null
  const endDate   = trip.endDate   ? parseISO(trip.endDate)   : null
  const tripDays  = (startDate && endDate) ? differenceInCalendarDays(endDate, startDate) + 1 : null

  return (
    <div className="space-y-1">
      {/* Budget bar */}
      <Card className="p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[var(--color-muted)]">Total spent</span>
          <span className="text-[var(--color-muted)]">Budget {formatKES(totalBudget)}</span>
        </div>
        <div className="h-2.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${spentPct * 100}%`,
              backgroundColor: spentPct >= 0.9 ? 'var(--color-danger)' : spentPct >= 0.75 ? 'var(--color-warning)' : 'var(--color-primary)',
            }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text)] font-bold text-lg">{formatKES(totalSpent)}</span>
          <span className="text-[var(--color-muted)] text-sm self-end">{Math.round(spentPct * 100)}% used</span>
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-[var(--color-border)]">
          <div>
            <p className="text-[var(--color-muted)] text-[10px]">Members</p>
            <p className="text-[var(--color-text)] text-sm font-semibold">{memberCount}</p>
          </div>
          {tripDays && (
            <div>
              <p className="text-[var(--color-muted)] text-[10px]">Days</p>
              <p className="text-[var(--color-text)] text-sm font-semibold">{tripDays}</p>
            </div>
          )}
          {memberCount > 0 && totalSpent > 0 && (
            <div>
              <p className="text-[var(--color-muted)] text-[10px]">Per person</p>
              <p className="text-[var(--color-text)] text-sm font-semibold">{formatKES(Math.round(totalSpent / memberCount))}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <>
          <SectionLabel>Top categories</SectionLabel>
          <Card>
            <div className="divide-y divide-[var(--color-border)]">
              {topCategories.map(([catId, amount]) => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === catId)
                const pct = totalSpent > 0 ? amount / totalSpent : 0
                return (
                  <div key={catId} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl shrink-0">{cat?.icon ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-[var(--color-text)] text-xs font-medium">{cat?.label ?? catId}</span>
                        <span className="text-[var(--color-text)] text-xs font-semibold tabular-nums">{formatKES(amount)}</span>
                      </div>
                      <div className="h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {/* Per-member spending */}
      {confirmedMembers.length > 0 && (
        <>
          <SectionLabel>Per member</SectionLabel>
          <Card>
            <div className="divide-y divide-[var(--color-border)]">
              {confirmedMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-primary-dim)] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <span className="text-[var(--color-text)] text-sm">{m.name}</span>
                  </div>
                  <span className="text-[var(--color-text)] text-sm font-semibold tabular-nums">
                    {formatKES(Math.round(memberSpending[m.id] ?? 0))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Budget milestones */}
      {budgetMilestones.length > 0 && (
        <>
          <SectionLabel>Budget milestones</SectionLabel>
          <Card>
            <div className="divide-y divide-[var(--color-border)]">
              {budgetMilestones.map((m, i) => {
                let dateStr = ''
                try { dateStr = format(parseISO(m.timestamp), 'EEE d MMM, h:mm a') } catch { /* skip */ }
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-lg shrink-0 mt-0.5">{m.level === 'danger' ? '⚠️' : '⚡'}</span>
                    <div>
                      <p className="text-[var(--color-text)] text-sm font-semibold">
                        {m.level === 'danger' ? 'Over 90% spent' : '75% of budget reached'}
                      </p>
                      <p className="text-[var(--color-muted)] text-xs">{formatKES(m.totalSpent)} spent · {dateStr}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ── Tab: Expenses ─────────────────────────────────────────────────────────────

function ExpensesTab({ data, signedUrls }) {
  const tripExpenses = data.expenses.filter(e => !e.isPreTrip && e.status !== 'pending')
  const memberMap = Object.fromEntries(data.members.map(m => [m.id, m.name]))

  if (!tripExpenses.length) return <EmptyState icon="🧾" title="No expenses logged" />

  // Group by date
  const byDate = {}
  for (const e of tripExpenses) {
    const d = e.date ?? 'Unknown'
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(e)
  }
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      {sortedDates.map(date => {
        let dateLabel = date
        try { dateLabel = format(parseISO(date), 'EEEE, d MMM') } catch { /* keep raw */ }
        const dayTotal = byDate[date].reduce((s, e) => s + e.amount, 0)
        return (
          <div key={date} className="mb-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">{dateLabel}</p>
              <p className="text-[var(--color-muted)] text-[10px] font-semibold tabular-nums">{formatKES(dayTotal)}</p>
            </div>
            <Card>
              <div className="divide-y divide-[var(--color-border)]">
                {byDate[date].map(e => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category)
                  const payerName = e.paidBy ? (memberMap[e.paidBy] ?? 'Unknown') : null
                  const receiptUrl = signedUrls[e.id]
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xl shrink-0">{cat?.icon ?? '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--color-text)] text-sm font-medium truncate">{e.description}</p>
                        <p className="text-[var(--color-muted)] text-xs">
                          {cat?.label ?? e.category}
                          {payerName ? ` · paid by ${payerName}` : ''}
                        </p>
                      </div>
                      {receiptUrl && (
                        <img
                          src={receiptUrl}
                          alt="receipt"
                          className="w-8 h-8 rounded-lg object-cover shrink-0 border border-[var(--color-border)]"
                        />
                      )}
                      <span className="text-[var(--color-text)] text-sm font-semibold tabular-nums shrink-0">
                        {formatKES(e.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Members ──────────────────────────────────────────────────────────────

function MembersTab({ data }) {
  const confirmedMembers = data.members.filter(m => m.status === 'confirmed')
  const tripExpenses = data.expenses.filter(e => !e.isPreTrip && e.status !== 'pending')
  const allIds = confirmedMembers.map(m => m.id)

  const memberSpending = {}
  const memberPaid = {}
  for (const m of confirmedMembers) { memberSpending[m.id] = 0; memberPaid[m.id] = 0 }
  for (const e of tripExpenses) {
    if (e.paidBy && memberPaid[e.paidBy] !== undefined) memberPaid[e.paidBy] += e.amount
    const splitIds = e.splitBetween?.length > 0 ? e.splitBetween.filter(id => memberSpending[id] !== undefined) : allIds
    if (splitIds.length > 0) {
      if (e.splitMode === 'custom' && e.customSplits) {
        for (const id of splitIds) memberSpending[id] = (memberSpending[id] || 0) + Number(e.customSplits[id] ?? 0)
      } else {
        const share = e.amount / splitIds.length
        for (const id of splitIds) memberSpending[id] = (memberSpending[id] || 0) + share
      }
    }
  }

  if (!confirmedMembers.length) return <EmptyState icon="👥" title="No members recorded" />

  return (
    <Card>
      <div className="divide-y divide-[var(--color-border)]">
        {confirmedMembers.map(m => (
          <div key={m.id} className="px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--color-primary-dim)] text-[var(--color-primary)] text-sm font-bold flex items-center justify-center shrink-0">
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[var(--color-text)] text-sm font-medium">{m.name}</p>
                  <p className="text-[var(--color-muted)] text-xs capitalize">{m.role ?? 'member'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[var(--color-text)] text-sm font-semibold tabular-nums">
                  {formatKES(Math.round(memberSpending[m.id] ?? 0))}
                </p>
                <p className="text-[var(--color-muted)] text-[10px]">share of expenses</p>
              </div>
            </div>
            {memberPaid[m.id] > 0 && (
              <div className="flex justify-end mt-1">
                <span className="text-[var(--color-success)] text-[10px] font-medium">
                  paid {formatKES(Math.round(memberPaid[m.id]))} in cash
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Tab: Settle Up ────────────────────────────────────────────────────────────

function SettleUpTab({ data }) {
  const confirmedMembers = data.members.filter(m => m.status === 'confirmed')
  const tripExpenses = data.expenses.filter(e => !e.isPreTrip && e.status !== 'pending')
  const { transactions, balances, total } = useMemo(
    () => calcSettlement(tripExpenses, confirmedMembers, data.contributions ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  )
  const [expandedId, setExpandedId] = useState(null)

  if (!confirmedMembers.length) return <EmptyState icon="👥" title="No members recorded" />
  if (!tripExpenses.length) return <EmptyState icon="🧾" title="No expenses to settle" />

  return (
    <div>
      <Card className="p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Total trip spend</span>
          <span className="text-[var(--color-text)] font-semibold tabular-nums">{formatKES(total)}</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-[var(--color-muted)]">Fair share (÷{confirmedMembers.length})</span>
          <span className="text-[var(--color-muted)] tabular-nums">{formatKES(total / confirmedMembers.length)}</span>
        </div>
      </Card>

      <SectionLabel>Balances</SectionLabel>
      <Card className="mb-4">
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
                    paid {formatKES(m.paid)} · share {formatKES(m.owes)}
                  </p>
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{
                    color: m.balance >  0.5 ? 'var(--color-success)'
                         : m.balance < -0.5 ? 'var(--color-danger)'
                         :                    'var(--color-muted)',
                  }}
                >
                  {m.balance >  0.5 ? `+${formatKES(m.balance)}`
                 : m.balance < -0.5 ? `−${formatKES(-m.balance)}`
                 :                    'Settled ✓'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      {transactions.length > 0 ? (
        <>
          <SectionLabel>Payments needed</SectionLabel>
          <Card>
            <div className="divide-y divide-[var(--color-border)]">
              {transactions.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-[var(--color-text)]">
                    <span className="font-semibold">{t.from}</span>
                    <span className="text-[var(--color-muted)]"> → </span>
                    <span className="font-semibold">{t.to}</span>
                  </p>
                  <span className="text-[var(--color-primary)] font-bold text-sm tabular-nums">{formatKES(t.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-5 text-center">
          <p className="text-[var(--color-success)] font-semibold">All settled! ✓</p>
          <p className="text-[var(--color-muted)] text-xs mt-1">Everyone paid their fair share</p>
        </Card>
      )}
    </div>
  )
}

// ── Tab: Itinerary ────────────────────────────────────────────────────────────

function ItineraryTab({ data }) {
  const items = data.itinerary ?? []
  if (!items.length) {
    return (
      <EmptyState
        icon="📅"
        title="No itinerary saved"
        desc="Itinerary is preserved from trips completed after this update"
      />
    )
  }

  const byDate = {}
  for (const item of items) {
    const d = item.date ?? 'Unknown'
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(item)
  }
  const sortedDates = Object.keys(byDate).sort()

  return (
    <div>
      {sortedDates.map(date => {
        let dateLabel = date
        try { dateLabel = format(parseISO(date), 'EEEE, d MMM') } catch { /* keep raw */ }
        const dayItems = byDate[date].slice().sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
        return (
          <div key={date} className="mb-4">
            <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold px-1 mb-2">{dateLabel}</p>
            <Card>
              <div className="divide-y divide-[var(--color-border)]">
                {dayItems.map(item => {
                  const activity = item.activityId ? ACTIVITY_LIBRARY.find(a => a.id === item.activityId) : null
                  const name = item.customName ?? activity?.name ?? '—'
                  const isCancelled = item.status === 'cancelled'
                  return (
                    <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="text-center shrink-0 w-12">
                        <p className="text-[var(--color-muted)] text-[10px] font-medium">{item.startTime ?? '—'}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: isCancelled ? 'var(--color-muted)' : 'var(--color-text)',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}
                        >
                          {name}
                        </p>
                        {item.location && (
                          <p className="text-[var(--color-muted)] text-xs truncate">{item.location}</p>
                        )}
                        {isCancelled && (
                          <span className="text-[10px] text-[var(--color-danger)] font-medium">Cancelled</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Checklist ────────────────────────────────────────────────────────────

function ChecklistTab({ data }) {
  const items = data.checklist ?? []
  if (!items.length) {
    return (
      <EmptyState
        icon="✅"
        title="No checklist saved"
        desc="Checklist is preserved from trips completed after this update"
      />
    )
  }

  const doneCount = items.filter(i => i.done).length
  return (
    <div>
      <p className="text-[var(--color-muted)] text-xs px-1 mb-3">
        {doneCount}/{items.length} items completed
      </p>
      <Card>
        <div className="divide-y divide-[var(--color-border)]">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: item.done ? 'var(--color-success)' : 'var(--color-border-strong)',
                  backgroundColor: item.done ? 'var(--color-success)' : 'transparent',
                }}
              >
                {item.done && <span className="text-white text-[10px] font-bold">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm"
                  style={{
                    color: item.done ? 'var(--color-muted)' : 'var(--color-text)',
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}
                >
                  {item.label ?? item.text ?? '—'}
                </p>
                {item.category && (
                  <p className="text-[var(--color-muted)] text-[10px] capitalize">{item.category}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TripHistoryDetail({ tripId, onBack }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('Summary')
  const [signedUrls, setSignedUrls] = useState({})

  useEffect(() => {
    fetchArchivedTrip(tripId).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [tripId])

  useEffect(() => {
    if (!data?.expenses) return
    data.expenses.forEach(async (e) => {
      if (!e.receiptUrl || signedUrls[e.id]) return
      const url = await getReceiptSignedUrl(e.receiptUrl)
      if (url) setSignedUrls(prev => ({ ...prev, [e.id]: url }))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.expenses])

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-3"
      >
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-muted)] text-sm">Loading trip…</p>
      </motion.div>
    )
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center gap-4 px-6"
      >
        <span className="text-4xl">😕</span>
        <p className="text-[var(--color-text)] font-semibold">Trip not found</p>
        <button onClick={onBack} className="text-[var(--color-primary)] text-sm font-medium">
          ← Back to history
        </button>
      </motion.div>
    )
  }

  const { trip } = data
  const startDate = trip.startDate ? parseISO(trip.startDate) : null
  const endDate   = trip.endDate   ? parseISO(trip.endDate)   : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="min-h-screen bg-[var(--color-bg)] pb-10"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)] border-b border-[var(--color-border)] px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[var(--color-primary)] text-sm font-medium mb-3"
        >
          ← Back to history
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest mb-0.5">
              {trip.name}
            </p>
            <h1 className="text-[var(--color-text)] text-xl font-bold">{trip.destination || 'Past Trip'}</h1>
            {startDate && (
              <p className="text-[var(--color-muted)] text-xs mt-0.5">
                {format(startDate, 'MMM d')}
                {endDate ? ` – ${format(endDate, 'MMM d, yyyy')}` : ''}
              </p>
            )}
          </div>
          <span className="shrink-0 ml-3 text-[10px] font-medium bg-[var(--color-surface-3)] text-[var(--color-muted)] px-2.5 py-1 rounded-full mt-1">
            Completed
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-4 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: tab === t ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: tab === t ? 'var(--color-bg)' : 'var(--color-muted)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'Summary'   && <SummaryTab   data={data} />}
            {tab === 'Expenses'  && <ExpensesTab  data={data} signedUrls={signedUrls} />}
            {tab === 'Members'   && <MembersTab   data={data} />}
            {tab === 'Settle Up' && <SettleUpTab  data={data} />}
            {tab === 'Itinerary' && <ItineraryTab data={data} />}
            {tab === 'Checklist' && <ChecklistTab data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
