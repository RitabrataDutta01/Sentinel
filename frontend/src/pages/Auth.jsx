import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signUp } from '../lib/api'
import { signIn } from '../lib/supabase'
import './Auth.css'

const PREVIEW_MSGS = [
  { role:'ai', text:'Walk me through a time you missed a deadline. What happened?', mood:'neutral', moodClass:'mood-neutral', bubbleClass:'bubble-ai' },
  { role:'user', text:'I think I maybe didn\'t communicate well enough with the team...', mood:null },
  { role:'ai', text:'"Maybe" isn\'t good enough. What specifically did you fail to do?', mood:'skeptical', moodClass:'mood-skeptical', bubbleClass:'bubble-skeptical' },
  { role:'user', text:'I owned the failure, ran a retro, and we shipped 3 days later with a new process that cut delays by 40%.', mood:null },
  { role:'ai', text:'That\'s a strong recovery. Tell me — whose idea was the new process?', mood:'impressed', moodClass:'mood-impressed', bubbleClass:'bubble-impressed' },
]

function PreviewCard() {
  const msgsRef = useRef(null)
  const typingRef = useRef(null)
  const moodRef = useRef(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    const msgsEl = msgsRef.current
    const typingEl = typingRef.current
    const moodEl = moodRef.current
    if (!msgsEl || !typingEl || !moodEl) return

    let running = false
    const timers = []

    function sleep(ms) {
      return new Promise((resolve) => {
        const id = setTimeout(resolve, ms)
        timers.push(id)
      })
    }

    async function runPreview() {
      if (running || cancelledRef.current) return
      running = true
      msgsEl.innerHTML = ''

      for (const m of PREVIEW_MSGS) {
        await sleep(m.role === 'ai' ? 700 : 1000)

        if (m.role === 'ai' && m.mood) {
          typingEl.classList.add('show')
          msgsEl.appendChild(typingEl)
          await sleep(1200)
          typingEl.classList.remove('show')
          moodEl.className = 'preview-mood ' + m.moodClass
          moodEl.textContent = m.mood.charAt(0).toUpperCase() + m.mood.slice(1)
        }

        const wrap = document.createElement('div')
        wrap.className = 'preview-msg'
        const isAI = m.role === 'ai'
        wrap.innerHTML = `
          <div class="pmsg-avatar ${isAI ? 'av-ai' : 'av-user'}">${isAI ? 'AI' : 'U'}</div>
          <div class="pmsg-bubble ${isAI ? m.bubbleClass : 'bubble-user'}">${m.text}</div>`
        msgsEl.appendChild(wrap)
        await sleep(30)
        wrap.classList.add('show')
        msgsEl.scrollTop = msgsEl.scrollHeight
      }

      await sleep(3000)
      running = false
      if (!cancelledRef.current) runPreview()
    }

    const startTimer = setTimeout(runPreview, 800)
    timers.push(startTimer)

    return () => {
      cancelledRef.current = true
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="preview-card">
      <div className="preview-titlebar">
        <div className="preview-dots">
          <div className="preview-dot pd-r" />
          <div className="preview-dot pd-y" />
          <div className="preview-dot pd-g" />
        </div>
        <div className="preview-label">behavioral · senior · live</div>
        <div className="preview-mood mood-neutral" ref={moodRef}>Neutral</div>
      </div>
      <div className="preview-messages" ref={msgsRef} />
      <div className="preview-typing" ref={typingRef}>
        <div className="pmsg-avatar av-ai">AI</div>
        <div className="typing-wrap">
          <div className="t-dot" />
          <div className="t-dot" />
          <div className="t-dot" />
        </div>
      </div>
      <div className="stats-strip">
        <div className="stat-item">
          <div className="stat-value">10</div>
          <div className="stat-label">Scenarios</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--mood-red)' }}>5</div>
          <div className="stat-label">Mood States</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: 'var(--mood-green)' }}>∞</div>
          <div className="stat-label">Sessions</div>
        </div>
      </div>
    </div>
  )
}

