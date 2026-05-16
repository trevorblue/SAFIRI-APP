import { useState } from 'react'
import { motion } from 'framer-motion'
import { EXPENSE_CATEGORIES, formatKES } from '../lib/constants'

const CATEGORY_COLORS = {
  activities:    '#0ABFB0',
  transport:     '#3B82F6',
  food:          '#F97316',
  drinks:        '#F59E0B',
  accommodation: '#8B5CF6',
  shopping:      '#EC4899',
  tips:          '#10B981',
  photography:   '#6366F1',
  data:          '#06B6D4',
  other:         '#64748B',
}

const R = 40
const CIRCUMFERENCE = 2 * Math.PI * R

export default function DonutChart({ byCategory, total }) {
  const [activeId, setActiveId] = useState(null)

  const segments = EXPENSE_CATEGORIES
    .filter(c => (byCategory[c.id] ?? 0) > 0)
    .map(c => ({
      ...c,
      value: byCategory[c.id],
      color: CATEGORY_COLORS[c.id] ?? '#64748B',
      pct:   byCategory[c.id] / total,
    }))
    .sort((a, b) => b.value - a.value)

  if (segments.length === 0) return null

  const svgSegs = segments.reduce((result, seg) => {
    const dash    = seg.pct * CIRCUMFERENCE
    const startOff = result.length > 0
      ? result[result.length - 1].startOff + result[result.length - 1].dash
      : 0
    return [...result, { ...seg, dash, startOff }]
  }, [])

  const active = segments.find(s => s.id === activeId) ?? segments[0]

  return (
    <div className="mx-4 mb-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
      <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-4">
        Spend breakdown
      </p>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative shrink-0 w-[110px] h-[110px]">
          <svg viewBox="0 0 100 100" width="110" height="110">
            <circle cx="50" cy="50" r={R} fill="none"
              stroke="var(--color-surface-3)" strokeWidth="16" />
            <g transform="rotate(-90 50 50)">
              {svgSegs.map((seg, i) => (
                <motion.circle
                  key={seg.id}
                  cx="50" cy="50" r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${seg.dash} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-seg.startOff}
                  onClick={() => setActiveId(seg.id === activeId ? null : seg.id)}
                  style={{ cursor: 'pointer' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeId && activeId !== seg.id ? 0.25 : 1 }}
                  transition={{ duration: 0.25, delay: i * 0.07 }}
                />
              ))}
            </g>
          </svg>
          {/* Center overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl leading-none">{active.icon}</span>
            <span className="text-[var(--color-text)] text-xs font-bold tabular-nums mt-0.5">
              {Math.round(active.pct * 100)}%
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1 min-w-0">
          {segments.map(seg => {
            const isActive = activeId ? activeId === seg.id : seg.id === segments[0].id
            return (
              <motion.button
                key={seg.id}
                onClick={() => setActiveId(seg.id === activeId ? null : seg.id)}
                className="w-full flex items-center gap-2 py-1 px-1.5 rounded-lg text-left"
                animate={{ backgroundColor: isActive ? 'var(--color-surface-2)' : 'transparent' }}
                transition={{ duration: 0.15 }}
                whileTap={{ scale: 0.96 }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[var(--color-text)] text-[11px] truncate flex-1">{seg.label}</span>
                <span className="text-[var(--color-muted)] text-[10px] tabular-nums shrink-0">
                  {Math.round(seg.pct * 100)}%
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Active category detail */}
      <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
        <span className="text-[var(--color-muted)] text-xs">
          {active.icon} {active.label}
        </span>
        <span className="text-[var(--color-text)] text-sm font-semibold tabular-nums">
          {formatKES(active.value)}
        </span>
      </div>
    </div>
  )
}
