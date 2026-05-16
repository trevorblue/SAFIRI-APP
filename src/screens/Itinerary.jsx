import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { useTrip } from '../context/TripContext'
import { formatKES, ACTIVITY_LIBRARY, AREA_COLORS, TIME_OF_DAY } from '../lib/constants'
import { CloseIcon, PencilIcon, ZapIcon } from '../components/icons'

const STATUS_META = {
  planned:   { label: 'Planned',   cls: 'text-[var(--color-muted)] bg-[var(--color-surface-2)]' },
  done:      { label: 'Done ✓',    cls: 'text-[var(--color-success)] bg-[var(--color-success-dim)]' },
  cancelled: { label: 'Cancelled', cls: 'text-[var(--color-muted)] bg-[var(--color-surface-3)]' },
  active:    { label: 'Happening', cls: 'text-[var(--color-primary)] bg-[var(--color-primary-dim)]' },
}
const STATUS_NEXT = { planned: 'done', done: 'cancelled', cancelled: 'planned', active: 'done' }

function getInfo(item) {
  const act = item.activityId ? ACTIVITY_LIBRARY.find(a => a.id === item.activityId) : null
  return {
    name:     item.customName ?? act?.name ?? 'Activity',
    location: item.location   ?? act?.location ?? '',
    area:     item.area       ?? act?.area ?? null,
    cost:     item.costPerPerson != null ? item.costPerPerson : (act?.costPerPerson ?? 0),
    anchor:   act?.isAnchorEvent ?? false,
  }
}

function dayPillLabel(dateStr, tripStart) {
  if (dateStr < tripStart) return { top: 'Pre-trip', btm: format(parseISO(dateStr), 'MMM d') }
  const n = differenceInCalendarDays(parseISO(dateStr), parseISO(tripStart)) + 1
  return { top: `Day ${n}`, btm: format(parseISO(dateStr), 'EEE d') }
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } } }
const fadeUp  = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } } }

export default function Itinerary() {
  const { state, dispatch, computed } = useTrip()
  const { trip, itinerary } = state

  const dates    = [...new Set(itinerary.map(i => i.date))].sort()
  const today    = format(new Date(), 'yyyy-MM-dd')
  // Auto-select today if it's a scheduled date, else the next upcoming date, else the first date
  const initialDate = dates.find(d => d >= today) ?? dates[dates.length - 1] ?? trip.startDate
  const [activeDate, setActiveDate] = useState(initialDate)
  const [showAdd,    setShowAdd]    = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [gapItem,    setGapItem]    = useState(null) // cancelled item to fill gap

  const dayItems = itinerary
    .filter(i => i.date === activeDate)
    .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'))

  const dayTotal  = dayItems.reduce((s, i) => s + (i.costPerPerson ?? 0), 0)
  const tripTotal = itinerary.reduce((s, i) => s + (i.costPerPerson ?? 0), 0)
  const doneCount = itinerary.filter(i => i.status === 'done').length
  const donePct   = itinerary.length > 0 ? Math.round((doneCount / itinerary.length) * 100) : 0

  function toggleStatus(item) {
    const nextStatus = STATUS_NEXT[item.status] ?? 'planned'
    dispatch({ type: 'UPDATE_ITINERARY_ITEM', payload: { id: item.id, status: nextStatus } })
    if (nextStatus === 'done') {
      const info = getInfo(item)
      if (info.cost > 0) {
        const confirmedIds = state.members.filter(m => m.status === 'confirmed').map(m => m.id)
        dispatch({
          type: 'ADD_EXPENSE',
          payload: {
            id:            crypto.randomUUID(),
            createdAt:     new Date().toISOString(),
            description:   info.name,
            amount:        info.cost * computed.memberCount,
            category:      'activities',
            date:          item.date,
            isPreTrip:     false,
            fromItinerary: true,
            splitBetween:  confirmedIds,
          },
        })
      }
    }
  }

  return (
    <motion.div className="min-h-full bg-[var(--color-bg)]" variants={stagger} initial="hidden" animate="visible">

      {/* Header */}
      <motion.div variants={fadeUp} className="px-5 pt-12 pb-3">
        <p className="text-[var(--color-primary)] text-xs uppercase tracking-widest font-semibold mb-1">Schedule</p>
        <div className="flex items-end justify-between">
          <h1 className="text-[var(--color-text)] text-3xl font-bold">Itinerary</h1>
          <div className="text-right">
            <p className="text-[var(--color-text)] font-bold text-lg tabular-nums">{formatKES(tripTotal)}</p>
            <p className="text-[var(--color-muted)] text-xs">planned · {donePct}% done</p>
          </div>
        </div>
      </motion.div>

      {/* Day tabs */}
      <motion.div variants={fadeUp} className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 px-5 pb-3 min-w-max">
          {dates.map(date => {
            const { top, btm } = dayPillLabel(date, trip.startDate)
            const isActive   = date === activeDate
            const doneItems  = itinerary.filter(i => i.date === date && i.status === 'done').length
            const totalItems = itinerary.filter(i => i.date === date).length
            const isToday    = date === today
            return (
              <motion.button
                key={date}
                onClick={() => setActiveDate(date)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-2xl border shrink-0 min-w-[68px] ${
                  isActive
                    ? 'bg-[var(--color-primary)] border-transparent'
                    : 'bg-[var(--color-surface)] border-[var(--color-border)]'
                }`}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <span className={`text-xs font-bold leading-none mb-0.5 ${isActive ? 'text-[var(--color-bg)]' : 'text-[var(--color-text)]'}`}>
                  {top}
                </span>
                <span className={`text-[10px] ${isActive ? 'text-[var(--color-bg)]/70' : 'text-[var(--color-muted)]'}`}>
                  {btm}
                </span>
                {isToday && !isActive && (
                  <span className="text-[8px] mt-0.5 font-bold text-[var(--color-primary)] uppercase tracking-wide">Today</span>
                )}
                {totalItems > 0 && (
                  <span className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-[var(--color-bg)]/60' : 'text-[var(--color-muted)]'}`}>
                    {doneItems}/{totalItems}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Day cost bar */}
      {dayTotal > 0 && (
        <motion.div variants={fadeUp} className="mx-4 mb-3 px-4 py-2.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--color-muted)] text-xs">Day planned cost</span>
          <span className="text-[var(--color-text)] font-semibold text-sm tabular-nums">{formatKES(dayTotal)}/person</span>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="px-4 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDate}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="relative"
          >
            {dayItems.length > 1 && (
              <div className="absolute left-[18px] top-6 bottom-6 w-px bg-[var(--color-border)]" />
            )}

            <div className="space-y-3">
              {dayItems.map((item, i) => {
                const info  = getInfo(item)
                const meta  = STATUS_META[item.status] ?? STATUS_META.planned
                const dotClr = (info.area && AREA_COLORS[info.area]) ? AREA_COLORS[info.area] : 'var(--color-primary)'

                return (
                  <motion.div
                    key={item.id}
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 380, damping: 28 }}
                  >
                    {/* Time + dot */}
                    <div className="flex flex-col items-center w-9 shrink-0 pt-2">
                      <span className="text-[var(--color-muted)] text-[10px] font-medium leading-none mb-1.5">
                        {item.startTime ?? '–'}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full border-2 border-[var(--color-bg)] z-10 shrink-0"
                        style={{ backgroundColor: dotClr }}
                      />
                    </div>

                    {/* Card */}
                    <div className={`flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-3.5 ${
                      item.status === 'cancelled' ? 'opacity-40' : ''
                    }`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className={`text-[var(--color-text)] text-sm font-semibold leading-tight flex-1 ${
                          item.status === 'cancelled' ? 'line-through' : ''
                        }`}>
                          {info.name}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {info.anchor && (
                            <span className="text-[10px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-dim)] px-1.5 py-0.5 rounded-full">
                              ⚡ Anchor
                            </span>
                          )}
                          <motion.button
                            onClick={() => setEditItem(item)}
                            className="p-1 text-[var(--color-muted)] rounded-lg"
                            whileTap={{ scale: 0.82 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <PencilIcon size={13} stroke="currentColor" />
                          </motion.button>
                        </div>
                      </div>

                      {info.location && (
                        <p className="text-[var(--color-muted)] text-xs mb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotClr }} />
                          {info.location}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-medium tabular-nums ${
                          info.cost === 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-text)]'
                        }`}>
                          {info.cost === 0 ? 'Free' : `${formatKES(info.cost)}/person`}
                        </span>
                        {item.endTime && (
                          <span className="text-[var(--color-muted)] text-[10px]">→ {item.endTime}</span>
                        )}
                        {item.notes && (
                          <span className="text-[var(--color-muted)] text-[10px] truncate max-w-[100px]">· {item.notes}</span>
                        )}
                        {item.status === 'cancelled' && (
                          <motion.button
                            onClick={() => setGapItem(item)}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full text-[var(--color-warning)] bg-[var(--color-warning-dim)] flex items-center gap-1"
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <ZapIcon size={9} stroke="currentColor" />
                            Find alternative
                          </motion.button>
                        )}
                        <motion.button
                          onClick={() => toggleStatus(item)}
                          className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.cls}`}
                          whileTap={{ scale: 0.88 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          {meta.label}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}

              {dayItems.length === 0 && (
                <motion.div className="text-center py-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-4xl mb-2">📋</p>
                  <p className="text-[var(--color-text)] font-medium mb-1">Nothing scheduled</p>
                  <p className="text-[var(--color-muted)] text-sm">Tap Add activity to plan this day</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.button
          onClick={() => setShowAdd(true)}
          className="w-full mt-4 py-3.5 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] text-sm flex items-center justify-center gap-2"
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-lg leading-none">+</span> Add activity
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <ItemSheet
            defaultDate={activeDate}
            onSave={data => {
              dispatch({ type: 'ADD_ITINERARY_ITEM', payload: { id: `it_${Date.now()}`, status: 'planned', ...data } })
              setShowAdd(false)
            }}
            onClose={() => setShowAdd(false)}
          />
        )}
        {editItem && (
          <ItemSheet
            defaultDate={activeDate}
            item={editItem}
            onSave={data => {
              dispatch({ type: 'UPDATE_ITINERARY_ITEM', payload: { id: editItem.id, ...data } })
              setEditItem(null)
            }}
            onDelete={() => {
              dispatch({ type: 'REMOVE_ITINERARY_ITEM', payload: editItem.id })
              setEditItem(null)
            }}
            onClose={() => setEditItem(null)}
          />
        )}
        {gapItem && (
          <GapSheet
            cancelledItem={gapItem}
            dayItems={dayItems}
            allItinerary={itinerary}
            onPick={suggestion => {
              dispatch({
                type: 'ADD_ITINERARY_ITEM',
                payload: {
                  id:            `it_${Date.now()}`,
                  date:          gapItem.date,
                  startTime:     gapItem.startTime,
                  endTime:       gapItem.endTime,
                  activityId:    suggestion.id,
                  costPerPerson: suggestion.costPerPerson,
                  status:        'planned',
                },
              })
              setGapItem(null)
            }}
            onAddCustom={() => { setGapItem(null); setShowAdd(true) }}
            onClose={() => setGapItem(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add / Edit sheet ────────────────────────────────────────────────────────

function ItemSheet({ defaultDate, item, onSave, onDelete, onClose }) {
  const isEdit = !!item
  const info   = item ? getInfo(item) : null

  const [form, setForm] = useState({
    date:          item?.date         ?? defaultDate,
    startTime:     item?.startTime    ?? '',
    endTime:       item?.endTime      ?? '',
    customName:    item?.customName   ?? info?.name ?? '',
    location:      item?.location     ?? info?.location ?? '',
    costPerPerson: item?.costPerPerson != null ? String(item.costPerPerson) : info?.cost ? String(info.cost) : '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const canSave = form.customName.trim()

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)] max-h-[85vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)] shrink-0">
          <span className="font-semibold text-[var(--color-text)]">
            {isEdit ? 'Edit activity' : 'Add to schedule'}
          </span>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Activity name</label>
            <input type="text" value={form.customName} onChange={e => set('customName', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSave && onSave({ ...form, costPerPerson: Number(form.costPerPerson) || 0 })}
              placeholder="e.g. Diani Beach day" className="input-field" autoFocus />
          </div>
          <div>
            <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Location</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. South Coast" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Cost / person</label>
              <input type="number" value={form.costPerPerson} onChange={e => set('costPerPerson', e.target.value)}
                placeholder="0" className="input-field" inputMode="numeric" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">Start</label>
              <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-[var(--color-muted-2)] text-xs font-medium uppercase tracking-wide mb-2 block">End</label>
              <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className="input-field" />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 shrink-0 border-t border-[var(--color-border)] space-y-2">
          <motion.button
            onClick={() => canSave && onSave({ ...form, costPerPerson: Number(form.costPerPerson) || 0 })}
            className="w-full py-4 rounded-2xl font-semibold"
            style={{
              backgroundColor: canSave ? 'var(--color-primary)' : 'var(--color-surface-3)',
              color:           canSave ? 'var(--color-bg)'      : 'var(--color-muted)',
            }}
            whileTap={canSave ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            {isEdit ? 'Save changes' : 'Add to schedule'}
          </motion.button>

          {isEdit && onDelete && (
            <motion.button
              onClick={onDelete}
              className="w-full py-3 rounded-2xl text-sm font-medium text-[var(--color-danger)]"
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              Delete activity
            </motion.button>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ─── Gap Sheet ───────────────────────────────────────────────────────────────

function getSuggestions(cancelledItem, dayItems, _allItinerary) {
  const startH  = parseInt(cancelledItem.startTime?.split(':')[0] ?? '12')
  const endH    = parseInt(cancelledItem.endTime?.split(':')[0]   ?? String(startH + 2))
  const gapHrs  = Math.max(0.5, endH - startH)

  const timeOfDay =
    startH < 12 ? TIME_OF_DAY.MORNING :
    startH < 17 ? TIME_OF_DAY.AFTERNOON :
    startH < 21 ? TIME_OF_DAY.EVENING :
    TIME_OF_DAY.NIGHT

  // Activities already in today's itinerary (excluding the cancelled one)
  const dayActIds = new Set(
    dayItems.filter(i => i.id !== cancelledItem.id).map(i => i.activityId).filter(Boolean)
  )

  // Most-used area today (for relevance scoring)
  const dayAreas = dayItems
    .filter(i => i.id !== cancelledItem.id)
    .map(i => i.area ?? ACTIVITY_LIBRARY.find(a => a.id === i.activityId)?.area)
    .filter(Boolean)
  const preferredArea = dayAreas.length
    ? [...dayAreas].sort((a, b) =>
        dayAreas.filter(x => x === b).length - dayAreas.filter(x => x === a).length
      )[0]
    : null

  return ACTIVITY_LIBRARY
    .filter(act => {
      if (dayActIds.has(act.id)) return false
      if (act.id === cancelledItem.activityId) return false
      if (act.durationHours > gapHrs + 0.5) return false
      if (act.timeOfDay !== TIME_OF_DAY.ANY && act.timeOfDay !== timeOfDay) return false
      return true
    })
    .sort((a, b) => {
      const score = x => (x.area === preferredArea ? 2 : 0) - (x.costPerPerson > 2000 ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, 5)
}

function GapSheet({ cancelledItem, dayItems, allItinerary, onPick, onAddCustom, onClose }) {
  const suggestions = getSuggestions(cancelledItem, dayItems, allItinerary)
  const gapLabel = cancelledItem.startTime && cancelledItem.endTime
    ? `${cancelledItem.startTime} – ${cancelledItem.endTime}`
    : 'free slot'

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)] max-h-[80vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)] shrink-0">
          <div>
            <span className="font-semibold text-[var(--color-text)]">Find alternative</span>
            <p className="text-[var(--color-muted)] text-xs mt-0.5">Slot free: {gapLabel}</p>
          </div>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">🤷</p>
              <p className="text-[var(--color-text)] font-medium mb-1">No matching alternatives</p>
              <p className="text-[var(--color-muted)] text-sm">Nothing in the library fits this slot.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((act, i) => {
                const dotClr = (act.area && AREA_COLORS[act.area]) ? AREA_COLORS[act.area] : 'var(--color-primary)'
                return (
                  <motion.button
                    key={act.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => onPick(act)}
                    className="w-full text-left bg-[var(--color-surface-2)] rounded-2xl px-4 py-3.5"
                    whileTap={{ scale: 0.97, backgroundColor: 'var(--color-surface-3)' }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[var(--color-text)] text-sm font-semibold">{act.name}</p>
                      <span className="text-[var(--color-text)] text-sm font-bold tabular-nums shrink-0">
                        {act.costPerPerson === 0 ? 'Free' : formatKES(act.costPerPerson)}
                      </span>
                    </div>
                    <p className="text-[var(--color-muted)] text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dotClr }} />
                      {act.location} · {act.durationHours}h
                    </p>
                    {act.description && (
                      <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed line-clamp-2">{act.description}</p>
                    )}
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-3 shrink-0 border-t border-[var(--color-border)]">
          <motion.button
            onClick={onAddCustom}
            className="w-full py-3 rounded-2xl border border-dashed border-[var(--color-border)] text-[var(--color-muted)] text-sm font-medium"
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            + Add custom activity
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