export default function Auth() {
  const navigate = useNavigate()

  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Login
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPass, setShowLoginPass] = useState(false)

  // Signup
  const [signupFirst, setSignupFirst] = useState('')
  const [signupLast, setSignupLast] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupRole, setSignupRole] = useState('')
  const [showSignupPass, setShowSignupPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    if (!loginEmail || !loginPassword) return
    setLoading(true)
    try {
      await signIn({ email: loginEmail, password: loginPassword })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!signupFirst || !signupLast || !signupEmail || !signupRole) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      await signUp({
        email: signupEmail,
        password: signupPassword,
        first_name: signupFirst,
        last_name: signupLast,
        role: signupRole,
      })
      await signIn({ email: signupEmail, password: signupPassword })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.message || 'Could not create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="view-auth">
      <div className="left-panel">
        <div className="left-glow" />
        <div className="left-glow-2" />

        <div className="left-nav">
          <button className="logo" onClick={() => navigate('/')}>
            <span className="logo-dot" />
            Sentinel
          </button>
          <div className="mode-chip">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
              <circle cx="3" cy="3" r="3" />
            </svg>
            Candidate Mode
          </div>
        </div>

        <div className="left-content">
          <h2 className="left-headline">
            Face the interview<br />that <em>fights back.</em>
          </h2>
          <p className="left-sub">
            An AI interviewer with real emotional state. It reacts to every answer you give.
            Sign in to start your first session.
          </p>
          <PreviewCard />
        </div>

        <div className="left-footer">
          <div className="trust-row">
            <div className="trust-item"><span className="trust-icon">🔒</span> End-to-end encrypted</div>
            <div className="trust-item"><span className="trust-icon">⚡</span> Sessions auto-saved</div>
            <div className="trust-item"><span className="trust-icon">🎯</span> Free to use</div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="right-inner">
          {success ? (
            <div className="success-state show" id="successState">
              <div className="success-icon">✓</div>
              <div className="success-title">You're in.</div>
              <div className="success-sub">
                Setting up your candidate dashboard.<br />Redirecting now...
              </div>
            </div>
          ) : (
            <>
              <div className="auth-tabs">
                <button
                  className={'auth-tab' + (tab === 'login' ? ' active' : '')}
                  onClick={() => setTab('login')}
                >
                  Sign in
                </button>
                <button
                  className={'auth-tab' + (tab === 'signup' ? ' active' : '')}
                  onClick={() => setTab('signup')}
                >
                  Create account
                </button>
              </div>

              {tab === 'login' ? (
                <div className="form-panel active" id="panel-login">
                  <div className="form-header">
                    <div className="form-title">Welcome back.</div>
                    <div className="form-sub">Sign in to continue your practice sessions.</div>
                  </div>

                  <form className="auth-form" onSubmit={handleLogin}>
                    <div className="field-group">
                      <label className="field-label" htmlFor="login-email">Email address</label>
                      <input
                        className="field-input"
                        type="email"
                        id="login-email"
                        placeholder="you@email.com"
                        autoComplete="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="login-password">Password</label>
                      <div className="field-password-wrap">
                        <input
                          className="field-input"
                          type={showLoginPass ? 'text' : 'password'}
                          id="login-password"
                          placeholder="Your password"
                          autoComplete="current-password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          aria-label="Toggle password"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {error && <p className="text-sm text-mood-cold mt-3 text-center">{error}</p>}

                    <button
                      type="submit"
                      className={'btn-submit' + (loading ? ' loading' : '')}
                      id="loginBtn"
                      disabled={loading}
                    >
                      <span className="btn-text">Sign in to Sentinel</span>
                      <div className="btn-spinner" />
                    </button>

                    <div className="switch-note">
                      No account yet?{' '}
                      <button type="button" className="switch-link" onClick={() => setTab('signup')}>
                        Create one free
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="form-panel active" id="panel-signup">
                  <div className="form-header">
                    <div className="form-title">Create your account.</div>
                    <div className="form-sub">Free forever. No card required.</div>
                  </div>

                  <form className="auth-form" onSubmit={handleSignup}>
                    <div className="name-row">
                      <div className="field-group">
                        <label className="field-label" htmlFor="signup-first">First name</label>
                        <input
                          className="field-input"
                          type="text"
                          id="signup-first"
                          placeholder="Aditya"
                          required
                          autoComplete="given-name"
                          value={signupFirst}
                          onChange={(e) => setSignupFirst(e.target.value)}
                        />
                      </div>
                      <div className="field-group">
                        <label className="field-label" htmlFor="signup-last">Last name</label>
                        <input
                          className="field-input"
                          type="text"
                          id="signup-last"
                          placeholder="Singh"
                          required
                          autoComplete="family-name"
                          value={signupLast}
                          onChange={(e) => setSignupLast(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="signup-email">Email address</label>
                      <input
                        className="field-input"
                        type="email"
                        id="signup-email"
                        placeholder="you@email.com"
                        required
                        autoComplete="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="signup-password">Password</label>
                      <div className="field-password-wrap">
                        <input
                          className="field-input"
                          type={showSignupPass ? 'text' : 'password'}
                          id="signup-password"
                          placeholder="Min. 8 characters"
                          required
                          autoComplete="new-password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowSignupPass(!showSignupPass)}
                          aria-label="Toggle password"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3" />
                            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="field-group">
                      <label className="field-label" htmlFor="signup-role">What best describes you?</label>
                      <select
                        className="field-input"
                        id="signup-role"
                        required
                        value={signupRole}
                        onChange={(e) => setSignupRole(e.target.value)}
                        style={{ cursor: 'pointer', appearance: 'none' }}
                      >
                        <option value="" disabled>Select your role</option>
                        <option value="student">Student</option>
                        <option value="fresher">Fresher / Recent graduate</option>
                        <option value="professional">Working professional</option>
                        <option value="job-seeker">Job seeker</option>
                      </select>
                    </div>

                    {error && <p className="text-sm text-mood-cold mt-3 text-center">{error}</p>}

                    <button
                      type="submit"
                      className={'btn-submit' + (loading ? ' loading' : '')}
                      id="signupBtn"
                      disabled={loading}
                    >
                      <span className="btn-text">Create account — free</span>
                      <div className="btn-spinner" />
                    </button>

                    <div className="switch-note">
                      Already have an account?{' '}
                      <button type="button" className="switch-link" onClick={() => setTab('login')}>
                        Sign in
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
