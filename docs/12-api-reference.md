# Part 12: API Reference

## Overview

| Property | Value |
|----------|-------|
| Base URL | `/api/v1` |
| Auth | `Authorization: Bearer <Supabase JWT>` |
| Format | JSON (except audio) |
| Swagger | `GET /apidocs/` |

---

## 📋 Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Health check |
| POST | `/auth/signup` | ❌ | Register user |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/oauth/profile` | ✅ | OAuth profile backfill |
| GET | `/scenarios` | ✅ | List scenarios |
| POST | `/start` | ✅ | Start session |
| POST | `/chat` | ✅ | Chat (SSE) |
| POST | `/chat/audio` | ✅ | Audio turn |
| POST | `/evaluate` | ✅ | Generate report |
| GET | `/export/<id>` | ✅ | PDF export |
| GET | `/orgs/me` | ✅ | My org |
| GET | `/orgs/pending` | ✅ | Pending invites |
| POST | `/orgs` | ✅ | Create org |
| POST | `/orgs/{id}/join` | ✅ | Join org |
| POST | `/orgs/{id}/invite` | ✅ (admin) | Invite member |
| GET | `/orgs/{id}/members` | ✅ | List members |
| PATCH | `/orgs/{id}/members/{uid}` | ✅ (admin) | Update member |
| DELETE | `/orgs/{id}/members/{uid}` | ✅ (admin) | Remove member |
| GET | `/reports` | ✅ | List reports |

---

## 📋 Endpoint Details

### GET `/health`
Health check.

**Response (200):**
```json
{
  "status": "online",
  "services": { "database": true, "groq_api": true }
}
```
**503** if any service down.

---

## 🔐 Authentication

### POST `/auth/signup`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "Ada",
  "last_name": "Lovelace",
  "role": "student"
}
```
**Response (201):**
```json
{ "message": "User registered successfully", "user_id": "uuid" }
```

### POST `/auth/login`
```json
{ "email": "user@example.com", "password": "password123" }
```
**Response (200):**
```json
{ "message": "Login successful", "access_token": "jwt", "user_id": "uuid" }
```

### POST `/auth/oauth/profile`
```json
{ "first_name": "Ada", "last_name": "Lovelace", "role": "student" }
```
**Response (200):**
```json
{ "message": "Profile ready", "profile": { "id": "uuid", "first_name": "Ada", "last_name": "Lovelace", "role": "student" } }
```

---

## 🎭 Scenarios

### GET `/scenarios`
**Response (200):**
```json
{
  "scenarios": [
    { "key": "Firing an Employee", "label": "Firing an Employee", "category": "HR_and_Interviews" },
    { "key": "Defending a Technical Architecture", "label": "Defending a Technical Architecture", "category": "Leadership_and_Management" },
    { "key": "Handling a PR Crisis", "label": "Handling a PR Crisis", "category": "External_Stakeholders" },
    { "key": "Mediating a Team Dispute", "label": "Mediating a Team Dispute", "category": "Team_Dynamics" },
    { "key": "Negotiating a Vendor Contract", "label": "Negotiating a Vendor Contract", "category": "External_Stakeholders" },
    { "key": "Pushing Back on Scope Creep", "label": "Pushing Back on Scope Creep", "category": "Leadership_and_Management" },
    { "key": "Managing an Active Security Incident", "label": "Managing an Active Security Incident", "category": "Compliance_and_Ethics" },
    { "key": "Resolving a Customer Escalation", "label": "Resolving a Customer Escalation", "category": "Customer_Escalations" },
    { "key": "Handling Employee Feedback", "label": "Handling Employee Feedback", "category": "HR_and_Interviews" },
    { "key": "Defending a Business Decision", "label": "Defending a Business Decision", "category": "Leadership_and_Management" },
    { "key": "Handling a Media Interview", "label": "Handling a Media Interview", "category": "External_Stakeholders" },
    { "key": "Managing a Difficult Stakeholder", "label": "Managing a Difficult Stakeholder", "category": "External_Stakeholders" },
    { "key": "Dealing with Office Politics", "label": "Dealing with Office Politics", "category": "Team_Dynamics" },
    { "key": "Handling Regulatory Compliance", "label": "Handling Regulatory Compliance", "category": "Compliance_and_Ethics" }
  ]
}
```

---

## 🏢 Organizations

### POST `/orgs`
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

