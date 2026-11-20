# Part 04: API Specification

## Overview

| Property | Value |
|----------|-------|
| **Base URL** | `/api/v1` |
| **Auth** | `Authorization: Bearer <JWT>` (Supabase JWT) |
| **Content-Type** | `application/json` (except audio) |
| **Swagger** | `GET /apidocs/` |
| **Health** | `GET /api/v1/health` |

---

## 🔐 Authentication

### POST `/auth/signup`
Register new user. Creates auth user + profiles row.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role": "student"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user_id": "uuid"
}
```

---

### POST `/auth/login`
Authenticate existing user. (Frontend uses Supabase directly; this is API convenience.)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "access_token": "jwt-token",
  "user_id": "uuid"
}
```

---

### POST `/auth/oauth/profile`
Backfill profile for OAuth users (idempotent).

**Request:**
```json
{
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role": "student"
}
```

**Response (200):**
```json
{
  "message": "Profile ready",
  "profile": { "id": "uuid", "first_name": "Ada", "last_name": "Lovelace", "role": "student" }
}
```

---

## 🎭 Scenarios

### GET `/scenarios`
Returns full scenario library from `prompts.json`.

**Response (200):**
```json
{
  "scenarios": [
    { "key": "Firing an Employee", "label": "Firing an Employee", "category": "HR_and_Interviews" },
    { "key": "Defending a Technical Architecture", "label": "Defending a Technical Architecture", "category": "Leadership_and_Management" }
    // ... 12 more
  ]
}
```

---

## 🏢 Organizations

### POST `/orgs`
Create organization. Caller becomes admin.

**Request:**
```json
{ "name": "Acme Corp" }
```

**Response (201):**
```json
{
  "org": { "id": "uuid", "name": "Acme Corp", "settings": {}, "created_at": "..." },
  "membership": { "user_id": "uuid", "org_id": "uuid", "system_role": "admin", "status": "active" }
}
```

---

### GET `/orgs/me`
Current user's active membership + org.

**Response (200):**
```json
{
  "org": { "id": "uuid", "name": "Acme Corp", "settings": {}, "created_at": "..." },
  "membership": { "user_id": "uuid", "org_id": "uuid", "system_role": "hr", "status": "active" }
}
```

---

### GET `/orgs/pending`
Pending invitations for current user.

**Response (200):**
```json
{
  "invites": [
    {
      "org": { "id": "uuid", "name": "Acme Corp", "settings": {}, "created_at": "..." },
      "membership": { "user_id": "uuid", "org_id": "uuid", "system_role": "member", "status": "invited" }
    }
  ]
}
```

---

### POST `/orgs/{org_id}/join`
Join org by invite code (org_id). Activates invited membership or creates member.

**Response (200):** Same as `GET /orgs/me`

---

### POST `/orgs/{org_id}/invite` (Admin only)
Invite user by email. Sends email if SMTP configured; else in-app only.

**Request:**
```json
{
  "email": "colleague@company.com",
  "system_role": "member"
}
```

**Response (200):**
```json
{ "message": "Invite sent" }
```

**Errors:**
- `403` - Not admin
- `404` - Email not found (user must sign up first)

---

### GET `/orgs/{org_id}/members` (Active member)
List org roster with profile data.

**Response (200):**
```json
{
  "members": [
    { "id": "uuid", "org_id": "uuid", "user_id": "uuid", "system_role": "admin", "status": "active", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@company.com" }
  ]
}
```

---

### PATCH `/orgs/{org_id}/members/{user_id}` (Admin only)
Update member role/status.

**Request:**
```json
{ "system_role": "hr", "status": "active" }
```

**Response (200):**
```json
{ "message": "Member updated", "member": {...} }
```

---

### DELETE `/orgs/{org_id}/members/{user_id}` (Admin only)
Remove member. Cannot remove self.

**Response (200):**
```json
{ "message": "Member removed" }
```

---

## 🎭 Sessions

### POST `/start`
Initialize new simulation session.

**Request (Current):**
```json
{
  "scenario": "Firing an Employee",
  "personality": "Underperforming employee",
  "context": "You are the manager delivering the termination.",
  "brutal": false
}
```

**Request (Legacy):**
```json
{
  "role": "Senior Software Engineer",
  "interview_type": "Behavioral",
  "style_archetype": "corporate",
  "difficulty": "Senior"
}
```

