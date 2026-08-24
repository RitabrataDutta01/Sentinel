# Sentinel

> **The AI Workplace Simulator — VibeForge 1.0 Hackathon Submission**

---

## Vision

Sentinel is an AI-powered workplace simulation platform designed to help people prepare for high-pressure professional conversations. Unlike traditional interview preparation tools that ask predefined questions, Sentinel simulates realistic workplace interactions by dynamically adapting its behavior based on the user's responses.

---

## Problem

Most interview preparation platforms fail to recreate the psychological aspects of professional conversations. Existing tools generally ask static questions, provide generic feedback, and behave politely regardless of response quality. Real interviews are different — interviewers become skeptical, interrupt, lose interest, and change their tone. Sentinel focuses on simulating these interactions.

---

## Solution

Sentinel introduces an adaptive AI interviewer powered by a dynamic mood engine. Rather than following a scripted conversation, the AI continuously evaluates user responses and adjusts its emotional state throughout the interview. The AI can become professional, supportive, skeptical, challenging, cold, or encouraging, creating an experience that feels closer to real-world conversations.

---

## Core Flow

Every session consists of three phases:

1. **Scenario selection** — The user picks from 14 scenarios (Firing an Employee, Handling a PR Crisis, Defending a Technical Architecture, etc.), tunes the difficulty, and optionally enables **brutal mode** for an aggressive interviewer.
2. **Simulation** — The AI interviewer runs the session with dynamic mood shifts (1–10 scale) based on answer quality. Text or voice input, streaming responses, filler-word detection, and toxicity flagging.
3. **Evaluation** — After the interview, Sentinel generates a detailed report with overall score, verdict, strengths/weaknesses, skill bars, weak-moment rewrites, mood timeline, and executive summary. PDF export available.

After a session, the **candidate workspace** surfaces everything in one place:

- **Dashboard** — sign-in streak, latest report card, recent session history, and any pending org invitations
- **Sessions** — full history with per-session mood deltas and verdicts
- **Insights** — aggregate mood trend, average skill scores, recurring strengths/weaknesses

For teams, the **Organisation** page (route `/people`) provides a multi-tenant workspace:

- Create an organization — the creator becomes its `admin`; the org's UUID doubles as the join invite code
- Invite colleagues by email (`admin`/`hr`/`member` roles) — an SMTP email is sent when configured, and the invitee always sees pending invitations on their dashboard with an **Accept** button
- Roster + role management, and — for active `admin`/`hr` members — expandable rows that reveal each teammate's sessions and report cards (scoped by Row Level Security)

---

## Pages

| Route | Page |
|-------|------|
| `/` | Landing |
| `/auth` | Sign in / create account (email + password) |
| `/scenarios` | Scenario library + session setup |
| `/interview/:sessionId` | Live AI interview |
| `/report/:sessionId` | Report card + PDF export |
| `/dashboard` | Candidate dashboard |
| `/sessions` | Session history |
| `/insights` | Aggregate analytics |
| `/people` | **Organisation** workspace (roster, roles, invites, member sessions) |
| `/settings` | Profile + defaults |

(`/setup` redirects to `/scenarios` for backward compatibility.)

---

## Target Users

- Students and fresh graduates
- Job seekers and career switchers
- Professionals preparing for interviews
- Corporate training (future)

---

## Technology

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand, React Query, Recharts, shadcn-style components |
| Backend | Flask (Python), Groq SDK (Llama 3.3-70B), Whisper (audio transcription), spaCy, scikit-learn (toxicity model), smtplib (invite email) |
| Database | PostgreSQL via Supabase with Row Level Security |
| PDF | WeasyPrint |
| Auth | Supabase Auth (email + password, JWT) |

---

## Project Status

**MVP — Complete.** Core simulation, evaluation, analytics, and candidate workspace features are implemented. The project was developed for VibeForge 1.0 Hackathon.
