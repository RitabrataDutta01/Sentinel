# Part 01: Project Overview

## Sentinel — AI Workplace Simulator

> **VibeForge 1.0 Hackathon Submission** — An AI-powered workplace simulation platform that prepares users for high-pressure professional conversations through dynamic, adaptive AI interviews.

---

## 🎯 Vision

Sentinel addresses a critical gap in professional preparation: **existing interview tools ask static questions and behave politely regardless of response quality**. Real workplace conversations are dynamic—interviewers become skeptical, interrupt, lose interest, and change tone based on your answers. Sentinel simulates this reality through an adaptive AI interviewer with a dynamic mood engine.

---

## 🔍 Problem Statement

| Current Tools | Real World |
|---------------|------------|
| Static, scripted questions | Dynamic, contextual follow-ups |
| Polite, encouraging tone always | Tone shifts: supportive → skeptical → hostile |
| Generic feedback | Context-aware, specific feedback |
| No psychological pressure | Real pressure, interruptions, mood shifts |

**Impact:** Candidates enter real interviews unprepared for psychological dynamics, leading to poor performance despite technical competence.

---

## 💡 Solution: Adaptive Mood Engine

Sentinel introduces a **dynamic mood engine (1–10 scale)** that drives an adversarial AI interviewer:

```
Mood 1-2    → Hostile        (combative, may interrupt)
Mood 3-4    → Frustrated     (probing, needs more than words)
Mood 5-6    → Guarded        (professional, standard difficulty)
Mood 7-8    → Engaged        (calming, willing to listen)
Mood 9-10   → Impressed      (supportive, relieved)
```

**Key Innovation:** The AI's emotional state shifts *continuously* based on answer quality, scored -2 to +2 per response by a dedicated grading model.

---

## 🎭 Core Flow

### Phase 1: Scenario Selection
- **14 scenarios** across 6 categories
- Difficulty tuning + optional **Brutal Mode** (aggressive interviewer)
- Custom context injection

### Phase 2: Live Simulation
- **Text or voice input** (Whisper transcription)
- **SSE streaming** responses (real-time feel)
- **Mood shifts** per answer (-2 to +2)
- **Filler-word detection** (spaCy)
- **Toxicity flagging** (scikit-learn model)

### Phase 3: Evaluation & Report
- Overall score (0-100)
- Category-specific verdict
- 5 skill bars (composure, structure, evidence, empathy, decisiveness)
- Mood timeline visualization
- Weak-moment rewrites (STAR-style)
- Executive summary
- **PDF export** (WeasyPrint)

---

## 👥 Target Users

| Primary | Secondary |
|---------|-----------|
| Students & fresh graduates | Job seekers & career switchers |
| Professionals preparing for interviews | Corporate training (future) |
| HR professionals (team features) | Corporate L&D (future) |

---

## 🏷️ Scenario Categories (14 Total)

| Category | Scenarios |
|----------|-----------|
| **HR & Interviews** | Firing an Employee, Handling Employee Feedback |
| **Leadership & Management** | Defending Technical Architecture, Pushing Back on Scope Creep, Defending Business Decision |
| **External Stakeholders** | Handling PR Crisis, Negotiating Vendor Contract, Handling Media Interview, Managing Difficult Stakeholder |
| **Team Dynamics** | Mediating Team Dispute, Dealing with Office Politics |
| **Customer Escalations** | Resolving Customer Escalation |
| **Compliance & Ethics** | Managing Security Incident, Handling Regulatory Compliance |

---

## 🏆 Key Differentiators

| Feature | Sentinel | Traditional Tools |
|---------|----------|-------------------|
| **Mood Engine** | ✅ 1-10 dynamic | ❌ Static |
| **Brutal Mode** | ✅ Aggressive AI | ❌ Always polite |
| **Voice Input** | ✅ Whisper + filler detection | ❌ Text only |
| **Mood Timeline** | ✅ Visual mood shifts | ❌ Single score |
| **STAR Rewrites** | ✅ Contextual rewrites | ❌ Generic tips |
| **PDF Export** | ✅ Professional reports | ⚠️ Limited |
| **Team/Org Features** | ✅ Multi-tenant, RLS | ❌ Single-user |

---

## 📊 Project Status

| Metric | Status |
|--------|--------|
| **Core Simulation** | ✅ Complete |
| **Evaluation & Reports** | ✅ Complete |
| **Candidate Workspace** | ✅ Complete |
| **Team/Org Features** | ✅ Complete |
| **Desktop App (Win/Linux)** | ✅ Complete |
| **CI/CD (Win + Linux)** | ✅ Complete |
| **Production Deploy** | ✅ Render |

**Status:** MVP Complete — Ready for VibeForge 1.0 submission