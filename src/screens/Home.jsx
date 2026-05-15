import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useTrip } from '../context/TripContext'
import { formatKES } from '../lib/constants'

export default function Home({ onEnterTrip, onCreateTrip }) {
  const { user, signOut }              = useAuth()
  const { state, computed }            = useTrip()
  const { trip, setupComplete }        = state

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-bg)] px-5 pt-12 pb-10"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[var(--color-text)] text-2xl font-bold">My Trips</h1>
          {user?.email && (
            <p className="text-[var(--color-muted)] text-xs mt-0.5 truncate max-w-[200px]">{user.email}</p>
          )}
        </div>
        <button
          onClick={signOut}
          className="shrink-0 text-[var(--color-muted)] text-xs font-medium border border-[var(--color-border)] rounded-full px-3 py-1.5 mt-1"
        >
          Sign out
        </button>
      </div>

      {setupComplete ? (
        <>
          {/* Active trip */}
          <p className="text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-3">
            Active
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 mb-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[var(--color-primary)] text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {trip.name}
                </p>
                <h2 className="text-[var(--color-text)] text-xl font-bold">{trip.destination}</h2>
                {trip.startDate && trip.endDate && (
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">
                    {format(parseISO(trip.startDate), 'MMM d')} – {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-medium bg-[var(--color-primary-dim)] text-[var(--color-primary)] px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>

            {/* Budget progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[var(--color-muted)]">{formatKES(computed.totalSpent)} spent</span>
                <span className="text-[var(--color-muted)]">{formatKES(computed.totalBudget)} budget</span>
              </div>
              <div className="h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(computed.spentPercent * 100, 100)}%`,
                    backgroundColor: computed.spentPercent >= 0.9
                      ? 'var(--color-danger)'
                      : computed.spentPercent >= 0.75
                        ? 'var(--color-warning)'
                        : 'var(--color-primary)',
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted)] text-xs">
                {computed.confirmedMembers.length} member{computed.confirmedMembers.length !== 1 ? 's' : ''}
              </span>
              <motion.button
                onClick={onEnterTrip}
                whileTap={{ scale: 0.95 }}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold px-5 py-2 rounded-xl"
              >
                Enter trip →
              </motion.button>
            </div>
          </motion.div>

          {/* New trip CTA */}
          <motion.button
            onClick={onCreateTrip}
            whileTap={{ scale: 0.97 }}
            className="w-full border-2 border-dashed border-[var(--color-border)] rounded-2xl p-5 text-center text-[var(--color-muted)] text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
          >
            + Plan a new trip
          </motion.button>
        </>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center pt-16 text-center"
        >
          <span className="text-6xl mb-5">🗺️</span>
          <h2 className="text-[var(--color-text)] text-xl font-bold mb-2">No trips yet</h2>
          <p className="text-[var(--color-muted)] text-sm mb-8 max-w-[240px]">
            Plan your first trip — set a budget, build an itinerary, and split costs with your crew.
          </p>
          <motion.button
            onClick={onCreateTrip}
            whileTap={{ scale: 0.95 }}
            className="bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold px-8 py-3 rounded-xl text-sm"
          >
            Plan a trip
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
