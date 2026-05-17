import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || cooldown > 0) return
    setLoading(true)
    setError(null)
    const { error } = await signIn(email.trim())
    setLoading(false)
    if (error) {
      setError('Could not send the link — please wait and try again.')
      setCooldown(60)
    } else {
      setSent(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-6"
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">✈️</div>
          <h1 className="text-[var(--color-text)] text-3xl font-bold tracking-tight">Safiri</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Plan together, travel better</p>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center"
          >
            <div className="text-3xl mb-3">📬</div>
            <p className="text-[var(--color-text)] font-semibold mb-1">Check your email</p>
            <p className="text-[var(--color-muted)] text-sm">
              Sent a sign-in link to{' '}
              <span className="text-[var(--color-text)] font-medium">{email}</span>
            </p>
            <p className="text-[var(--color-muted)] text-xs mt-3">
              Tap the link to sign in — no password needed
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-5 text-[var(--color-primary)] text-sm font-medium"
            >
              Use a different email
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[var(--color-muted)] text-xs uppercase tracking-widest font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[var(--color-danger)] text-xs">{error}</p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !email.trim()}
              whileTap={{ scale: 0.97 }}
              className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </motion.button>

            <p className="text-[var(--color-muted)] text-xs text-center">
              No password — we email you a sign-in link
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
