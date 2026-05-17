import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context/TripContext'
import { formatKES } from '../lib/constants'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import MoreMenu from './MoreMenu'
import TutorialOverlay from './TutorialOverlay'
import { hasTutorialBeenSeen } from '../lib/tutorial'
import { BudgetIcon, MembersIcon, SettleIcon, MoreIcon, AddIcon, HomeIcon } from './icons'

const TABS = [
  { to: '/', Icon: BudgetIcon,  label: 'Budget',  tourId: 'tab-budget'  },
  { to: '/members', Icon: MembersIcon, label: 'Members', tourId: 'tab-members' },
  null,
  { to: '/settle', Icon: SettleIcon, label: 'Settle', tourId: 'tab-settle' },
]

export default function Layout({ onExitTrip, onCompleteTrip }) {
  const { computed } = useTrip()
  const online = useOnlineStatus()
  const [showMore, setShowMore]         = useState(false)
  const [showTutorial, setShowTutorial] = useState(() => !hasTutorialBeenSeen())
  const navigate = useNavigate()
  const location = useLocation()
  const alertsMuted = localStorage.getItem('safiri_alerts_muted') === 'true'

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Offline banner */}
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline"
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -32, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="px-4 py-2 text-center text-xs font-semibold tracking-wide bg-[var(--color-surface-2)] text-[var(--color-muted)]"
          >
            No internet · changes saved locally
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert banner */}
      <AnimatePresence>
        {computed.alertLevel && !alertsMuted && (
          <motion.div
            key="alert"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`px-4 py-2 text-center text-xs font-semibold tracking-wide ${
              computed.alertLevel === 'danger'
                ? 'bg-[var(--color-danger-dim)] text-[var(--color-danger)]'
                : 'bg-[var(--color-warning-dim)] text-[var(--color-warning)]'
            }`}
          >
            {computed.alertLevel === 'danger'
              ? `⚠ 90%+ used — ${formatKES(computed.totalRemaining)} remaining`
              : `⚡ 75% of budget used — review spending`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="min-h-full"
          >
            <Outlet context={{ onExitTrip }} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] z-40">
        <div className="flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
          <motion.button
            onClick={onExitTrip}
            className="flex flex-col items-center gap-1 py-1 px-2 text-[var(--color-muted)]"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <HomeIcon size={22} stroke="currentColor" />
            <span className="text-[10px]">Home</span>
          </motion.button>

          {TABS.map((tab) => {
            if (!tab) {
              return (
                <motion.button
                  key="fab"
                  onClick={() => { navigate('/expenses') }}
                  className="flex flex-col items-center gap-1 -mt-5"
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <span data-tour="fab" className="relative w-14 h-14 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[color:var(--color-primary)]/30">
                    <AddIcon size={26} stroke="var(--color-bg)" />
                    {computed.pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[var(--color-danger)] flex items-center justify-center px-1">
                        <span className="text-white text-[10px] font-bold leading-none">{computed.pendingCount}</span>
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted)]">Add</span>
                </motion.button>
              )
            }

            const { to, Icon, label, tourId } = tab

            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                data-tour={tourId}
                className="relative flex flex-col items-center gap-1 py-1 px-3"
              >
                {({ isActive }) => (
                  <>
                    <motion.span
                      animate={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                      transition={{ duration: 0.18 }}
                    >
                      <Icon size={22} stroke="currentColor" />
                    </motion.span>
                    <motion.span
                      className="text-[10px] font-medium"
                      animate={{ color: isActive ? 'var(--color-primary)' : 'var(--color-muted)' }}
                      transition={{ duration: 0.18 }}
                    >
                      {label}
                    </motion.span>
                    <AnimatePresence>
                      {isActive && (
                        <motion.span
                          layoutId="tab-dot"
                          className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            )
          })}

          <motion.button
            data-tour="tab-more"
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 text-[var(--color-muted)]"
            whileTap={{ scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <MoreIcon size={22} stroke="currentColor" />
            <span className="text-[10px]">More</span>
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {showMore && (
          <MoreMenu
            onClose={() => setShowMore(false)}
            onExitTrip={onExitTrip}
            onCompleteTrip={onCompleteTrip}
            onShowTutorial={() => { setShowMore(false); setShowTutorial(true) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>
    </div>
  )
}
