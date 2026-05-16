import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { markTutorialSeen } from '../lib/tutorial'

const GAP   = 16
const PAD   = 10
const TIP_W = 272

const STEPS = [
  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    route: '/',
    target: '[data-tour="dash-budget-card"]',
    title: 'Total remaining',
    desc: "Your group's live balance. The bar fills as you spend — turns yellow at 75%, red at 90% of budget.",
  },
  {
    route: '/',
    target: '[data-tour="dash-pax"]',
    title: 'Group size',
    desc: 'Shows how many people are on the trip. Tap it to jump straight to the Members screen.',
  },
  {
    route: '/',
    target: '[data-tour="dash-daily-card"]',
    title: 'Daily budget',
    desc: "How much the group can spend per day. Once the trip starts this switches to today's remaining.",
  },
  {
    route: '/',
    target: '[data-tour="dash-quick"]',
    title: 'Quick actions',
    desc: '"Can we afford this?" checks a purchase against your budget. The other card is a shortcut to log an expense.',
  },
  {
    route: '/',
    target: '[data-tour="dash-category"]',
    title: 'By category',
    desc: 'Every spend broken down by type. Tap a row to set a spending cap — the bar turns red if you exceed it.',
  },

  // ── Members ────────────────────────────────────────────────────────────────
  {
    route: '/members',
    target: '[data-tour="pool-analysis"]',
    title: 'Budget pool',
    desc: 'Compares what everyone committed vs the trip plan. Red = under target; green = at or above.',
  },
  {
    route: '/members',
    target: '[data-tour="member-card"]',
    title: 'Member card',
    desc: 'Each traveller gets their own card. The badge shows Confirmed, Maybe, or Dropped. Tap × to remove.',
  },
  {
    route: '/members',
    target: '[data-tour="member-stats"]',
    title: 'Budget · Share · Left',
    desc: 'Budget = their allocation. Share = their cut of group expenses. Left = what they still have to spend.',
  },
  {
    route: '/members',
    target: '[data-tour="member-cash"]',
    title: 'Cash put in',
    desc: 'Tracks money physically handed over. "Still owed" shows the gap. Tap "+ Add cash" to record a top-up.',
  },
  {
    route: '/members',
    target: '[data-tour="members-add"]',
    title: 'Add a member',
    desc: 'Tap here to add a traveller — set them Confirmed or Maybe, and optionally give them a custom budget.',
  },

  // ── Log expense ────────────────────────────────────────────────────────────
  {
    route: '/expenses',
    target: '[data-tour="fab"]',
    circle: true,
    title: 'Log an expense',
    desc: 'Tap + any time to record a spend — amount, category, who paid, and who it\'s split between.',
  },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  {
    route: null,
    target: '[data-tour="tab-settle"]',
    title: 'Settle Up',
    desc: "At trip end — one screen shows exactly who pays who so everyone ends even. No maths needed.",
  },
  {
    route: null,
    target: '[data-tour="tab-more"]',
    title: 'More features',
    desc: 'Itinerary planner, checklist, document vault, trip setup — and replay this tour — all in here.',
  },
]

