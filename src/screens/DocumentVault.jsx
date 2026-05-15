import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context/TripContext'
import { CloseIcon, AddIcon } from '../components/icons'

const DOC_TYPES = [
  { id: 'sgr',     label: 'SGR Ticket',       icon: '🚆' },
  { id: 'hotel',   label: 'Hotel Booking',     icon: '🏨' },
  { id: 'event',   label: 'Event Ticket',      icon: '🎟️' },
  { id: 'id',      label: 'ID / Passport',     icon: '🪪' },
  { id: 'contact', label: 'Emergency Contact', icon: '📞' },
  { id: 'other',   label: 'Other',             icon: '📝' },
]

function getType(typeId) {
  return DOC_TYPES.find(t => t.id === typeId) ?? DOC_TYPES[DOC_TYPES.length - 1]
}

export default function DocumentVault() {
  const { state, dispatch } = useTrip()
  const [showSheet, setShowSheet] = useState(false)
  const [editDoc, setEditDoc]     = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const docs = state.docs ?? []

  function openAdd()     { setEditDoc(null); setShowSheet(true) }
  function openEdit(doc) { setEditDoc(doc);  setShowSheet(true) }
  function remove(id) {
    dispatch({ type: 'REMOVE_DOC', payload: id })
    if (expandedId === id) setExpandedId(null)
  }

  return (
    <div className="min-h-full bg-[var(--color-bg)] px-5 pt-12 pb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-1">Documents</p>
          <h1 className="text-[var(--color-text)] text-2xl font-bold">Vault</h1>
        </div>
        <motion.button
          onClick={openAdd}
          className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[color:var(--color-primary)]/30 mt-1"
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <AddIcon size={20} stroke="var(--color-bg)" />
        </motion.button>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="text-4xl">🔐</span>
          <p className="text-[var(--color-text)] font-semibold">Vault is empty</p>
          <p className="text-[var(--color-muted)] text-sm text-center max-w-[220px]">
            Save SGR refs, booking numbers, and emergency contacts here
          </p>
          <motion.button
            onClick={openAdd}
            whileTap={{ scale: 0.96 }}
            className="mt-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold"
          >
            Add first document
          </motion.button>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, i) => {
            const type       = getType(doc.type)
            const isExpanded = expandedId === doc.id
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-[var(--color-surface)] rounded-2xl overflow-hidden"
              >
                {/* Card header — tap to expand */}
                <motion.button
                  onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  whileTap={{ backgroundColor: 'var(--color-surface-2)' }}
                >
                  <span className="text-xl shrink-0">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--color-text)] text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-[var(--color-muted)] text-xs truncate">
                      {type.label}{doc.ref ? ` · ${doc.ref}` : ''}
                    </p>
                  </div>
                  <motion.span
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[var(--color-muted)] text-base leading-none shrink-0"
                  >
                    ›
                  </motion.span>
                </motion.button>

                {/* Expanded detail */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="border-t border-[var(--color-border)] overflow-hidden"
                    >
                      <div className="px-4 py-3 space-y-2.5">
                        {doc.ref && (
                          <div>
                            <p className="text-[var(--color-muted)] text-xs mb-0.5">Reference / Number</p>
                            <p className="text-[var(--color-text)] text-sm font-mono font-semibold tracking-wide">{doc.ref}</p>
                          </div>
                        )}
                        {doc.notes && (
                          <div>
                            <p className="text-[var(--color-muted)] text-xs mb-0.5">Notes</p>
                            <p className="text-[var(--color-text)] text-sm whitespace-pre-wrap">{doc.notes}</p>
                          </div>
                        )}
                        {!doc.ref && !doc.notes && (
                          <p className="text-[var(--color-muted)] text-xs italic">No details saved</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <motion.button
                            onClick={() => openEdit(doc)}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-2 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-muted-2)] text-xs font-medium"
                          >
                            Edit
                          </motion.button>
                          <motion.button
                            onClick={() => remove(doc.id)}
                            whileTap={{ scale: 0.95 }}
                            className="flex-1 py-2 rounded-xl bg-[var(--color-danger-dim)] text-[var(--color-danger)] text-xs font-medium"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showSheet && (
          <DocSheet
            doc={editDoc}
            onClose={() => { setShowSheet(false); setEditDoc(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function DocSheet({ doc, onClose }) {
  const { dispatch } = useTrip()
  const [type,  setType]  = useState(doc?.type  ?? 'sgr')
  const [title, setTitle] = useState(doc?.title ?? '')
  const [ref,   setRef]   = useState(doc?.ref   ?? '')
  const [notes, setNotes] = useState(doc?.notes ?? '')

  function save() {
    if (!title.trim()) return
    if (doc) {
      dispatch({
        type: 'UPDATE_DOC',
        payload: { ...doc, type, title: title.trim(), ref: ref.trim(), notes: notes.trim() },
      })
    } else {
      dispatch({
        type: 'ADD_DOC',
        payload: { id: `doc_${Date.now()}`, type, title: title.trim(), ref: ref.trim(), notes: notes.trim() },
      })
    }
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
          <span className="font-semibold text-[var(--color-text)]">{doc ? 'Edit document' : 'Add document'}</span>
          <motion.button onClick={onClose} whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="var(--color-muted)" />
          </motion.button>
        </div>

        <div className="px-5 pt-4 pb-4 space-y-4 overflow-y-auto max-h-[72vh]">
          {/* Type grid */}
          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-2">Type</p>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map(t => (
                <motion.button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  whileTap={{ scale: 0.95 }}
                  className={`py-2.5 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-colors ${
                    type === t.id
                      ? 'bg-[var(--color-primary-dim)] border border-[var(--color-primary)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-muted)]'
                  }`}
                >
                  <span className="text-base">{t.icon}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Title *</p>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Erick – SGR Economy"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Reference / Number</p>
            <input
              type="text"
              className="input-field"
              placeholder="Booking ref, ticket #, phone…"
              value={ref}
              onChange={e => setRef(e.target.value)}
            />
          </div>

          <div>
            <p className="text-[var(--color-muted)] text-xs font-medium mb-1.5">Notes</p>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Any extra details…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <motion.button
            onClick={save}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold text-sm"
          >
            {doc ? 'Save changes' : 'Save document'}
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
