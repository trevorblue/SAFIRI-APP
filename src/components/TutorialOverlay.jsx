import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { markTutorialSeen } from '../lib/tutorial'

const GAP      = 16   // px between tooltip bottom and spotlight top
const PAD      = 10   // px padding around highlighted element
const TIP_W    = 272  // tooltip width

const STEPS = [
  {
    target: '[data-tour="fab"]',
    circle: true,
    title: 'Log an expense',
    desc: 'Tap + any time to record a spend — amount, category, who paid, split between members.',
  },
  {
    target: '[data-tour="tab-budget"]',
    title: 'Budget dashboard',
    desc: 'Live overview of total spent vs budget, today\'s burn rate, and spend by category.',
  },
  {
    target: '[data-tour="tab-members"]',
    title: 'Group members',
    desc: 'Add every traveller, set individual budgets, and track who\'s contributed what.',
  },
  {
    target: '[data-tour="tab-settle"]',
    title: 'Settle Up',
    desc: 'At trip end — see the exact transfers so everyone ends even. No spreadsheet needed.',
  },
  {
    target: '[data-tour="tab-more"]',
    title: 'More features',
    desc: 'Itinerary planner, checklist, document vault, trip setup — and replay this tour.',
  },
]

export default function TourOverlay({ onClose }) {
  const [step, setStep]     = useState(0)
  const [spot, setSpot]     = useState(null)   // { x, y, w, h, cx, cy }
  const [vp,   setVp]       = useState({ W: window.innerWidth, H: window.innerHeight })

  const current = STEPS[step]

  const measure = useCallback(() => {
    const W  = window.innerWidth
    const H  = window.innerHeight
    setVp({ W, H })
    const el = document.querySelector(current.target)
    if (!el) { setSpot(null); return }
    const r  = el.getBoundingClientRect()
    const x  = r.left - PAD
    const y  = r.top  - PAD
    const w  = r.width  + PAD * 2
    const h  = r.height + PAD * 2
    setSpot({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 })
  }, [current.target])

  useEffect(() => {
    const id = setTimeout(measure, 55)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(id); window.removeEventListener('resize', measure) }
  }, [measure])

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  function dismiss() {
    markTutorialSeen()
    onClose()
  }

  const { W, H } = vp
  const isLast   = step === STEPS.length - 1

  /* ── Spotlight shape ── */
  const rx = spot ? (current.circle ? Math.min(spot.w, spot.h) / 2 : 14) : 0

  /* ── Tooltip placement — always above the spotlight (tab bar is at bottom) ── */
  const rawLeft      = spot ? spot.cx - TIP_W / 2 : (W - TIP_W) / 2
  const tipLeft      = Math.max(16, Math.min(W - TIP_W - 16, rawLeft))
  const tipCX        = tipLeft + TIP_W / 2
  const tipBottomY   = spot ? spot.y - GAP : H / 2   // tooltip's bottom edge in screen px from top
  const cssBottom    = H - tipBottomY                  // CSS bottom value

  /* ── Curved arrow: tooltip bottom-centre → spotlight top-centre ── */
  const ax1 = tipCX
  const ay1 = tipBottomY
  const ax2 = spot ? spot.cx : W / 2
  const ay2 = spot ? spot.y + 3 : H / 2   // slightly inside spotlight top

  const dy  = ay2 - ay1
  const cx1 = ax1 + (ax2 - ax1) * 0.25
  const cy1 = ay1 + dy * 0.58
  const cx2 = ax2 - (ax2 - ax1) * 0.25
  const cy2 = ay2 - dy * 0.32

  /* ── Arrowhead ── */
  const angle = Math.atan2(ay2 - cy2, ax2 - cx2)
  const aLen  = 9
  const f     = (n) => n.toFixed(2)
  const tip   = `${f(ax2)},${f(ay2)}`
  const w1    = `${f(ax2 - aLen * Math.cos(angle - 0.42))},${f(ay2 - aLen * Math.sin(angle - 0.42))}`
  const w2    = `${f(ax2 - aLen * Math.cos(angle + 0.42))},${f(ay2 - aLen * Math.sin(angle + 0.42))}`

  const trans = 'x 0.33s,y 0.33s,width 0.33s,height 0.33s,rx 0.33s,ry 0.33s'

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>

      {/* ── SVG overlay ── */}
      <svg width={W} height={H} className="absolute inset-0" style={{ overflow: 'visible' }}>
        <defs>
          <mask id="tour-mask">
            <rect width={W} height={H} fill="white" />
            {spot && (
              <rect
                x={spot.x} y={spot.y} width={spot.w} height={spot.h}
                rx={rx}    ry={rx}
                fill="black"
                style={{ transition: trans }}
              />
            )}
          </mask>
        </defs>

        {/* Dark scrim with hole */}
        <rect width={W} height={H} fill="rgba(0,0,0,0.78)" mask="url(#tour-mask)" />

        {/* Spotlight glow ring */}
        {spot && (
          <rect
            x={spot.x - 1.5} y={spot.y - 1.5}
            width={spot.w + 3} height={spot.h + 3}
            rx={rx + 1.5}     ry={rx + 1.5}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="2"
            style={{ transition: trans }}
          />
        )}

        {/* Curved arrow */}
        {spot && (
          <g opacity="0.92">
            <path
              d={`M ${f(ax1)} ${f(ay1)} C ${f(cx1)} ${f(cy1)} ${f(cx2)} ${f(cy2)} ${f(ax2)} ${f(ay2)}`}
              stroke="white"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            <polygon points={`${tip} ${w1} ${w2}`} fill="white" />
          </g>
        )}
      </svg>

      {/* ── Tooltip ── */}
      <AnimatePresence mode="wait">
        {spot && (
          <motion.div
            key={step}
            className="absolute"
            style={{ left: tipLeft, bottom: cssBottom, width: TIP_W, pointerEvents: 'auto' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
          >
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <span className="text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest">
                  {step + 1} of {STEPS.length}
                </span>
                <button
                  onClick={dismiss}
                  className="text-[var(--color-muted)] text-xs font-medium py-1"
                >
                  Skip tour
                </button>
              </div>

              {/* Body */}
              <div className="px-4 pt-2.5 pb-3">
                <p className="text-[var(--color-text)] text-base font-bold mb-1.5">{current.title}</p>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">{current.desc}</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex gap-1.5 items-center">
                  {STEPS.map((_, i) => (
                    <motion.span
                      key={i}
                      className="block h-1.5 rounded-full"
                      animate={{
                        width: i === step ? 16 : 5,
                        backgroundColor: i <= step
                          ? 'var(--color-primary)'
                          : 'var(--color-surface-3)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  ))}
                </div>

                <motion.button
                  onClick={next}
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)' }}
                  whileTap={{ scale: 0.93 }}
                >
                  {isLast ? 'Done ✓' : 'Next →'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