export default function TourOverlay({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [step, setStep] = useState(0)
  const [spot, setSpot] = useState(null)
  const [vp,   setVp]   = useState({ W: window.innerWidth, H: window.innerHeight })

  const current = STEPS[step]

  const measure = useCallback(() => {
    const W  = window.innerWidth
    const H  = window.innerHeight
    setVp({ W, H })
    const el = document.querySelector(current.target)
    if (!el) { setSpot(null); return }
    const r = el.getBoundingClientRect()
    const x = r.left - PAD
    const y = r.top  - PAD
    const w = r.width  + PAD * 2
    const h = r.height + PAD * 2
    setSpot({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 })
  }, [current.target])

  useEffect(() => {
    const needsNav = current.route && location.pathname !== current.route
    if (needsNav) navigate(current.route)
    const delay = needsNav ? 320 : 80
    const id = setTimeout(measure, delay)
    window.addEventListener('resize', measure)
    return () => { clearTimeout(id); window.removeEventListener('resize', measure) }
  }, [measure, current.route, location.pathname, navigate])

  // Auto-skip if element not found after brief wait
  useEffect(() => {
    if (spot !== null) return
    const id = setTimeout(() => {
      if (step < STEPS.length - 1) setStep(s => s + 1)
      else dismiss()
    }, 500)
    return () => clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot])

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

  // Spotlight shape
  const rx = spot ? (current.circle ? Math.min(spot.w, spot.h) / 2 : 14) : 0

  // Tooltip — placed above the spotlight
  const rawLeft    = spot ? spot.cx - TIP_W / 2 : (W - TIP_W) / 2
  const tipLeft    = Math.max(16, Math.min(W - TIP_W - 16, rawLeft))
  const tipCX      = tipLeft + TIP_W / 2
  const tipBotY    = spot ? spot.y - GAP : H / 2
  const cssBottom  = H - tipBotY

  // When spotlight is in the top half, flip tooltip below it instead
  const topHalf    = spot && spot.cy < H * 0.45
  const tipTopY    = spot ? spot.y + spot.h + GAP : H / 2
  const cssTop     = topHalf ? tipTopY : undefined
  const cssBotFinal = topHalf ? undefined : cssBottom

  // Arrow: from tooltip edge to spotlight edge
  const ax1 = tipCX
  const ay1 = topHalf ? tipTopY : tipBotY
  const ax2 = spot ? spot.cx : W / 2
  const ay2 = topHalf ? (spot ? spot.y : H / 2) : (spot ? spot.y + spot.h : H / 2)

  const dy  = ay2 - ay1
  const cx1 = ax1 + (ax2 - ax1) * 0.25
  const cy1 = ay1 + dy * 0.55
  const cx2 = ax2 - (ax2 - ax1) * 0.25
  const cy2 = ay2 - dy * 0.35

  const angle  = Math.atan2(ay2 - cy2, ax2 - cx2)
  const aLen   = 9
  const f      = n => n.toFixed(2)
  const tipPt  = `${f(ax2)},${f(ay2)}`
  const w1     = `${f(ax2 - aLen * Math.cos(angle - 0.42))},${f(ay2 - aLen * Math.sin(angle - 0.42))}`
  const w2     = `${f(ax2 - aLen * Math.cos(angle + 0.42))},${f(ay2 - aLen * Math.sin(angle + 0.42))}`

  const trans  = 'x 0.33s,y 0.33s,width 0.33s,height 0.33s,rx 0.33s,ry 0.33s'

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      {/* SVG overlay */}
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

        <rect width={W} height={H} fill="rgba(0,0,0,0.8)" mask="url(#tour-mask)" />

        {/* Spotlight glow ring */}
        {spot && (
          <rect
            x={spot.x - 1.5} y={spot.y - 1.5}
            width={spot.w + 3} height={spot.h + 3}
            rx={rx + 1.5}     ry={rx + 1.5}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            style={{ transition: trans }}
          />
        )}

        {/* Curved arrow */}
        {spot && (
          <g opacity="0.92">
            <path
              d={`M ${f(ax1)} ${f(ay1)} C ${f(cx1)} ${f(cy1)} ${f(cx2)} ${f(cy2)} ${f(ax2)} ${f(ay2)}`}
              stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"
            />
            <polygon points={`${tipPt} ${w1} ${w2}`} fill="white" />
          </g>
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {spot && (
          <motion.div
            key={step}
            className="absolute"
            style={{
              left: tipLeft,
              ...(topHalf ? { top: cssTop } : { bottom: cssBotFinal }),
              width: TIP_W,
              pointerEvents: 'auto',
            }}
            initial={{ opacity: 0, y: topHalf ? -8 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: topHalf ? -4 : 4 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32 }}
          >
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <span className="text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-widest">
                  {step + 1} of {STEPS.length}
                </span>
                <button onClick={dismiss} className="text-[var(--color-muted)] text-xs font-medium py-1">
                  Skip tour
                </button>
              </div>

              <div className="px-4 pt-2.5 pb-3">
                <p className="text-[var(--color-text)] text-base font-bold mb-1.5">{current.title}</p>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">{current.desc}</p>
              </div>

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
