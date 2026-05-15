import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TripProvider, useTrip } from './context/TripContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { seedDemoData } from './lib/demoSeed'
import Splash from './screens/Splash'
import Login from './screens/Login'
import Home from './screens/Home'
import Onboarding from './screens/Onboarding'
import Layout from './components/Layout'
import Dashboard from './screens/Dashboard'
import Itinerary from './screens/Itinerary'
import ExpenseLog from './screens/ExpenseLog'
import AffordCalculator from './screens/AffordCalculator'
import TripSetup from './screens/TripSetup'
import Members from './screens/Members'
import SettleUp from './screens/SettleUp'
import Checklist from './screens/Checklist'
import DocumentVault from './screens/DocumentVault'
import ShareView from './screens/ShareView'

// Visiting /?seed=1 loads demo data and reloads the app — works from any state
if (new URLSearchParams(window.location.search).get('seed') === '1') {
  seedDemoData()
}

function AppRoutes({ onExitTrip }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onExitTrip={onExitTrip} />}>
          <Route index element={<Dashboard />} />
          <Route path="itinerary" element={<Itinerary />} />
          <Route path="expenses" element={<ExpenseLog />} />
          <Route path="afford" element={<AffordCalculator />} />
          <Route path="setup" element={<TripSetup />} />
          <Route path="members" element={<Members />} />
          <Route path="settle" element={<SettleUp />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="docs" element={<DocumentVault />} />
        </Route>
        {/* Read-only share view — no nav bar */}
        <Route path="share" element={<ShareView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function AppShell() {
  const [splashDone, setSplashDone] = useState(false)
  // 'home' | 'onboarding' | 'trip'
  const [view, setView] = useState('home')
  const { session } = useAuth()
  const { state } = useTrip()

  // After onboarding completes, return to Home so the new trip card is visible
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state.setupComplete && view === 'onboarding') setView('home')
  }, [state.setupComplete, view])

  // Reset to home on sign-out so the next sign-in starts fresh
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (session === null) setView('home')
  }, [session])

  return (
    <AnimatePresence mode="wait">
      {/* Keep splash visible until animation ends AND auth has resolved */}
      {(!splashDone || session === undefined) ? (
        <Splash key="splash" onDone={() => setSplashDone(true)} />
      ) : session === null ? (
        <Login key="login" />
      ) : view === 'onboarding' ? (
        <Onboarding key="onboarding" />
      ) : view === 'trip' && state.setupComplete ? (
        <AppRoutes key="app" onExitTrip={() => setView('home')} />
      ) : (
        <Home
          key="home"
          onEnterTrip={() => setView('trip')}
          onCreateTrip={() => setView('onboarding')}
        />
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <AppShell />
      </TripProvider>
    </AuthProvider>
  )
}
