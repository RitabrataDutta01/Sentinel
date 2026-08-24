# Prompt Library

All prompt templates are defined in `backend/app/prompts.json`. System instructions are assembled in `backend/app/engine.py:build_system_instruction()`.

---

## Interview Scenarios (prompts.json)

Each scenario uses a shared template structure with `{context}` and `{personality}` placeholders:

| Scenario | Category | Role the AI plays |
|----------|----------|-------------------|
| Firing an Employee | HR_and_Interviews | Underperforming employee being terminated |
| Defending a Technical Architecture | Leadership_and_Management | Skeptical staff engineer challenging the user |
| Handling a PR Crisis | External_Stakeholders | Aggressive investigative journalist |
| Mediating a Team Dispute | Team_Dynamics | Stubborn team member furious at a colleague |
| Negotiating a Vendor Contract | External_Stakeholders | Uncompromising enterprise sales rep |
| Pushing Back on Scope Creep | Leadership_and_Management | Skeptical project manager |
| Managing an Active Security Incident | Compliance_and_Ethics | Security analyst responding to a threat |
| Resolving a Customer Escalation | Customer_Escalations | Impatient customer support rep |
| Handling Employee Feedback | HR_and_Interviews | Unprofessional employee giving feedback |
| Defending a Business Decision | Leadership_and_Management | Critical business analyst |
| Handling a Media Interview | External_Stakeholders | Defensive PR officer |
| Managing a Difficult Stakeholder | External_Stakeholders | Headstrong vendor/partner |
| Dealing with Office Politics | Team_Dynamics | Cunning office politician |
| Handling Regulatory Compliance | Compliance_and_Ethics | Meticulous compliance officer |

---

## Mood Shift Scoring (engine.py)

Determines how the AI's internal mood changes after each user response.

**Prompt:**
```
You are an internal scoring engine for a workplace simulator.
Scenario: {scenario}
Context: {context}
User said: "{user_message}"

Score how well the user handled this.
Criteria: De-escalation, clarity, professionalism, and logic.
  -2: Terrible (escalates conflict, highly unprofessional, or avoids the issue)
  -1: Poor (vague, slightly defensive, weak logic)
   0: Neutral (acceptable but unimpressive)
  +1: Good (professional, clear, attempts to resolve)
  +2: Excellent (masterful de-escalation, perfect logic, confident)

Output ONLY the integer (-2, -1, 0, 1, or 2). Do not output any other text or explanation.
```

**Model:** `llama-3.1-8b-instant`, temperature `0.0`, `max_tokens` 5

---

## Live Interview (engine.py:generate_interview_response)

The adversarial AI interviewer itself runs on **`llama-3.3-70b-versatile`** with the
system instruction built by `build_system_instruction()`.

---

## Audio Transcription (engine.py:transcribe_audio_file)

Recorded answers are transcribed with **`whisper-large-v3`** (`response_format: text`),
preserving filler words verbatim.

---

## Evaluation Report Generator (engine.py:generate_report_card)

Generates the post-session performance evaluation.

**System prompt:**
```
You are an elite enterprise HR Assessor and Crisis Management Expert.
Your sole objective is to analyze the provided conversation history
and evaluate the USER's performance in de-escalating a workplace crisis.

CRITICAL INSTRUCTION:
  - The AI in the chat transcript is playing an adversarial role.
    Do NOT evaluate the AI's behavior.
  - You are strictly grading the USER on communication skills,
    de-escalation tactics, professionalism, and emotional intelligence.

You must output a strictly formatted JSON object matching this schema:
{
  "overall_score": <int 0-100>,
  "confidence_score": <int 0-100>,
  "verdict": "<STRONG HIRE | HIRE | LEANING NO HIRE | NO HIRE>",
  "strengths": ["string", ...],
  "critical_weaknesses": ["string", ...],
  "weak_moments": [
    {
      "turn_index": <int>,
      "user_answer": "<original answer>",
      "issue": "<why it was weak>",
      "ideal_rewrite": "<STAR-style rewrite>"
    }
  ],
  "ideal_rewrites": ["string", ...],
  "executive_summary": "<detailed analysis paragraph>",
  "skills": {
    "composure": <int 0-100>,
    "structure": <int 0-100>,
    "evidence": <int 0-100>,
    "empathy": <int 0-100>,
    "decisiveness": <int 0-100>
  }
}

Evaluation Rubric:
1. Accountability
2. Tone & De-escalation
3. Resolution Focus
4. Confidence & Language
```

The backend then appends `mood_timeline` from the session. If the model omits the
`skills` object, `generate_report_card` fills it from `confidence_score`/`overall_score`
with sensible defaults.

**Model:** `llama-3.3-70b-versatile`, temperature `0.3`, `response_format: {"type": "json_object"}`

