import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from './components/ui/sonner'
import { supabase } from './lib/supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import ErrorBoundary from './components/ErrorBoundary'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Sessions = lazy(() => import('./pages/Sessions'))
const Insights = lazy(() => import('./pages/Insights'))
const Scenarios = lazy(() => import('./pages/Scenarios'))
const Settings = lazy(() => import('./pages/Settings'))
const People = lazy(() => import('./pages/People'))
const Interview = lazy(() => import('./pages/Interview'))
const Report = lazy(() => import('./pages/Report'))

const queryClient = new QueryClient()

const PROTECTED_ROUTES = [
  '/dashboard',
  '/setup',
  '/sessions',
  '/insights',
  '/scenarios',
  '/settings',
  '/people',
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
      <div className="flex items-center justify-center h-screen bg-[#0b0b10]">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const needsAuth = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))
  if (needsAuth && !user) return <Navigate to="/auth" replace />
  if (user && location.pathname === '/auth') return <Navigate to="/dashboard" replace />

  const shouldAnimate = PROTECTED_ROUTES.some((p) => location.pathname.startsWith(p))

  const page = (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Routes location={location}>
      <Route path="/" element={<Landing user={user} />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ErrorBoundary fallbackMessage="Failed to load dashboard. Please try again."><Dashboard /></ErrorBoundary>} />
      <Route path="/setup" element={<Navigate to="/scenarios" replace />} />
      <Route path="/sessions" element={<ErrorBoundary fallbackMessage="Failed to load sessions. Please try again."><Sessions /></ErrorBoundary>} />
      <Route path="/insights" element={<ErrorBoundary fallbackMessage="Failed to load insights. Please try again."><Insights /></ErrorBoundary>} />
      <Route path="/scenarios" element={<ErrorBoundary fallbackMessage="Failed to load scenarios. Please try again."><Scenarios /></ErrorBoundary>} />
      <Route path="/settings" element={<ErrorBoundary fallbackMessage="Failed to load settings. Please try again."><Settings /></ErrorBoundary>} />
      <Route path="/people" element={<ErrorBoundary fallbackMessage="Failed to load people. Please try again."><People /></ErrorBoundary>} />
      <Route path="/interview/:sessionId" element={<ErrorBoundary fallbackMessage="Failed to load interview. Please try again."><Interview /></ErrorBoundary>} />
      <Route path="/report/:sessionId" element={<ErrorBoundary fallbackMessage="Failed to load report. Please try again."><Report /></ErrorBoundary>} />
      </Routes>
    </Suspense>
  )

  if (!shouldAnimate) return page

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        {page}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  )
}
