import { useCallback, useEffect, useState } from 'react'
import { getMyOrg, fetchPendingInvites } from './api'

// Module-level cache shared by every useOrg() consumer (AppShell nav gating,
// People page, Settings). Multiple mounted instances stay in sync.
let cache = { org: null, membership: null, pendingInvites: [], loading: true }
const listeners = new Set()
let inflight = null

function emit() {
  for (const listener of listeners) listener(cache)
}

function setCache(next) {
  cache = { ...cache, ...next }
  emit()
}

async function loadOrg() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      // Fetch both independently so a pending-invites failure doesn't lose org data
      const [orgResult, invitesResult] = await Promise.allSettled([
        getMyOrg(),
        fetchPendingInvites(),
      ])

      const orgData = orgResult.status === 'fulfilled' ? orgResult.value : null
      const invites = invitesResult.status === 'fulfilled' ? invitesResult.value : []

      setCache({
        org: orgData?.org ?? null,
        membership: orgData?.membership ?? null,
        pendingInvites: invites ?? [],
        loading: false,
      })
    } catch {
      setCache({ org: null, membership: null, pendingInvites: [], loading: false })
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useOrg() {
  const [state, setState] = useState(cache)

  useEffect(() => {
    const listener = (s) => setState({ ...s })
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  useEffect(() => {
    loadOrg()
  }, [])

  const reload = useCallback(() => {
    cache = { org: null, membership: null, pendingInvites: [], loading: true }
    emit()
    loadOrg()
  }, [])

  const systemRole = state.membership?.system_role
  const isStaff = ['admin', 'hr'].includes(systemRole)
  const isAdmin = systemRole === 'admin'

  return { ...state, isStaff, isAdmin, reload }
}
