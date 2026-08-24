# Demo Script

**Length:** ~2 minutes

---

### 0:00 — Landing Page
Show the hero section. Explain the problem: "AI interviewers that actually push back."

---

### 0:15 — Auth
Sign in / Sign up flow (email + password via Supabase Auth).

---

### 0:30 — Scenario Selection
Open `/scenarios` and show the scenario library. Pick one, e.g. **Firing an Employee**:
- Toggle **brutal mode** on
- Optionally add context

Start the session. Mention there are 14 scenarios across 6 categories.

---

### 0:45 — Live Interview
Send a few messages (type or use the mic) and demonstrate:
- AI responds with adaptive tone
- Mood badge / ambient bar shifts (Neutral → Skeptical → Impressed)
- Filler word detection
- SSE streaming (responses stream in chunks)

---

### 1:10 — Report Card
End the session → `/report/:sessionId`. Show the generated report:
- Overall score + verdict badge
- Strengths / critical weaknesses
- Skill bars (composure, structure, evidence, empathy, decisiveness)
- Mood timeline
- Executive summary

---

### 1:30 — Candidate Workspace
- **Dashboard** — streak, latest report card, session history
- **Sessions** — full history with mood deltas and verdicts
- **Insights** — mood trend + aggregate skill analytics

*(Optional, if demoing teams)* — **Organisation** (`/people`): create an org, invite a colleague by email, show the pending-invite banner + Accept, and expand a member's row to reveal their sessions and report card.

---

### 1:45 — Export PDF
Download the report as PDF via `/api/v1/export/{session_id}`.

---

### 1:55 — Wrap
Mention: "Built for VibeForge 1.0 — fully functional MVP with 14 scenarios and an adaptive AI mood engine."
