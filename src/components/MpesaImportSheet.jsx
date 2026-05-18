import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { formatKES, EXPENSE_CATEGORIES } from '../lib/constants'
import { CloseIcon } from './icons'
import { parseMpesaPdf } from '../lib/mpesaParse'

export default function MpesaImportSheet({ members, onImport, onClose }) {
  const [step, setStep]         = useState('pick')   // 'pick' | 'parsing' | 'review' | 'error'
  const [txns, setTxns]         = useState([])
  const [selected, setSelected] = useState(new Set())
  const [errMsg, setErrMsg]     = useState('')
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setStep('parsing')
    try {
      const parsed = await parseMpesaPdf(file)
      if (parsed.length === 0) {
        setErrMsg('No debit transactions found. Make sure this is an M-Pesa statement PDF with selectable text.')
        setStep('error')
        return
      }
      setTxns(parsed)
      setSelected(new Set(parsed.map(t => t.id)))
      setStep('review')
    } catch (err) {
      setErrMsg(`Could not read PDF: ${err.message ?? err}`)
      setStep('error')
    }
  }

  function toggleAll() {
    if (selected.size === txns.length) setSelected(new Set())
    else setSelected(new Set(txns.map(t => t.id)))
  }

  function toggleOne(id) {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleImport() {
    const toImport = txns.filter(t => selected.has(t.id)).map(t => ({
      ...t,
      splitBetween: members.map(m => m.id),
    }))
    onImport(toImport)
    onClose()
  }

  const catIcon = (id) => EXPENSE_CATEGORIES.find(c => c.id === id)?.icon ?? '📌'

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,24px)] max-h-[90vh] flex flex-col"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-[var(--color-border)] shrink-0">
          <span className="font-semibold text-[var(--color-text)]">Import M-Pesa Statement</span>
          <motion.button onClick={onClose} className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── Step: pick file ── */}
            {step === 'pick' && (
              <motion.div key="pick"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-5 py-6 text-center"
              >
                <p className="text-4xl mb-3">📄</p>
                <p className="text-[var(--color-text)] font-semibold mb-1">Upload your M-Pesa statement</p>
                <p className="text-[var(--color-muted)] text-sm mb-6 max-w-[280px] mx-auto">
                  Download a PDF statement from Safaricom or the M-Pesa app, then upload it here.
                  Debit transactions are auto-detected.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFile}
                />
                <motion.button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-4 rounded-2xl font-semibold text-base"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  Choose PDF
                </motion.button>
                <p className="text-[var(--color-muted)] text-[11px] mt-3">
                  The file is processed locally — never uploaded to any server.
                </p>
              </motion.div>
            )}

            {/* ── Step: parsing ── */}
            {step === 'parsing' && (
              <motion.div key="parsing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-5 py-12 text-center"
              >
                <motion.div
                  className="w-10 h-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-[var(--color-muted)] text-sm">Reading statement…</p>
              </motion.div>
            )}

            {/* ── Step: error ── */}
            {step === 'error' && (
              <motion.div key="error"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="px-5 py-8 text-center"
              >
                <p className="text-4xl mb-3">⚠️</p>
                <p className="text-[var(--color-danger)] text-sm font-medium mb-4">{errMsg}</p>
                <motion.button
                  onClick={() => { setStep('pick'); setErrMsg('') }}
                  className="px-6 py-2.5 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-text)] text-sm font-medium"
                  whileTap={{ scale: 0.96 }}
                >
                  Try another file
                </motion.button>
              </motion.div>
            )}

            {/* ── Step: review ── */}
            {step === 'review' && (
              <motion.div key="review"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {/* Summary bar */}
                <div className="px-5 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                  <p className="text-[var(--color-muted)] text-xs">
                    {txns.length} transaction{txns.length !== 1 ? 's' : ''} found
                    {' · '}{formatKES(txns.filter(t => selected.has(t.id)).reduce((s, t) => s + t.amount, 0))} selected
                  </p>
                  <button onClick={toggleAll} className="text-[var(--color-primary)] text-xs font-semibold">
                    {selected.size === txns.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>

                {/* Transaction list */}
                <div className="divide-y divide-[var(--color-border)]">
                  {txns.map(t => {
                    const checked = selected.has(t.id)
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => toggleOne(t.id)}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left"
                        whileTap={{ backgroundColor: 'var(--color-surface-2)' }}
                      >
                        {/* Checkbox */}
                        <motion.span
                          className="w-5 h-5 rounded-full shrink-0 border-2 flex items-center justify-center text-[10px] font-bold"
                          animate={{
                            borderColor: checked ? 'var(--color-primary)' : 'var(--color-border-strong)',
                            backgroundColor: checked ? 'var(--color-primary)' : 'transparent',
                            color: checked ? 'var(--color-bg)' : 'transparent',
                          }}
                          transition={{ duration: 0.15 }}
                        >✓</motion.span>

                        <span className="text-lg w-6 shrink-0 text-center">{catIcon(t.category)}</span>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${checked ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}>
                            {t.description}
                          </p>
                          <p className="text-[var(--color-muted)] text-[10px] mt-0.5">
                            {format(new Date(t.date), 'd MMM yyyy')}
                          </p>
                        </div>

                        <span className={`font-semibold text-sm tabular-nums shrink-0 ${checked ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}`}>
                          {formatKES(t.amount)}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer action — only in review */}
        {step === 'review' && (
          <div className="px-5 py-3 border-t border-[var(--color-border)] shrink-0">
            <motion.button
              onClick={handleImport}
              disabled={selected.size === 0}
              className="w-full py-4 rounded-2xl font-semibold text-base"
              style={{
                backgroundColor: selected.size > 0 ? 'var(--color-primary)' : 'var(--color-surface-3)',
                color:           selected.size > 0 ? 'var(--color-bg)'      : 'var(--color-muted)',
              }}
              whileTap={selected.size > 0 ? { scale: 0.96 } : {}}
            >
              Import {selected.size} expense{selected.size !== 1 ? 's' : ''}
            </motion.button>
          </div>
        )}
      </motion.div>
    </>
  )
}
