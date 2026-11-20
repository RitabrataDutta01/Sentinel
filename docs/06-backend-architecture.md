# Part 06: Backend Architecture

## Overview

| Property | Value |
|----------|-------|
| Framework | Flask 3.1 |
| Language | Python 3.10 |
| Package Manager | uv |
| Entry Point | `run.py` → `create_app()` |

---

## 🏗️ Application Factory

```python
# backend/app/__init__.py
def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'False') == 'True'

    # CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Swagger
    Swagger(app, config=swagger_config, template=swagger_template)

    # Register blueprint
    from app.routes import api
    app.register_blueprint(api, url_prefix="/api/v1")

    # Static file serving (production SPA)
    @app.route('/', defaults={'path': 'index.html'})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Serves built React app from backend/static/
        ...

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        return jsonify({"status": "error", "message": str(e), "type": e.__class__.__name__}), 500

    return app
```

---

## 📦 Module Structure

```
backend/
├── app/
│   ├── __init__.py        # create_app(), Flask config
│   ├── routes.py          # API endpoints (Blueprint)
│   ├── engine.py          # AI engine, mood engine, reports
│   ├── models.py          # Supabase models + SessionManager
│   ├── utils.py           # Auth decorators, filler words, spaCy
│   ├── emailer.py         # SMTP invite emails
│   ├── prompts.json       # 14 scenario definitions
│   └── templates/         # HTML templates for PDF
├── requirements.txt
├── render-build.sh
├── run.py                 # Entry point
├── .env                   # Environment variables
└── toxicity_model.pkl     # ML model (scikit-learn)
```

---

## 🔐 Authentication & Authorization

### JWT Validation (`utils.py`)
```python
def verify_supabase_jwt(token: str):
    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {"id": user_response.user.id, "email": user_response.user.email}
    except Exception as e:
        print(f"Auth Token Validation Failed: {e}")
    return None

def requires_auth(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header: return jsonify({"error": "Authorization header missing"}), 401
        
        token_type, token = auth_header.split(" ")
        if token_type.lower() != "bearer": return jsonify({"error": "Must be Bearer"}), 401
            
        user_context = verify_supabase_jwt(token)
        if not user_context: return jsonify({"error": "Invalid/expired token"}), 401

        g.user_id = user_context["id"]
        g.user_email = user_context["email"]
        return f(*args, **kwargs)
    return decorated
```

**Usage:**
```python
@api.route('/start', methods=['POST'])
@requires_auth
def start_session():
    # g.user_id available
    ...
```

---

## 🤖 AI Engine (`engine.py`)

### Core Components

| Function | Purpose | Model |
|----------|---------|-------|
| `build_system_instruction()` | Build interviewer system prompt | — |
| `generate_interview_response()` | SSE streaming interviewer | llama-3.3-70b |
| `calc_mood_shift()` | Score user answer (-2 to +2) | llama-3.1-8b |
| `generate_report_card()` | Full evaluation report | llama-3.3-70b |
| `transcribe_audio_file()` | Speech-to-text | Whisper large-v3 |

---

### Mood Engine

**Mood Shift Scoring (-2 to +2):**
```python
def calc_mood_shift(client, user_message, scenario, context):
    eval_prompt = f"""
    You are an internal scoring engine for a workplace simulator.
    Scenario: {scenario}
    Context: {context}
    User said: "{user_message}"

    Score how well the user handled this.
    Criteria: De-escalation, clarity, professionalism, logic.
      -2: Terrible (escalates conflict, highly unprofessional, or avoids the issue)
      -1: Poor (vague, slightly defensive, weak logic)
       0: Neutral (acceptable but unimpressive)
      +1: Good (professional, clear, attempts to resolve)
      +2: Excellent (masterful de-escalation, perfect logic, confident)

    Output ONLY the integer (-2, -1, 0, 1, or 2).
    """
    response = client.chat.completions.create(
        model=GROQ_MODEL_FAST,  # llama-3.1-8b-instant
        messages=[{"role": "system", "content": eval_prompt}],
        temperature=0.0,
        max_tokens=5
    )
    # Parse integer from response
    ...
```

