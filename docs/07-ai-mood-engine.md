# Part 07: AI & Mood Engine

## Overview

Sentinel's core innovation is the **Adaptive Mood Engine** — a dynamic 1–10 emotional state system that drives an adversarial AI interviewer. Unlike static interview tools, Sentinel's AI continuously evaluates user responses and shifts its emotional state, creating a realistic simulation of workplace pressure.

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOOD ENGINE PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Answer                                                               │
│       │                                                                    │
│       ▼                                                                    │
│  ┌─────────────────────┐                                                   │
│  │  Mood Shift Scorer  │  llama-3.1-8b-instant                            │
│  │  (Fast Grader)      │  Temperature: 0.0                                 │
│  │                     │  Max tokens: 5                                    │
│  │ Input:              │  Output: -2, -1, 0, +1, +2                       │
│  │  - Scenario         │                                                   │
│  │  - Context          │                                                   │
│  │  - User message     │                                                   │
│  └──────────┬──────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                   │
│  │  Mood State Update  │                                                   │
│  │  new_mood = clamp(  │                                                   │
│  │    current + shift, │                                                   │
│  │    1, 10)           │                                                   │
│  └──────────┬──────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌─────────────────────┐                                                   │
│  │  Interviewer LLM    │  llama-3.3-70b-versatile                          │
│  │  (Main Interviewer) │  Temperature: 0.7 (0.8 brutal)                   │
│  │                     │  Max tokens: 200                                  │
│  │ Input:              │  Output: Streaming SSE                           │
│  │  - System prompt    │                                                   │
│  │  - Mood instruction │                                                   │
│  │  - History          │                                                   │
│  │  - User message     │                                                   │
│  └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Mood Shift Scoring

### Scoring Prompt

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

### Configuration

| Parameter | Value |
|-----------|-------|
| **Model** | `llama-3.1-8b-instant` (Groq) |
| **Temperature** | `0.0` (deterministic) |
| **Max Tokens** | `5` |
| **Output** | Integer only (-2, -1, 0, 1, 2) |

### Implementation

```python
def calc_mood_shift(client, user_message, scenario, context):
    eval_prompt = f"""
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
    """
    
    response = client.chat.completions.create(
        model=GROQ_MODEL_FAST,  # llama-3.1-8b-instant
        messages=[{"role": "system", "content": eval_prompt}],
        temperature=0.0,
        max_tokens=5
    )
    
    # Parse integer from response
    score_text = response.choices[0].message.content.strip()
    match = re.search(r'[-+]?\d+', score_text)
    if match:
        score = int(match.group())
        return max(-2, min(2, score))
    return 0
```

---

## 🎭 Mood State Descriptions

| Mood | Range | Label | Interviewer Behavior |
|------|-------|-------|---------------------|
| 1 | 1–2 | **Hostile** | Combative, may interrupt, refuses to cooperate |
| 2 | 3–4 | **Frustrated** | Annoyed, impatient, skeptical |
| 3 | 5–6 | **Guarded** | Professional but distant, standard difficulty |
| 4 | 7–8 | **Engaged** | Receptive, agreeable, collaborative |
| 5 | 9–10 | **Impressed** | Supportive, relieved, encouraging |

### Mood Descriptions (Full)

| Mood | Description |
|------|-------------|
| 1 | Furious, completely uncooperative, highly aggressive |
| 2 | Very angry and deeply skeptical |
| 3 | Frustrated and defensive |
| 4 | Annoyed and impatient |
| 5 | Neutral and guarded |
| 6 | Slightly receptive but cautious |
| 7 | Calming down and willing to listen |
| 8 | Agreeable and professional |
| 9 | Highly collaborative and impressed |
| 10 | Completely won over, supportive, relieved |

### Mood Instruction Injection

```python
mood_descriptions = {
    1: "furious, completely uncooperative, and highly aggressive",
    2: "very angry and deeply skeptical",
    3: "frustrated and defensive",
    4: "annoyed and impatient",
    5: "neutral and guarded",
    6: "slightly receptive but cautious",
    7: "calming down and willing to listen",
    8: "agreeable and professional",
    9: "highly collaborative and impressed",
    10: "completely won over, supportive, and relieved"
}

mood_instruction = f"\n\nCRITICAL MOOD INSTRUCTION: Based on the user's last response, your current emotional state is {new_mood}/10 ({mood_descriptions[new_mood]}). Let this emotion dictate your tone, vocabulary, and level of cooperation in this next message."
```

