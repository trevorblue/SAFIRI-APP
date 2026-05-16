import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SetupIcon, PlanIcon, AffordIcon, ChecklistIcon, VaultIcon, CloseIcon, ShareIcon, HomeIcon, LogOutIcon } from './icons'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import { encodeSharePayload } from '../screens/ShareView'

const items = [
  { to: '/setup', Icon: SetupIcon, label: 'Trip Setup', desc: 'Dates, budget, transport' },
  { to: '/itinerary', Icon: PlanIcon, label: 'Plan', desc: 'Itinerary & daily schedule' },
  { to: '/afford', Icon: AffordIcon, label: 'Afford?', desc: 'Can the group afford it?' },
  { to: '/checklist', Icon: ChecklistIcon, label: 'Checklist', desc: 'Pre-trip tasks' },
  { to: '/docs', Icon: VaultIcon, label: 'Documents', desc: 'SGR refs, tickets, contacts' },
]

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: i => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 400, damping: 28 },
  }),
}

export default function MoreMenu({ onClose, onExitTrip }) {
  const navigate  = useNavigate()
  const { state, computed } = useTrip()
  const { user, signOut } = useAuth()
  const [copied, setCopied] = useState(false)

  function go(to) {
    navigate(to)
    onClose()
  }

  function shareTrip() {
    const encoded = encodeSharePayload(state, computed)
    const url = `${window.location.origin}/share?d=${encoded}`
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] z-50 pb-[env(safe-area-inset-bottom,16px)]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--color-border-strong)]" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-[var(--color-border)]">
          <span className="font-semibold text-[var(--color-text)]">More</span>
          <motion.button
            onClick={onClose}
            className="text-[var(--color-muted)] p-1"
            whileTap={{ scale: 0.85, rotate: 90 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CloseIcon size={20} stroke="currentColor" />
          </motion.button>
        </div>
        <div className="py-2">
          {/* My Trips — return to home screen */}
          {onExitTrip && (
            <>
              <motion.button
                custom={-1}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onClick={() => { onClose(); onExitTrip() }}
                className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
                whileTap={{ backgroundColor: 'var(--color-surface-2)', scale: 0.99 }}
              >
                <span className="text-[var(--color-muted)]">
                  <HomeIcon size={20} stroke="currentColor" />
                </span>
                <div>
                  <div className="text-[var(--color-text)] text-sm font-medium">My Trips</div>
                  <div className="text-[var(--color-muted)] text-xs">Switch or plan a new trip</div>
                </div>
              </motion.button>
              <div className="mx-5 my-1 border-t border-[var(--color-border)]" />
            </>
          )}

          {items.map(({ to, Icon, label, desc }, i) => (
            <motion.button
              key={to}
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              onClick={() => go(to)}
              className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
              whileTap={{ backgroundColor: 'var(--color-surface-2)', scale: 0.99 }}
            >
              <span className="text-[var(--color-primary)]">
                <Icon size={20} stroke="currentColor" />
              </span>
              <div>
                <div className="text-[var(--color-text)] text-sm font-medium">{label}</div>
                <div className="text-[var(--color-muted)] text-xs">{desc}</div>
              </div>
            </motion.button>
          ))}

          {/* Share divider */}
          <div className="mx-5 my-2 border-t border-[var(--color-border)]" />

          {/* Share group view */}
          <motion.button
            custom={items.length}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            onClick={shareTrip}
            className="w-full flex items-center gap-4 px-5 py-3.5 text-left"
            whileTap={{ backgroundColor: 'var(--color-surface-2)', scale: 0.99 }}
          >
            <span className="text-[var(--color-success)]">
              <ShareIcon size={20} stroke="currentColor" />
            </span>
            <div className="flex-1">
              <div className="text-[var(--color-text)] text-sm font-medium">Share group view</div>
              <div className="text-[var(--color-muted)] text-xs">Copy read-only link for the group</div>
            </div>
            <AnimatePresence>
              {copied && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[var(--color-success)] text-xs font-semibold shrink-0"
                >
                  Copied!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Account section */}
          <div className="mx-5 my-2 border-t border-[var(--color-border)]" />
          <div className="px-5 py-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-widest font-semibold mb-0.5">Account</p>
              <p className="text-[var(--color-text)] text-xs truncate max-w-[200px]">{user?.email}</p>
            </div>
            <motion.button
              onClick={async () => { onClose(); await signOut() }}
              className="shrink-0 flex items-center gap-1.5 text-[var(--color-danger)] text-xs font-medium border border-[var(--color-danger)]/30 rounded-full px-3 py-1.5"
              whileTap={{ scale: 0.94 }}
            >
              <LogOutIcon size={14} stroke="currentColor" />
              Sign out
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