**Mood Descriptions (1-10):**
| Mood | Label | Behavior |
|------|-------|----------|
| 1 | Hostile | Combative, may interrupt |
| 2 | Hostile | Very angry, deeply skeptical |
| 3 | Frustrated | Defensive |
| 4 | Frustrated | Annoyed, impatient |
| 5 | Guarded | Neutral, guarded |
| 6 | Guarded | Slightly receptive |
| 7 | Engaged | Calming, willing to listen |
| 8 | Engaged | Agreeable, professional |
| 9 | Impressed | Collaborative, impressed |
| 10 | Impressed | Supportive, relieved |

---

### Interview Response Generation

```python
def generate_interview_response(session_data, current_message):
    # 1. Calculate mood shift
    mood_shift = calc_mood_shift(...)
    new_mood = clamp(current_mood + mood_shift, 1, 10)
    
    # 2. Build system instruction with mood
    system_instruction = build_system_instruction(
        scenario=session_data["scenario"],
        personality=session_data["personality"],
        context=session_data["context"],
        brutal=session_data.get("brutal_mode", False)
    ) + f"\n\nMOOD INSTRUCTION: Current emotional state is {new_mood}/10 ({mood_description})."
    
    # 3. Build conversation history
    messages = [{"role": "system", "content": system_instruction}]
    for turn in session_data.get("history", []):
        role = "assistant" if turn["role"] == "model" else turn["role"]
        content = extract_content(turn)
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": current_message})
    
    # 4. Stream from Groq
    response = client.chat.completions.create(
        model=GROQ_MODEL_MAIN,  # llama-3.3-70b-versatile
        messages=messages,
        temperature=TEMPERATURE_BRUTAL if brutal else TEMPERATURE_DEFAULT,
        max_tokens=MAX_TOKENS_INTERVIEW,
        stream=True
    )
    
    # 5. Yield SSE chunks
    for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
            yield f"data: {json.dumps({'type': 'chunk', 'text': token})}\n\n"
            full_text += token
    
    # 6. Final metadata
    yield f"data: {json.dumps({'type': 'metadata', 'full_text': full_text, 'filler_analysis': filler, 'new_mood': new_mood})}\n\n"
```

---

### Report Generation

```python
def generate_report_card(session_data):
    transcript = "\n".join([
        f"[Turn {i}] {msg['role'].upper()}: {extract_text(msg)}"
        for i, msg in enumerate(session_data.get("history", []))
    ])
    
    category = _category_of(session_data.get("scenario", ""))
    vocab = _verdict_vocab_for(category)
    
    grader_instruction = f"""
    You are an elite enterprise HR Assessor.
    Evaluate the USER's performance in de-escalating a workplace crisis.
    
    CRITICAL: The AI is adversarial. Do NOT evaluate AI behavior.
    Grade USER on: communication, de-escalation, professionalism, EQ.
    
    Output JSON matching schema:
    {{
      "overall_score": <0-100>,
      "confidence_score": <0-100>,
      "verdict": "{' | '.join(vocab)}",
      "strengths": ["..."],
      "critical_weaknesses": ["..."],
      "weak_moments": [{{"turn_index": N, "user_answer": "...", "issue": "...", "ideal_rewrite": "..."}}],
      "ideal_rewrites": ["..."],
      "executive_summary": "Detailed analysis...",
      "skills": {{"composure": N, "structure": N, "evidence": N, "empathy": N, "decisiveness": N}}
    }}
    
    Verdict vocabulary: {' | '.join(vocab)}
    
    Rubric:
    1. Accountability
    2. Tone & De-escalation
    3. Resolution Focus
    4. Confidence & Language
    """
    
    response = client.chat.completions.create(
        model=GROQ_MODEL_MAIN,
        messages=[
            {"role": "system", "content": grader_instruction},
            {"role": "user", "content": f"Transcript:\n{transcript}"}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )
    
    report = json.loads(response.choices[0].message.content)
    report["mood_timeline"] = session_data.get("mood_timeline", [])
    report["verdict_level"] = _verdict_level_for(report["verdict"], vocab)
    report["category"] = category
    
    return report
```

---

## 🎙️ Audio Transcription

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

---

## 📄 PDF Generation

```python
# routes.py
from weasyprint import HTML

@api.route('/export/<session_id>')
@requires_auth
def export(session_id):
    session = state_db.get_session(session_id)
    # ... auth checks
    
    report_data = session.get("evaluation_report")
    # ... parse if string
    
    rendered_html = render_template_string(REPORT_TEMPLATE, session_id=session_id, session=session, report_data=report_data)
    
    pdf_buffer = io.BytesIO()
    HTML(string=rendered_html).write_pdf(target=pdf_buffer)
    pdf_buffer.seek(0)
    
    return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name=f"Sentinel_Report_{session_id[:8]}.pdf")
```