**Response (201):**
```json
{
  "status": "Success",
  "session_id": "uuid",
  "message": "Simulation initialized. Ready for first prompt"
}
```

---

### POST `/chat` — SSE Stream
Send message in active session. Returns Server-Sent Events.

**Request:**
```json
{
  "session_id": "uuid",
  "message": "Your response here"
}
```

**SSE Stream:**
```
data: {"type":"chunk","text":"*(Thinking...)*"}

data: {"type":"chunk","text":"I understand your position,"}

data: {"type":"metadata","full_text":"I understand your position, but...","filler_analysis":{"details":{"like":1},"total_increment":1},"new_mood":4}
```

**Event Types:**
| Type | Description |
|------|-------------|
| `chunk` | Streaming text token |
| `metadata` | Final: full text, filler analysis, new mood |

---

### POST `/chat/audio` — Audio Turn
Send audio (WebM) for transcription + response.

**Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| `audio` | file | WebM audio |
| `session_id` | string | Active session UUID |

**Response (200):**
```json
{
  "user_transcript": "transcribed text",
  "response": "AI response text",
  "current_turn_fillers": {"like": 1},
  "total_new_fillers": 1,
  "current_mood": 4,
  "toxicity_score": 0.15,
  "is_toxic": false
}
```

---

## 📊 Evaluation

### POST `/evaluate`
Generate performance report. Requires ownership or org staff access.

**Request:**
```json
{
  "session_id": "uuid",
  "duration_sec": 312
}
```

**Response (200):**
```json
{
  "overall_score": 72,
  "confidence_score": 64,
  "verdict": "LEANING NO HIRE",
  "strengths": ["Took ownership", "Clear communication"],
  "critical_weaknesses": ["Avoided direct accountability"],
  "weak_moments": [
    {
      "turn_index": 4,
      "user_answer": "...",
      "issue": "Vague and defensive",
      "ideal_rewrite": "STAR-style rewrite..."
    }
  ],
  "ideal_rewrites": ["..."],
  "executive_summary": "The user demonstrated...",
  "skills": {
    "composure": 68,
    "structure": 71,
    "evidence": 55,
    "empathy": 60,
    "decisiveness": 74
  },
  "mood_timeline": [5, 4, 6, 7, 6, 8]
}
```

**Verdicts by Category:**
| Category | Verdicts (best → worst) |
|----------|------------------------|
| HR_and_Interviews | STRONG HIRE, HIRE, LEANING NO HIRE, NO HIRE |
| Customer_Escalations | FULLY RESOLVED, RESOLVED, PARTIALLY RESOLVED, UNRESOLVED |
| Leadership_and_Management | STRONG LEADERSHIP, SOUND LEADERSHIP, UNCERTAIN LEADERSHIP, WEAK LEADERSHIP |
| External_Stakeholders | STRONG ALIGNMENT, ALIGNED, PARTIAL ALIGNMENT, MISALIGNED |
| Team_Dynamics | STRONG RESOLUTION, RESOLVED, PARTIAL RESOLUTION, UNRESOLVED |
| Compliance_and_Ethics | FULLY COMPLIANT, COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT |

---

### GET `/export/{session_id}` — PDF Export
Download report as PDF.

**Response:** `application/pdf` attachment

---

## 🏥 Health Check

### GET `/health`
Verify backend + dependencies.

**Response (200):**
```json
{
  "status": "online",
  "services": {
    "database": true,
    "groq_api": true
  }
}
```

**503** if any service unreachable.

---

## ❌ Error Format

All errors:
```json
{
  "error": "Description of what went wrong"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request |
| 401 | Auth missing/invalid |
| 403 | Forbidden (role/ownership) |
| 404 | Not found / no access |
| 500 | Server error |
| 503 | Service unavailable |

---

## 🔄 SSE Client Example (JavaScript)

```javascript
async function* streamChat(sessionId, message) {
  const token = await getToken(); // Supabase JWT
  
  const res = await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ session_id, message })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      
      try {
        yield JSON.parse(json);
      } catch {
        yield { type: 'raw', text: json };
      }
    }
  }
}

// Usage
for await (const event of streamChat(sessionId, "Hello")) {
  if (event.type === 'chunk') {
    appendToUI(event.text);
  } else if (event.type === 'metadata') {
    updateMood(event.new_mood);
    showFillerAnalysis(event.filler_analysis);
  }
}
```

---

*Next: [Frontend Architecture →](./05-frontend-architecture.md)*