import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../lib/api'
import { signIn } from '../lib/supabase'
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '../lib/useTheme'

export default function Auth() {
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (isLogin) {
        await signIn({ email, password })
      } else {
        await signUp({ email, password })
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-app] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-xl font-semibold text-foreground">Sentinel</span>
          </div>
          <p className="text-muted text-sm">workplace conversation simulator</p>
        </div>

        {/* Card */}
        <div className="rounded-[var(--radius)] border border-[--border-hairline] bg-[--bg-surface] p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="text-muted text-sm mb-6">
            {isLogin
              ? 'Sign in to continue to your dashboard'
              : 'Start practicing high-pressure conversations'}
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-[var(--radius)] bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-muted mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius)] border border-[--border-hairline] bg-[--bg-surface-raised] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[--accent] focus:border-[--accent]"
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 rounded-[var(--radius)] border border-[--border-hairline] bg-[--bg-surface-raised] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[--accent] focus:border-[--accent]"
                  placeholder="••••••••"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-muted mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius)] border border-[--border-hairline] bg-[--bg-surface-raised] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[--accent] focus:border-[--accent]"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-[var(--radius)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isLogin ? 'Signing in…' : 'Creating account…'}</span>
                </>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-accent hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Theme toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={toggle}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
