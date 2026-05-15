import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Splash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-bg)] z-[100]"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Pulse rings */}
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-[color:var(--color-primary)]/20"
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{ width: 80 + i * 80, height: 80 + i * 80, opacity: 0 }}
          transition={{
            duration: 2,
            ease: 'easeOut',
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Logo mark */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.82, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      >
        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-3xl bg-[var(--color-primary)] flex items-center justify-center mb-6 shadow-2xl shadow-[color:var(--color-primary)]/40"
          animate={{ boxShadow: [
            '0 0 40px 0 rgba(10,191,176,0.3)',
            '0 0 70px 8px rgba(10,191,176,0.5)',
            '0 0 40px 0 rgba(10,191,176,0.3)',
          ]}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
            {/* Compass needle */}
            <circle cx="21" cy="21" r="18" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <circle cx="21" cy="21" r="3" fill="white" />
            <polygon points="21,5 24,21 21,18 18,21" fill="white" />
            <polygon points="21,37 18,21 21,24 24,21" fill="rgba(255,255,255,0.4)" />
            <polygon points="5,21 21,18 18,21 21,24" fill="rgba(255,255,255,0.4)" />
            <polygon points="37,21 21,24 24,21 21,18" fill="white" />
          </svg>
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          className="text-[var(--color-text)] font-bold tracking-[0.18em] uppercase text-3xl mb-2"
          initial={{ opacity: 0, letterSpacing: '0.4em' }}
          animate={{ opacity: 1, letterSpacing: '0.18em' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          Safiri
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-[var(--color-muted)] text-sm tracking-wide"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
        >
          Journey. Budget. Together.
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}