### GET `/orgs/me`
```json
{
  "org": { "id": "uuid", "name": "Acme Corp", "settings": {}, "created_at": "..." },
  "membership": { "user_id": "uuid", "org_id": "uuid", "system_role": "hr", "status": "active" }
}
```
Returns nulls if no org.

### GET `/orgs/pending`
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

### POST `/orgs/{org_id}/join`
```json
{}
```
**Response:** Same as `GET /orgs/me`

### POST `/orgs/{org_id}/invite` (Admin)
```json
{ "email": "colleague@company.com", "system_role": "member" }
```
**Response:** `{ "message": "Invite sent" }`
**Errors:** `403` (not admin), `404` (user not found)

### GET `/orgs/{org_id}/members`
```json
{
  "members": [
    { "id": "uuid", "org_id": "uuid", "user_id": "uuid", "system_role": "admin", "status": "active", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@company.com" }
  ]
}
```

### PATCH `/orgs/{org_id}/members/{user_id}` (Admin)
```json
{ "system_role": "hr", "status": "active" }
```
**Response:** `{ "message": "Member updated", "member": {...} }`

### DELETE `/orgs/{org_id}/members/{user_id}` (Admin)
```json
{ "message": "Member removed" }
```
Cannot remove self.

---

## 🎭 Sessions

### POST `/start`
```json
{
  "scenario": "Firing an Employee",
  "personality": "Underperforming employee",
  "context": "You are the manager delivering the termination.",
  "brutal": false
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

### POST `/chat` — SSE
```json
{ "session_id": "uuid", "message": "Your response" }
```

**SSE Stream:**
```
data: {"type":"chunk","text":"*(Thinking...)*"}

data: {"type":"chunk","text":"I understand your position,"}

data: {"type":"metadata","full_text":"I understand your position, but...","filler_analysis":{"details":{"like":1},"total_increment":1},"new_mood":4}
```

**Events:**
| Type | Description |
|------|-------------|
| `chunk` | Streaming text token |
| `metadata` | Final: full_text, filler_analysis, new_mood |

---

### POST `/chat/audio`
**Form Data:**
| Field | Type |
|-------|------|
| `audio` | file (WebM) |
| `session_id` | string |

**Response (200):**
```json
{
  "user_transcript": "transcribed text",
  "response": "AI response",
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
```json
{ "session_id": "uuid", "duration_sec": 312 }
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
    { "turn_index": 4, "user_answer": "...", "issue": "Vague and defensive", "ideal_rewrite": "STAR rewrite..." }
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

### Verdicts by Category
| Category | Best → Worst |
|----------|--------------|
| HR_and_Interviews | STRONG HIRE, HIRE, LEANING NO HIRE, NO HIRE |
| Customer_Escalations | FULLY RESOLVED, RESOLVED, PARTIALLY RESOLVED, UNRESOLVED |
| Leadership_and_Management | STRONG LEADERSHIP, SOUND LEADERSHIP, UNCERTAIN LEADERSHIP, WEAK LEADERSHIP |
| External_Stakeholders | STRONG ALIGNMENT, ALIGNED, PARTIAL ALIGNMENT, MISALIGNED |
| Team_Dynamics | STRONG RESOLUTION, RESOLVED, PARTIAL RESOLUTION, UNRESOLVED |
| Compliance_and_Ethics | FULLY COMPLIANT, COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT |

---

### GET `/export/{session_id}`
**Response:** `application/pdf` attachment

---

## 🏥 Health

### GET `/health`
```json
{
  "status": "online",
  "services": { "database": true, "groq_api": true }
}
```
**503** if any service down.

---

## ❌ Errors

```json
{ "error": "Description" }
```

| Code | Meaning |
|------|---------|
| 400 | Bad request |
| 401 | Auth required |
| 403 | Forbidden |
| 404 | Not found / no access |
| 500 | Server error |
| 503 | Service unavailable |

---

## 📡 SSE Client Example

```javascript
async function* streamChat(sessionId, message) {
  const token = await getToken();
  const res = await fetch('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ session_id: sessionId, message })
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
      try { yield JSON.parse(json); } catch { yield { type: 'raw', text: json }; }
    }
  }
}

// Usage
for await (const event of streamChat(sessionId, "Hello")) {
  if (event.type === 'chunk') appendToUI(event.text);
  else if (event.type === 'metadata') { updateMood(event.new_mood); showFillers(event.filler_analysis); }
}
```

---

*Next: [Design System →](./13-design-system.md)*