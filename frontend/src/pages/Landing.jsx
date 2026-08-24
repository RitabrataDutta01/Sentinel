import { useEffect, useRef, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import './Landing.css'

function getMarkup(user) {
  const initial = user?.email?.[0]?.toUpperCase() || 'U'

  const ctaHtml = user
    ? `<a href="#" class="nav-pfp" title="Menu">
         <span>${initial}</span>
       </a>`
    : `<a href="#" class="btn-ghost" data-route="/auth">Sign in</a>
       <a href="#" class="btn-primary" data-route="/auth">
         Start practicing
         <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </a>`

  const heroRoute = user ? '/dashboard' : '/auth'
  const heroLabel = user ? 'Go to dashboard' : 'Start a free session'
  const ctaRoute = user ? '/dashboard' : '/auth'
  const ctaLabel = user ? 'Go to dashboard' : 'Start your first session — free'

  return `<!-- ── NAV ── -->
<nav>
  <a href="#" class="nav-logo">
    <span class="nav-logo-dot"></span>
    Sentinel
  </a>
  <ul class="nav-links">
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#mood-engine">Mood Engine</a></li>
  </ul>
  <div class="nav-cta">
    ${ctaHtml}
  </div>
</nav>

<!-- ── HERO ── -->
<section class="hero">
  <div class="hero-glow"></div>
  <div class="hero-glow-2"></div>

  <div class="hero-badge">
    <span class="hero-badge-dot"></span>
    AI Interview Simulator · Mood Engine Active
  </div>

  <!-- SIMULATION WINDOW -->
  <div class="sim-window" id="simWindow">
    <div class="sim-titlebar">
      <div class="sim-dots">
        <div class="sim-dot sim-dot-r"></div>
        <div class="sim-dot sim-dot-y"></div>
        <div class="sim-dot sim-dot-g"></div>
      </div>
      <div class="sim-title">sentinel://interview · behavioral · senior</div>
      <div class="sim-mood-badge neutral" id="moodBadge">Neutral</div>
    </div>

    <div class="sim-body" id="simBody">
      <!-- Messages injected by JS -->
    </div>

    <div class="sim-footer">
      <div class="sim-input" id="simInputDisplay">Type your response...</div>
      <div class="sim-send">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7.5 3l4.5 4-4.5 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
  </div>

  <!-- HERO TEXT -->
  <div class="hero-text">
    <h1 class="hero-headline">
      The interview sim<br/>that <em>actually fights back.</em>
    </h1>
    <p class="hero-sub">
      Most tools prepare you for polite questions. Sentinel prepares you for the real thing — an interviewer that reacts, challenges, and judges every answer you give.
    </p>
    <div class="hero-actions">
      <a href="#" class="btn-primary btn-large" data-route="${heroRoute}">
        ${heroLabel}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="#how-it-works" class="btn-outline">See how it works</a>
    </div>
    <p class="hero-trust">Free to use · No card required · 10 interview types</p>
  </div>
</section>

<hr class="section-divider" />

<!-- ── HOW IT WORKS ── -->
<section id="how-it-works">
  <div class="section">
      <p class="section-label reveal visible">Process</p>
    <h2 class="section-title reveal visible">From setup to debrief<br/>in under 30 minutes.</h2>
    <p class="section-sub reveal visible">Pick your role, choose your pressure level, and walk into the hardest interview you've ever had.</p>

    <div class="steps-grid reveal visible">
      <div class="step-card">
        <div class="step-number">01</div>
        <div class="step-icon">🎯</div>
        <div class="step-title">Configure your scenario</div>
        <div class="step-desc">Pick your role, interview type, style archetype, and difficulty. Each combination changes how the AI behaves and what it challenges you on — from startup casual to consulting high-pressure.</div>
      </div>
      <div class="step-card">
        <div class="step-number">02</div>
        <div class="step-icon">🤖</div>
        <div class="step-title">Face the live interview</div>
        <div class="step-desc">Sentinel's AI interviewer has a hidden emotional state (1–10) that shifts with every answer. Vague answers frustrate it. Strong answers win it over. You'll feel the difference in tone, vocabulary, and resistance.</div>
      </div>
      <div class="step-card">
        <div class="step-number">03</div>
        <div class="step-icon">📊</div>
        <div class="step-title">Review the debrief</div>
        <div class="step-desc">Every session ends with a full report — overall score, STAR breakdown, filler analysis, mood timeline, and ideal rewrites for every weak answer. See exactly where you lost them.</div>
      </div>
      <div class="step-card">
        <div class="step-number">04</div>
        <div class="step-icon">📈</div>
        <div class="step-title">Track your progress</div>
        <div class="step-desc">All sessions are saved to your dashboard. Watch your scores trend up, your language patterns sharpen, and your confidence grow over time.</div>
      </div>
    </div>
  </div>
</section>

<hr class="section-divider" />

<!-- ── MOOD ENGINE ── -->
<div class="mood-section" id="mood-engine">
  <div class="mood-inner">
    <div>
      <p class="section-label reveal visible">Mood Engine</p>
      <h2 class="section-title reveal visible">The interviewer has<br/>feelings. Use that.</h2>
      <p class="section-sub reveal visible">Every answer you give is scored from <strong>-2</strong> (escalates conflict) to <strong>+2</strong> (masterful de-escalation). These scores accumulate silently, shifting the interviewer's internal state from Neutral through Skeptical toward Hostile — or Impressed. You won't see a label — you'll feel the difference in how they respond.</p>

      <div class="mood-states reveal visible">
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#56CF8A;box-shadow:0 0 8px #56CF8A"></div>
          <div class="mood-state-label">Impressed</div>
          <div class="mood-state-desc">Warm tone. Soft follow-ups. You're in control. Score 8–10.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row active">
          <div class="mood-indicator-dot" style="background:#CF9E56;box-shadow:0 0 8px #CF9E56"></div>
          <div class="mood-state-label">Neutral</div>
          <div class="mood-state-desc">Professional. Standard difficulty. Starting point. Score 5.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#CF7856;box-shadow:0 0 8px #CF7856"></div>
          <div class="mood-state-label">Skeptical</div>
          <div class="mood-state-desc">Probing questions. Needs more than your word. Score 3–4.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#A04040;box-shadow:0 0 8px #A04040"></div>
          <div class="mood-state-label">Losing Interest</div>
          <div class="mood-state-desc">Blunt. Short. They're mentally moving on. Score 2.</div>
          <div class="mood-arrow">→</div>
        </div>
        <div class="mood-state-row">
          <div class="mood-indicator-dot" style="background:#CF5656;box-shadow:0 0 8px #CF5656"></div>
          <div class="mood-state-label">Hostile</div>
          <div class="mood-state-desc">Combative. May interrupt. Recover if you can. Score 1.</div>
          <div class="mood-arrow">→</div>
        </div>
      </div>
    </div>

    <div class="reveal visible">
      <p class="section-label">Interview Types</p>
      <h3 style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:var(--text-primary);margin-bottom:8px;margin-top:12px;">10 scenarios.<br/>Every situation covered.</h3>
      <p style="font-size:14px;color:var(--text-muted);margin-bottom:0;line-height:1.7;">From your first HR call to the toughest performance review of your career.</p>
      <div class="types-grid">
        <div class="type-chip"><span class="type-chip-icon">🧑‍💼</span> HR Interview</div>
        <div class="type-chip"><span class="type-chip-icon">💻</span> Technical</div>
        <div class="type-chip"><span class="type-chip-icon">🧠</span> Behavioural</div>
        <div class="type-chip"><span class="type-chip-icon">📋</span> Performance Review</div>
        <div class="type-chip"><span class="type-chip-icon">💰</span> Salary Negotiation</div>
        <div class="type-chip"><span class="type-chip-icon">🚀</span> Promotion Talk</div>
        <div class="type-chip"><span class="type-chip-icon">😤</span> Difficult Manager</div>
        <div class="type-chip"><span class="type-chip-icon">🤝</span> Team Conflict</div>
        <div class="type-chip"><span class="type-chip-icon">📞</span> Client Meeting</div>
        <div class="type-chip"><span class="type-chip-icon">🚪</span> Exit Interview</div>
      </div>
    </div>
  </div>
</div>

<!-- ── CTA ── -->
<section class="cta-section">
  <div class="cta-glow"></div>
  <h2>Ready to be<br/><em style="font-style:normal;background:linear-gradient(135deg,var(--accent),#A891FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">actually challenged?</em></h2>
  <p>Stop practicing with tools that go easy on you.<br/>Start preparing for the interview that actually matters.</p>
  <div class="hero-actions">
    <a href="#" class="btn-primary btn-large" data-route="${ctaRoute}">
      ${ctaLabel}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7.5 4l3.5 3-3.5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a>
  </div>
</section>

<!-- ── FOOTER ── -->
<footer>
  <div class="footer-logo">
    <span style="width:7px;height:7px;border-radius:50%;background:var(--accent);display:inline-block"></span>
    Sentinel
  </div>
  <div class="footer-copy">Built for VibeForge 1.0 · VYOMIQ</div>
  <div class="footer-links">
    <a href="#">Privacy</a>
    <a href="#">GitHub</a>
    <a href="#">Contact</a>
  </div>
</footer>`
}

/**
 * Ported from the original static prototype. Markup/CSS/animations are
 * kept as-is (via innerHTML) rather than fully rewritten as JSX, since
 * the design is hand-tuned CSS/SVG that isn't worth re-authoring by hand
 * right now — this can be broken into smaller components incrementally.
 */
export default function Landing({ user = null }) {
  const rootRef = useRef(null)
  const navigate = useNavigate()
  const markup = useMemo(() => getMarkup(user), [user?.id])
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e) {
      if (!e.target.closest('.nav-pfp') && !e.target.closest('.user-menu-dropdown')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [menuOpen])

  // Delegated click handling for nav + PFP menu toggle
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    function onClick(e) {
      const link = e.target.closest('[data-route]')
      if (link) {
        e.preventDefault()
        setMenuOpen(false)
        navigate(link.getAttribute('data-route'))
        return
      }
      const pfp = e.target.closest('.nav-pfp')
      if (pfp) {
        e.preventDefault()
        setMenuOpen(v => !v)
      }
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [navigate])

  // Original hero conversation animation + scroll reveals
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let cancelled = false
    const timers = []
    function trackedSleep(ms) {
      return new Promise((resolve) => {
        const id = setTimeout(resolve, ms)
        timers.push(id)
      })
    }


// ── SIMULATION CONVERSATION ──
const conversation = [
  {
    role: 'ai',
    mood: 'neutral',
    moodLabel: 'Neutral',
    text: "Tell me about a time you had to deal with a conflict inside your team. Walk me through it.",
    delay: 800
  },
  {
    role: 'user',
    text: "Um, yeah so there was this situation where I think maybe there was like a disagreement with a teammate about the code architecture? We kind of sorted it out eventually.",
    delay: 2200
  },
  {
    role: 'ai',
    mood: 'skeptical',
    moodLabel: 'Skeptical',
    text: "\"Eventually\" isn't very specific. What exactly did you do to resolve it, and what was the actual outcome?",
    delay: 1800
  },
  {
    role: 'user',
    text: "I led a structured design review where I documented both approaches with tradeoffs. We aligned on a microservices split that cut deployment time by 35% over the next quarter.",
    delay: 2400
  },
  {
    role: 'ai',
    mood: 'impressed',
    moodLabel: 'Impressed',
    text: "That's much more compelling. A 35% improvement is a real result. Tell me — whose idea was the microservices approach originally?",
    delay: 1600
  }
];

const simBody = root.querySelector('#simBody');
const moodBadge = root.querySelector('#moodBadge');
let currentIndex = 0;
let isRunning = false;

function createTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'sim-typing';
  wrap.id = 'typingIndicator';
  wrap.innerHTML = `
    <div class="sim-avatar avatar-ai">AI</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  return wrap;
}

function createMessage(turn) {
  const wrap = document.createElement('div');
  wrap.className = 'sim-msg';

  const isAI = turn.role === 'ai';
  const bubbleClass = isAI
    ? (turn.mood === 'skeptical' ? 'skeptical-bubble' : turn.mood === 'impressed' ? 'impressed-bubble' : 'ai-bubble')
    : '';

  wrap.innerHTML = `
    <div class="sim-avatar ${isAI ? 'avatar-ai' : 'avatar-user'}">${isAI ? 'AI' : 'You'}</div>
    <div class="sim-bubble ${bubbleClass}">${turn.text}</div>`;
  return wrap;
}

function updateMood(mood, label) {
  moodBadge.className = `sim-mood-badge ${mood}`;
  moodBadge.textContent = label;
}

const sleep = trackedSleep;

async function playConversation() {
  if (isRunning || cancelled) return;
  isRunning = true;
  simBody.innerHTML = '';

  for (let i = 0; i < conversation.length; i++) {
    const turn = conversation[i];
    await sleep(turn.delay);

    if (turn.role === 'ai') {
      // show typing
      const typing = createTypingIndicator();
      simBody.appendChild(typing);
      simBody.scrollTop = simBody.scrollHeight;
      await sleep(10);
      typing.classList.add('visible');
      await sleep(1400);

      // update mood before showing message
      if (turn.mood) updateMood(turn.mood, turn.moodLabel);

      typing.remove();
    }

    const msg = createMessage(turn);
    simBody.appendChild(msg);
    simBody.scrollTop = simBody.scrollHeight;
    await sleep(30);
    msg.classList.add('visible');
  }

  // loop after pause
  await sleep(3500);
  isRunning = false;
  playConversation();
}

// ── INTERSECTION OBSERVER FOR REVEALS ──
const reveals = root.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observer.observe(el));

// ── START ──
const startTimer = setTimeout(playConversation, 600);
    timers.push(startTimer);


    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div className="view-landing" ref={rootRef} dangerouslySetInnerHTML={{ __html: markup }} />
      {menuOpen && (
        <div className="user-menu-dropdown">
          <button onClick={() => { setMenuOpen(false); navigate('/dashboard'); }}>
            Dashboard
          </button>
          <button onClick={async () => { setMenuOpen(false); await signOut(); navigate('/'); }}>
            Sign out
          </button>
        </div>
      )}
    </>
  )
}
