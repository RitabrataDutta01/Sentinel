import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'sonner'
import { supabase } from './lib/supabase'
import { useTheme } from './lib/useTheme'
import Auth from './pages/Auth'
import ErrorBoundary from './components/ErrorBoundary'
import DesktopAppShell from './components/layout/DesktopAppShell'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Insights = lazy(() => import('./pages/Insights'))
const Scenarios = lazy(() => import('./pages/Scenarios'))
const Settings = lazy(() => import('./pages/Settings'))
const People = lazy(() => import('./pages/People'))
const Reports = lazy(() => import('./pages/Reports'))
const Interview = lazy(() => import('./pages/Interview'))
const Report = lazy(() => import('./pages/Report'))

const PROTECTED_ROUTES = [
  '/dashboard',
  '/setup',
  '/sessions',
  '/insights',
  '/scenarios',
  '/settings',
  '/people',
  '/reports',
  '/interview',
  '/report',
]

function AnimatedRoutes() {
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Root route: redirect based on auth state
  if (location.pathname === '/') {
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
  }

  const needsAuth = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))
  if (needsAuth && !user) return <Navigate to="/auth" replace />
  if (user && location.pathname === '/auth') return <Navigate to="/dashboard" replace />

  const shouldAnimate = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))

  // Auth page uses no shell (just centered card), everything else uses DesktopAppShell
  const isAuthPage = location.pathname === '/auth'
  const ShellLayout = isAuthPage ? null : DesktopAppShell

  const page = (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Routes location={location}>
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again."><Dashboard /></ErrorBoundary>} />
        <Route path="/setup" element={<Navigate to="/scenarios" replace />} />
        <Route path="/sessions" element={<ErrorBoundary fallbackMessage="Failed to load sessions. Please try again."><Sessions /></ErrorBoundary>} />
        <Route path="/insights" element={<ErrorBoundary fallbackMessage="Failed to load insights. Please try again."><Insights /></ErrorBoundary>} />
        <Route path="/scenarios" element={<ErrorBoundary fallbackMessage="Failed to load scenarios. Please try again."><Scenarios /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary fallbackMessage="Failed to load settings. Please try again."><Settings /></ErrorBoundary>} />
        <Route path="/people" element={<ErrorBoundary fallbackMessage="Failed to load people. Please try again." showDetails><People /></ErrorBoundary>} />
        <Route path="/reports" element={<ErrorBoundary fallbackMessage="Failed to load reports. Please try again."><Reports /></ErrorBoundary>} />
        <Route path="/interview/:sessionId" element={<ErrorBoundary fallbackMessage="Failed to load interview. Please try again."><Interview /></ErrorBoundary>} />
        <Route path="/interview" element={<Navigate to="/scenarios" replace />} />
        <Route path="/report/:sessionId" element={<ErrorBoundary fallbackMessage="Failed to load report. Please try again."><Report /></ErrorBoundary>} />
        {/* Catch-all: redirect unknown paths */}
        <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
      </Routes>
    </Suspense>
  )

  if (!shouldAnimate) {
    return ShellLayout ? <ShellLayout>{page}</ShellLayout> : page
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {ShellLayout ? <ShellLayout>{page}</ShellLayout> : page}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { theme } = useTheme()

  return (
    <>
      <Toaster position="top-right" theme={theme} richColors />
      <AnimatedRoutes />
    </>
  )
}
