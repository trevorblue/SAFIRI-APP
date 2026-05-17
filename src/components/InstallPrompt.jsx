import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DISMISSED_KEY = 'safiri_install_dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isDismissed  = localStorage.getItem(DISMISSED_KEY) === 'true'
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    if (isDismissed || isStandalone) return

    function handler(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    dismiss()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] z-30"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 8px) + 76px)' }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        >
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-black/20">
            <span className="text-2xl shrink-0">📲</span>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--color-text)] text-sm font-semibold">Add to home screen</p>
              <p className="text-[var(--color-muted)] text-[11px]">Install Safiri for a faster, app-like experience</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={dismiss}
                className="text-[var(--color-muted)] text-xs py-1 px-2"
              >
                Later
              </button>
              <motion.button
                onClick={install}
                className="bg-[var(--color-primary)] text-[var(--color-bg)] text-xs font-semibold px-3 py-1.5 rounded-xl"
                whileTap={{ scale: 0.93 }}
              >
                Install
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
