import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context/TripContext'
import { CHECKLIST_CATEGORIES } from '../lib/constants'
import { CloseIcon, AddIcon } from '../components/icons'

export default function Checklist() {
  const { state, dispatch } = useTrip()
  const [showSheet, setShowSheet] = useState(false)

  const checklist = state.checklist ?? []
  const doneCount = checklist.filter(i => i.done).length
  const total     = checklist.length
  const pct       = total > 0 ? doneCount / total : 0

  const grouped = CHECKLIST_CATEGORIES.map(cat => ({
    ...cat,
    items: checklist.filter(i => i.category === cat.id),
  })).filter(cat => cat.items.length > 0)

  const uncategorized = checklist.filter(
    i => !CHECKLIST_CATEGORIES.find(c => c.id === i.category)
  )

  function toggle(id) { dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: id }) }
  function remove(id) { dispatch({ type: 'REMOVE_CHECKLIST_ITEM', payload: id }) }

  return (
    <div className="min-h-full bg-[var(--color-bg)] px-5 pt-12 pb-8">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-1">Pre-trip</p>
          <h1 className="text-[var(--color-text)] text-2xl font-bold">Checklist</h1>
        </div>
        <motion.button
          onClick={() => setShowSheet(true)}
          className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[color:var(--color-primary)]/30 mt-1"
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <AddIcon size={20} stroke="var(--color-bg)" />
        </motion.button>
      </div>

      {/* Progress bar */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--color-text)] font-semibold text-sm">{doneCount} / {total} done</span>
          <span className="text-[var(--color-muted)] text-xs">{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {doneCount === total && total > 0 && (
          <p className="text-[var(--color-success)] text-xs font-medium mt-2 text-center">All done — you're ready! ✓</p>
        )}
      </div>

      {/* Category groups */}
      {grouped.map(cat => (
        <div key={cat.id} className="mb-5">
          <p className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-widest mb-2 px-1">
            {cat.icon}  {cat.label}
          </p>
          <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
            {cat.items.map((item, idx) => (
              <CheckItem
                key={item.id}
                item={item}
                onToggle={() => toggle(item.id)}
                onDelete={() => remove(item.id)}
                last={idx === cat.items.length - 1}
              />
            ))}
          </div>
        </div>
      ))}

      {uncategorized.length > 0 && (
        <div className="mb-5">
          <p className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-widest mb-2 px-1">
            📌  Other
          </p>
          <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden">
            {uncategorized.map((item, idx) => (
              <CheckItem
                key={item.id}
                item={item}
                onToggle={() => toggle(item.id)}
                onDelete={() => remove(item.id)}
                last={idx === uncategorized.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="text-4xl">📋</span>
          <p className="text-[var(--color-muted)] text-sm">No tasks yet — tap + to add one</p>
        </div>
      )}

      <AnimatePresence>
        {showSheet && <AddTaskSheet onClose={() => setShowSheet(false)} />}
      </AnimatePresence>
    </div>
  )
}

function CheckItem({ item, onToggle, onDelete, last }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-[var(--color-border)]' : ''}`}>
      <motion.button onClick={onToggle} whileTap={{ scale: 0.85 }} className="shrink-0">
        <motion.div
          animate={{
            backgroundColor: item.done ? 'var(--color-primary)' : 'transparent',
            borderColor:      item.done ? 'var(--color-primary)' : 'var(--color-border-strong)',
          }}
          transition={{ duration: 0.15 }}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
        >
          {item.done && <span className="text-[var(--color-bg)] text-[10px] font-black leading-none">✓</span>}
        </motion.div>
      </motion.button>

      <div className="flex-1 min-w-0" onClick={onToggle}>
        <p className={`text-sm leading-snug transition-colors ${item.done ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-text)]'}`}>
          {item.text}
        </p>
        {item.dueDate && !item.done && (
          <p className="text-xs text-[var(--color-muted)] mt-0.5">Due {item.dueDate}</p>
        )}
      </div>

      <motion.button
        onClick={onDelete}
        className="shrink-0 text-[var(--color-muted)] p-1"
        whileTap={{ scale: 0.85 }}
      >
        <CloseIcon size={13} stroke="currentColor" />
      </motion.button>
    </div>
  )
}

function AddTaskSheet({ onClose }) {
  const { dispatch } = useTrip()
  const [text, setText]         = useState('')
  const [category, setCategory] = useState('planning')
  const [dueDate, setDueDate]   = useState('')

  function save() {
    if (!text.trim()) return
    dispatch({
      type: 'ADD_CHECKLIST_ITEM',
      payload: {
        id:       `cl_${Date.now()}`,
        text:     text.trim(),
        category,
        done:     false,
        dueDate:  dueDate || null,
      },
    })
    onClose()
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)]">
          <span className="font-semibold text-[var(--color-text)]">Add task</span>
          <motion.button onClick={onClose} whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="var(--color-muted)" />
          </motion.button>
        </div>

        <div className="px-5 pt-4 pb-4 space-y-4">
          <input
            type="text"
            className="input-field"
            placeholder="Task description"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
          />

          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CHECKLIST_CATEGORIES.map(cat => (
                <motion.button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat.id
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                  }`}
                >
                  {cat.icon} {cat.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Due date (optional)</p>
            <input
              type="date"
              className="input-field"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <motion.button
            onClick={save}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold text-sm"
          >
            Add task
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