---

## 🤖 Interviewer LLM

### System Prompt Construction

```python
def build_system_instruction(scenario, personality, context, brutal):
    scenario_data = PROMPTS_DB.get(scenario)
    base_template = scenario_data.get("template", DEFAULT_TEMPLATE)
    
    system_prompt = base_template.format(context=context, personality=personality)
    
    if brutal:
        system_prompt += """
        
CRITICAL - BRUTAL HONESTY MODE IS ACTIVE:
1. If the user is vague, avoids the actual issue, or uses passive-aggressive corporate-speak, call it out directly inside the scene as a frustrated colleague/manager would.
2. Do not let the user 'win' the conversation through vagueness or conflict-avoidance. Push back aggressively.
        """
    
    return system_prompt
```

### Scenario Templates (from `prompts.json`)

Each scenario has a template with `{context}` and `{personality}` placeholders.

| Scenario | Category | AI Role |
|----------|----------|---------|
| Firing an Employee | HR_and_Interviews | Underperforming employee being terminated |
| Defending Technical Architecture | Leadership_and_Management | Skeptical staff engineer |
| Handling PR Crisis | External_Stakeholders | Aggressive investigative journalist |
| Mediating Team Dispute | Team_Dynamics | Stubborn team member |
| Negotiating Vendor Contract | External_Stakeholders | Uncompromising enterprise sales rep |
| Pushing Back on Scope Creep | Leadership_and_Management | Skeptical project manager |
| Managing Security Incident | Compliance_and_Ethics | Security analyst |
| Resolving Customer Escalation | Customer_Escalations | Impatient customer support rep |
| Handling Employee Feedback | HR_and_Interviews | Unprofessional employee |
| Defending Business Decision | Leadership_and_Management | Critical business analyst |
| Handling Media Interview | External_Stakeholders | Defensive PR officer |
| Managing Difficult Stakeholder | External_Stakeholders | Headstrong vendor/partner |
| Dealing with Office Politics | Team_Dynamics | Cunning office politician |
| Handling Regulatory Compliance | Compliance_and_Ethics | Meticulous compliance officer |

### Generation Parameters

| Parameter | Normal | Brutal Mode |
|-----------|--------|-------------|
| **Model** | `llama-3.3-70b-versatile` | `llama-3.3-70b-versatile` |
| **Temperature** | `0.7` | `0.8` |
| **Max Tokens** | `200` | `200` |
| **Stream** | `True` | `True` |

---

## 📊 Evaluation Report Generation

### Grader Prompt

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

### Verdict Vocabulary by Category

| Category | Verdicts (Best → Worst) |
|----------|------------------------|
| HR_and_Interviews | STRONG HIRE, HIRE, LEANING NO HIRE, NO HIRE |
| Customer_Escalations | FULLY RESOLVED, RESOLVED, PARTIALLY RESOLVED, UNRESOLVED |
| Leadership_and_Management | STRONG LEADERSHIP, SOUND LEADERSHIP, UNCERTAIN LEADERSHIP, WEAK LEADERSHIP |
| External_Stakeholders | STRONG ALIGNMENT, ALIGNED, PARTIAL ALIGNMENT, MISALIGNED |
| Team_Dynamics | STRONG RESOLUTION, RESOLVED, PARTIAL RESOLUTION, UNRESOLVED |
| Compliance_and_Ethics | FULLY COMPLIANT, COMPLIANT, PARTIALLY COMPLIANT, NON-COMPLIANT |

### Grader Configuration

| Parameter | Value |
|-----------|-------|
| **Model** | `llama-3.3-70b-versatile` |
| **Temperature** | `0.3` |
| **Response Format** | `json_object` |

---

## 🎙️ Audio Pipeline

### Transcription (Whisper)

```python
def transcribe_audio_file(file_path: str) -> str:
    client = get_groq_client()
    with open(file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file=file,
            model="whisper-large-v3",
            prompt="Accurately transcribe spoken audio. Preserve all filler words like um, uh, and like exactly as spoken.",
            response_format="text"
        )
    return transcription.text
```

**Configuration:**
- **Model**: `whisper-large-v3`
- **Format**: `text` (preserves filler words)
- **Prompt**: Preserves filler words verbatim

### Audio Turn Flow

