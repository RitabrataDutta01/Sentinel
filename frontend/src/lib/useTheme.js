import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY = 'sentinel-theme'
const TRANSITION_MS = 400

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export function useTheme() {
  const [theme, _setTheme] = useState(getInitialTheme)
  const transitioningRef = useRef(false)

  // Apply theme to <html> on mount and change
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next) => {
    const root = document.documentElement

    // Resolve the new value (handle function updater)
    const newTheme = typeof next === 'function' ? next(theme) : next
    if (newTheme === theme) return

    // Add transition class (only once per switch)
    if (!transitioningRef.current) {
      transitioningRef.current = true
      root.classList.add('theme-transitioning')
    }

    _setTheme(newTheme)

    // Remove transition class after animation
    clearTimeout(window.__sentinelThemeTimer)
    window.__sentinelThemeTimer = setTimeout(() => {
      root.classList.remove('theme-transitioning')
      transitioningRef.current = false
    }, TRANSITION_MS)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [setTheme])

  return { theme, setTheme, toggle }
}
