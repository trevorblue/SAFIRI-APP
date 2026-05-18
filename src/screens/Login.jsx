import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const PREVIEW_SLIDES = [
  {
    icon: '✈️',
    title: 'Plan together',
    desc: 'Create a group trip, invite members via a link, and plan every detail in one place.',
  },
  {
    icon: '💰',
    title: 'Track expenses in KES',
    desc: 'Log shared costs, split bills, and watch the live budget bar so no one overspends.',
  },
  {
    icon: '📋',
    title: 'Itinerary & checklist',
    desc: 'Day-by-day plans, packing lists, and a document vault for tickets and bookings.',
  },
  {
    icon: '📊',
    title: 'Settle up instantly',
    desc: 'At trip end, see exactly who owes who — no spreadsheets needed.',
  },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function Login() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle } = useAuth()

  const [mode, setMode]           = useState('signin')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError]         = useState(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [preview, setPreview]     = useState(false)
  const [slide, setSlide]         = useState(0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError(null)

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email.trim(), password)
      setLoading(false)
      if (error) setError('Incorrect email or password.')
    } else {
      const { data, error } = await signUpWithPassword(email.trim(), password)
      setLoading(false)
      if (error) {
        setError(error.message ?? 'Could not create account.')
      } else if (!data.session) {
        // Supabase requires email confirmation before session is issued
        setNeedsConfirm(true)
      }
      // If data.session exists AuthContext picks it up automatically
    }
  }

  async function handleGoogle() {
    setGoogleBusy(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setGoogleBusy(false)
      setError('Google sign-in failed. Try again.')
    }
    // On success the browser redirects — no need to reset loading
  }

  function switchMode(m) {
    setMode(m)
    setError(null)
    setPassword('')
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
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✈️</div>
          <h1 className="text-[var(--color-text)] text-3xl font-bold tracking-tight">Safiri</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Plan together, travel better</p>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Email confirmation needed ── */}
          {needsConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 text-center"
            >
              <div className="text-3xl mb-3">📬</div>
              <p className="text-[var(--color-text)] font-semibold mb-1">Confirm your email</p>
              <p className="text-[var(--color-muted)] text-sm leading-relaxed">
                We sent a confirmation link to{' '}
                <span className="text-[var(--color-text)] font-medium">{email}</span>.
                Click it to activate your account, then sign in.
              </p>
              <button
                onClick={() => { setNeedsConfirm(false); setMode('signin'); setPassword('') }}
                className="mt-5 text-[var(--color-primary)] text-sm font-medium"
              >
                Back to sign in
              </button>
            </motion.div>

          /* ── App preview ── */
          ) : preview ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden"
            >
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="text-center min-h-[120px] flex flex-col items-center justify-center"
                  >
                    <div className="text-4xl mb-3">{PREVIEW_SLIDES[slide].icon}</div>
                    <p className="text-[var(--color-text)] font-semibold text-base mb-2">
                      {PREVIEW_SLIDES[slide].title}
                    </p>
                    <p className="text-[var(--color-muted)] text-sm leading-relaxed">
                      {PREVIEW_SLIDES[slide].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-1.5 mt-5">
                  {PREVIEW_SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === slide
                          ? 'bg-[var(--color-primary)]'
                          : 'bg-[var(--color-border)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] p-4 flex gap-3">
                <button
                  onClick={() => slide === 0 ? setPreview(false) : setSlide(s => s - 1)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] text-sm"
                >
                  {slide === 0 ? 'Back' : 'Previous'}
                </button>
                {slide < PREVIEW_SLIDES.length - 1 ? (
                  <button
                    onClick={() => setSlide(s => s + 1)}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => { setPreview(false); setMode('signup') }}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-bg)] text-sm font-semibold"
                  >
                    Get started
                  </button>
                )}
              </div>
            </motion.div>

          /* ── Main auth form ── */
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Mode toggle */}
              <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1 mb-5">
                {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      mode === m
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg)]'
                        : 'text-[var(--color-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Google */}
              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={googleBusy}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-3 text-[var(--color-text)] text-sm font-medium mb-4 disabled:opacity-50"
              >
                <GoogleIcon />
                {googleBusy ? 'Redirecting…' : 'Continue with Google'}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[var(--color-muted)] text-xs">or</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              {/* Email + password */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  autoFocus
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'}
                  required
                  minLength={6}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] placeholder-[var(--color-muted)] text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />

                {error && (
                  <p className="text-[var(--color-danger)] text-xs">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-[var(--color-primary)] text-[var(--color-bg)] font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-opacity"
                >
                  {loading
                    ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                    : (mode === 'signin' ? 'Sign in' : 'Create account')}
                </motion.button>
              </form>

              {/* Preview link */}
              <p className="text-center mt-5">
                <button
                  onClick={() => { setPreview(true); setSlide(0) }}
                  className="text-[var(--color-muted)] text-xs underline underline-offset-2"
                >
                  Preview the app first
                </button>
              </p>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}
