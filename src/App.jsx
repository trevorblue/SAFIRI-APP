import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { TripProvider, useTrip } from './context/TripContext'
import { seedDemoData } from './lib/demoSeed'
import Splash from './screens/Splash'

// Visiting /?seed=1 loads demo data and reloads the app — works from any state
if (new URLSearchParams(window.location.search).get('seed') === '1') {
  seedDemoData()
}
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

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
  const { state } = useTrip()

  return (
    <AnimatePresence mode="wait">
      {!splashDone ? (
        <Splash key="splash" onDone={() => setSplashDone(true)} />
      ) : !state.setupComplete ? (
        <Onboarding key="onboarding" />
      ) : (
        <AppRoutes key="app" />
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <TripProvider>
      <AppShell />
    </TripProvider>
  )
}
