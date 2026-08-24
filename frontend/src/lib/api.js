import axios from 'axios'
import { getToken } from './supabase'

// Backend base URL (includes /api/v1)
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || ''

export const api = axios.create({ baseURL: BASE_URL })

// Attach the Supabase JWT to every request automatically.
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Backend error shapes: { status:"error", message, type } or { error }
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const payload = err.response?.data
    const message = payload?.message || payload?.error || err.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

/* ── Simulation lifecycle ─────────────────────────────────────── */

/**
 * POST /start
 * payload: { scenario, personality, context, brutal }
 * returns: session record (must include session_id)
 */
export async function startSession(payload) {
  const { data } = await api.post('/api/v1/start', payload)
  return data
}

/**
 * POST /chat — SSE stream.
 *
 * Backend format:
 *   data: {"type":"chunk","text":"..."}
 *   data: {"type":"metadata","full_text":"...","filler_analysis":{},"new_mood":5}
 */
export async function streamChat(payload, { onToken, onMood, onTerminate, signal }) {
  const token = await getToken()

  const res = await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  })

  if (!res.ok || !res.body) {
    const errBody = await res.json().catch(() => null)
    if (errBody?.type === 'session_terminated') {
      throw Object.assign(new Error(errBody?.error || 'Session terminated'), { terminated: true, reason: errBody?.error })
    }
    throw new Error(errBody?.message || `Chat request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const frames = buffer.split('\n\n')
    buffer = frames.pop()

    for (const frame of frames) {
      const line = frame.trim()

      if (!line.startsWith('data:')) continue

      const jsonStr = line.slice(5).trim()

      if (!jsonStr || jsonStr === '[DONE]') continue

      try {
        const parsed = JSON.parse(jsonStr)

        if (parsed.type === 'metadata') {
          onMood?.(parsed)
        } else if (parsed.type === 'chunk') {
          onToken?.(parsed.text ?? '')
        } else if (parsed.type === 'session_terminated') {
          onTerminate?.(parsed.reason || 'Session terminated by AI')
          return
        }
      } catch {
        onToken?.(jsonStr)
      }
    }
  }
}

/**
 * POST /chat/audio — multipart/form-data
 */
export async function sendAudioTurn({ audioFile, sessionId }) {
  const form = new FormData()

  form.append('audio', audioFile)
  form.append('session_id', sessionId)

  const { data } = await api.post('/api/v1/chat/audio', form)

  return data
}

/* ── Evaluation & export ──────────────────────────────────────── */

export async function evaluateSession(sessionId, durationSec) {
  const { data } = await api.post('/api/v1/evaluate', {
    session_id: sessionId,
    duration_sec: durationSec,
  })

  return data
}

export async function exportReportPdf(sessionId) {
  const res = await api.get(`/api/v1/export/${sessionId}`, {
    responseType: 'blob',
  })

  return res.data
}

/* ── Scenario library ───────────────────────────────────────────── */

export async function getScenarios() {
  const { data } = await api.get('/api/v1/scenarios')
  return data.scenarios ?? []
}

/* ── Dashboard ─────────────────────────────────────────────────── */

export { fetchSessions, getProfile, saveProfile, aggregateAnalytics } from './supabase'

/* ── Auth ──────────────────────────────────────────────────────── */

/**
 * POST /auth/signup
 * Backend creates the auth user (via Supabase service role) AND the
 * profiles row. After this succeeds, call signIn (from supabase.js)
 * to set the client-side session.
 */
export async function signUp({ email, password, first_name, last_name, role }) {
  const { data } = await api.post('/api/v1/auth/signup', {
    email,
    password,
    first_name,
    last_name,
    role,
  })
  return data
}

/* ── Monitoring ────────────────────────────────────────────────── */

export async function checkHealth() {
  const { data } = await api.get('/api/v1/health')
  return data
}

/* ── Organizations ─────────────────────────────────────────────── */

/**
 * GET /orgs/me → { org, membership } (both null when no org).
 */
export async function getMyOrg() {
  const { data } = await api.get('/api/v1/orgs/me')
  return data
}

export async function fetchPendingInvites() {
  const { data } = await api.get('/api/v1/orgs/pending')
  return data.invites ?? []
}

export async function createOrg(name) {
  const { data } = await api.post('/api/v1/orgs', { name })
  return data
}

export async function joinOrg(orgId) {
  const { data } = await api.post(`/api/v1/orgs/${orgId}/join`)
  return data
}

export async function inviteMember(orgId, email, systemRole) {
  const { data } = await api.post(`/api/v1/orgs/${orgId}/invite`, {
    email,
    system_role: systemRole,
  })
  return data
}

export async function fetchMembers(orgId) {
  const { data } = await api.get(`/api/v1/orgs/${orgId}/members`)
  return data.members ?? []
}

export async function updateMember(orgId, userId, changes) {
  const { data } = await api.patch(`/api/v1/orgs/${orgId}/members/${userId}`, changes)
  return data
}

export async function removeMember(orgId, userId) {
  const { data } = await api.delete(`/api/v1/orgs/${orgId}/members/${userId}`)
  return data
}