---

## 📊 Toxicity Detection (Lazy Loaded)

```python
# routes.py
# SECURITY: This pickle file is generated from our own training pipeline and is not user-supplied.
# Loading untrusted pickle files allows arbitrary code execution.
_toxicity_model = None

def _get_toxicity_model():
    global _toxicity_model
    if _toxicity_model is None:
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        MODEL_PATH = os.path.join(BASE_DIR, '..', 'toxicity_model.pkl')
        try:
            _toxicity_model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: Could not load ML model: {e}")
            _toxicity_model = None
    return _toxicity_model

def process_chat(usr_msg: str) -> tuple[bool, int]:
    model = _get_toxicity_model()
    if model:
        probabilities = model.predict_proba([usr_msg])[0]
        toxicity_score = round(probabilities[1] * 100, 2)
        is_toxic = bool(toxicity_score > TOXICITY_THRESHOLD)
        return is_toxic, toxicity_score
    return False, 0.0
```

---

## 🛠️ Utilities (`utils.py`)

### Filler Word Detection (spaCy - Lazy Loaded)
```python
_nlp = None

def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load('en_core_web_sm')
    return _nlp

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
    
    score = 70
    score -= filler_count / total * 300
    score -= hedging_count / total * 200
    score += assertive_count / total * 150
    return max(0, min(100, int(score)))
```

---

## 📧 Email Service (`emailer.py`)

```python
def _smtp_config():
    return {
        "host": os.environ.get("SMTP_HOST"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "from_addr": os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER")),
    }

def smtp_configured():
    cfg = _smtp_config()
    return bool(cfg["host"] and cfg["user"] and cfg["password"] and cfg["from_addr"])

def send_invite_email(to_email: str, org_name: str, invite_code: str, role_label: str = "member"):
    if not smtp_configured():
        print("SMTP not configured — invite email skipped")
        return False
    
    # ... build MIME message, send via smtplib
    return True
```

---

## 📦 Session Management (`models.py`)

```python
class SessionManager:
    def __init__(self):
        self.db = supabase
    
    def create_session(self, session_id, user_id, scenario, personality, context, brutal, current_mood, mood_timeline):
        data = {
            "id": session_id, "user_id": user_id,
            "scenario": scenario, "context": context,
            "personality": personality, "brutal_mode": brutal,
            "current_mood": current_mood, "mood_timeline": mood_timeline,
            "history": []
        }
        return self.db.table("sessions").insert(data).execute().data[0]
    
    def get_session(self, session_id):
        return self.db.table("sessions").select("*").eq("id", session_id).execute().data[0] or None
    
    def append_message(self, session_id, role, text):
        session = self.get_session(session_id)
        history = session.get("history", [])
        history.append({"role": role, "parts": [text]})
        self.db.table("sessions").update({"history": history}).eq("id", session_id).execute()
    
    def update_mood(self, session_id, new_mood):
        session = self.get_session(session_id)
        timeline = session.get("mood_timeline", []) + [new_mood]
        self.db.table("sessions").update({"current_mood": new_mood, "mood_timeline": timeline}).eq("id", session_id).execute()
    
    def save_evaluation(self, session_id, report, duration_sec=None):
        if duration_sec: report["duration_sec"] = duration_sec
        self.db.table("sessions").update({"evaluation_report": report}).eq("id", session_id).execute()
```

---

## ⚙️ Configuration

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `render-build.sh` | Render build script |
| `requirements.txt` | Python dependencies |
| `Procfile` | Gunicorn start command |
| `Aptfile` | System deps for WeasyPrint |

### render-build.sh
```bash
#!/usr/bin/env bash
set -e
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Building frontend..."
npm ci --prefix ../frontend
npm run build --prefix ../frontend

echo "Copying frontend build..."
mkdir -p static
cp -r ../frontend/dist/* static/
```

### Procfile
```
web: gunicorn run:app
```

---

## 🚀 Entry Point

```python
# run.py
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(port=5000)
```

---

*Next: [AI & Mood Engine →](./07-ai-mood-engine.md)*