```python
# Frontend records WebM → sends to /api/v1/chat/audio
# Backend:
1. Receive WebM file
2. Whisper transcription (preserves fillers)
3. Filler word analysis on transcript
4. Toxicity check on transcript
5. Generate interviewer response (same as text)
6. Return: transcript, response, mood, fillers, toxicity
```

---

## 📝 Filler Word Detection

### Detection Logic (spaCy)

```python
FILLER_WORDS = {"um", "uh", "hmm", "like", "so", "basically", "literally", "actually", "sort of", "kind of", "you know", "i mean", "i guess"}
HEDGING_WORDS = {"maybe", "perhaps", "possibly", "probably", "i think", "i feel", "might", "could be", "a bit", "a little", "somewhat", "almost"}
ASSERTIVE_WORDS = {"i believe", "i am confident", "certainly", "definitely", "absolutely", "undoubtedly", "without question", "clearly", "i know", "i am sure"}

def count_filler_words(text: str) -> dict:
    pure_fillers = {"um", "uh", "hmm"}
    tricky_fillers = {"like", "so", "basically", "literally"}
    
    found = {}
    total = 0
    doc = _get_nlp()(text.lower())
    
    for token in doc:
        word = token.text
        if word in pure_fillers:
            found[word] = found.get(word, 0) + 1
            total += 1
        elif word in tricky_fillers:
            # Only count as filler if not verb/noun/proper noun
            if token.pos_ not in ["VERB", "NOUN", "PROPN"]:
                found[word] = found.get(word, 0) + 1
                total += 1
    
    return {"details": found, "total_increment": total}
```

### Confidence Scoring

```python
def calculate_confidence(text: str) -> int:
    doc = _get_nlp()(text.lower())
    words = [t.text for t in doc if not t.is_punct and not t.is_space]
    total = len(words)
    if total == 0: return 50
    
    filler_count = sum(1 for t in doc if t.text.lower() in FILLER_WORDS)
    hedging_count = sum(1 for t in doc if t.text.lower() in HEDGING_WORDS)
    assertive_count = sum(1 for t in doc if t.text.lower() in ASSERTIVE_WORDS)
    
    filler_ratio = filler_count / total
    hedging_ratio = hedging_count / total
    assertive_ratio = assertive_count / total
    
    score = 70
    score -= filler_ratio * 300
    score -= hedging_ratio * 200
    score += assertive_ratio * 150
    return max(0, min(100, int(score)))
```

---

## 📊 Evaluation Metrics

### Report Components

| Component | Description |
|-----------|-------------|
| **Overall Score** | 0–100 holistic performance |
| **Confidence Score** | 0–100 based on fillers/hedging/assertiveness |
| **Verdict** | Category-specific (see table) |
| **Strengths** | 3–5 positive observations |
| **Critical Weaknesses** | 3–5 areas for improvement |
| **Weak Moments** | Turn-by-turn STAR rewrites |
| **Ideal Rewrites** | Alternative phrasings |
| **Executive Summary** | Narrative assessment |
| **Skills** | 5 dimensions (0–100 each) |
| **Mood Timeline** | Array of mood values per turn |

### Skill Dimensions

| Skill | What It Measures |
|-------|------------------|
| **Composure** | Calm under pressure, emotional regulation |
| **Structure** | Organized STAR-style answers |
| **Evidence** | Concrete data/metrics backing claims |
| **Empathy** | Acknowledging counterpart's perspective |
| **Decisiveness** | Clear next steps, ownership |

---

## ⚡ Performance Characteristics

| Component | Model | Latency |
|-----------|-------|---------|
| Mood Shift | llama-3.1-8b-instant | ~200ms |
| Interview Response | llama-3.3-70b-versatile | ~500ms (streaming) |
| Evaluation | llama-3.3-70b-versatile | ~2s |
| Transcription | Whisper large-v3 | ~1s |
| Filler Detection | spaCy (local) | ~10ms |
| Toxicity | scikit-learn (local) | ~5ms |

---

## 🎯 Key Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Adversarial by Design** | AI actively challenges, doesn't just ask questions |
| **Mood as State** | Persistent emotional context, not per-turn |
| **Separation of Concerns** | Fast grader (8b) + Smart interviewer (70b) |
| **Deterministic Grading** | Temp 0.0 for mood scoring |
| **Streaming First** | SSE for real-time feel |
| **Lazy Loading** | Models loaded on first use |
| **Fail Graceful** | Fallback scores if models unavailable |

---

*Next: [Desktop Application →](./08-desktop-application.md)*