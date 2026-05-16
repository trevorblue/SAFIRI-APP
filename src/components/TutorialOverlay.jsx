import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { markTutorialSeen } from '../lib/tutorial'

const STEPS = [
  {
    icon: '🗓',
    title: 'Set up your trip',
    desc: 'Dates, budget, transport — everything configured in one place. Find it any time under Trip Setup.',
    action: 'Trip Setup → More menu',
  },
  {
    icon: '👥',
    title: 'Add your group',
    desc: 'Add every traveller under Members. Each person gets their own budget and spending tracker.',
    action: 'Members tab → bottom nav',
  },
  {
    icon: '🧾',
    title: 'Log expenses',
    desc: 'Tap + to record a spend. Split it between members and tag who paid — Settle Up uses this.',
    action: '+ button → centre tab',
  },
  {
    icon: '✅',
    title: 'Settle Up at the end',
    desc: "See who paid more than their share and who owes who. One screen, no spreadsheets.",
    action: 'Settle tab → bottom nav',
  },
]

const slideVariants = {
  enter: dir => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
}

export default function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0)
  const [dir, setDir]   = useState(1)

  function next() {
    if (step < STEPS.length - 1) {
      setDir(1)
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  function prev() {
    if (step > 0) {
      setDir(-1)
      setStep(s => s - 1)
    }
  }

  function dismiss() {
    markTutorialSeen()
    onClose()
  }

  const current = STEPS[step]
  const isLast  = step === STEPS.length - 1

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={dismiss}
      />

      {/* Card */}
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 pb-[env(safe-area-inset-bottom,20px)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
      >
        <div className="mx-3 mb-3 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between px-5 pt-1 pb-2">
            <span className="text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold">
              Quick tour
            </span>
            <motion.button
              onClick={dismiss}
              className="text-[var(--color-muted)] text-xs font-medium px-2.5 py-1 rounded-full border border-[var(--color-border)]"
              whileTap={{ scale: 0.9 }}
            >
              Skip
            </motion.button>
          </div>

          {/* Step content — slides */}
          <div className="relative overflow-hidden" style={{ minHeight: 220 }}>
            <AnimatePresence custom={dir} mode="wait" initial={false}>
              <motion.div
                key={step}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                className="px-6 pb-6 pt-2"
              >
                {/* Icon */}
                <motion.div
                  className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary-dim)] border border-[color:var(--color-primary)]/20 mb-5"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.06, type: 'spring', stiffness: 400, damping: 24 }}
                >
                  <span className="text-4xl leading-none">{current.icon}</span>
                </motion.div>

                {/* Text */}
                <p className="text-[var(--color-text)] text-xl font-bold mb-2">{current.title}</p>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed mb-4">{current.desc}</p>

                {/* Action hint */}
                <div className="inline-flex items-center gap-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-full px-3 py-1.5">
                  <span className="text-[var(--color-primary)] text-[10px] font-semibold uppercase tracking-wide">
                    {current.action}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="flex items-center justify-between px-5 pb-5 pt-1">
            {/* Back */}
            <motion.button
              onClick={prev}
              className="text-[var(--color-muted)] text-sm font-medium w-16 text-left"
              style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}
              whileTap={{ scale: 0.9 }}
            >
              Back
            </motion.button>

            {/* Dots */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => { setDir(i > step ? 1 : -1); setStep(i) }}
                  animate={{
                    width: i === step ? 20 : 6,
                    backgroundColor: i === step ? 'var(--color-primary)' : 'var(--color-surface-3)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>

            {/* Next / Done */}
            <motion.button
              onClick={next}
              className="w-16 text-right text-sm font-semibold"
              style={{ color: 'var(--color-primary)' }}
              whileTap={{ scale: 0.9 }}
            >
              {isLast ? 'Done' : 'Next'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
