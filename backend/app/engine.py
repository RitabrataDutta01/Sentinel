import os, json
from groq import Groq
from httpx import stream
from app.utils import count_filler_words

# Configuration constants
GROQ_MODEL_MAIN = "openai/gpt-oss-120b"
GROQ_MODEL_FAST = "openai/gpt-oss-20b"
TEMPERATURE_DEFAULT = 0.7
TEMPERATURE_BRUTAL = 0.8
TEMPERATURE_GRADER = 0.3
MAX_TOKENS_INTERVIEW = 200
MOOD_SHIFT_MIN = -2
MOOD_SHIFT_MAX = 2
TOXICITY_THRESHOLD = 50.0  # Percentage

PROMPTS_FILE = os.path.join(os.path.dirname(__file__), 'prompts.json')

try:
    with open(PROMPTS_FILE, 'r', encoding='utf-8') as f:
        PROMPTS_DB = json.load(f)
except FileNotFoundError:
    PROMPTS_DB = {}
    print("WARNING: prompts.json not found. Ensure it is in the app/ directory.")

# Category-specific verdict vocabulary, strongest -> weakest. The grader prompt
# uses the vocabulary that matches the scenario's category so the verdict wording
# fits what was practiced (an interview says HIRE, a crisis says RESOLVED, etc.).
VERDICT_VOCAB = {
    "HR_and_Interviews": ["STRONG HIRE", "HIRE", "LEANING NO HIRE", "NO HIRE"],
    "Customer_Escalations": ["FULLY RESOLVED", "RESOLVED", "PARTIALLY RESOLVED", "UNRESOLVED"],
    "Leadership_and_Management": ["STRONG LEADERSHIP", "SOUND LEADERSHIP", "UNCERTAIN LEADERSHIP", "WEAK LEADERSHIP"],
    "External_Stakeholders": ["STRONG ALIGNMENT", "ALIGNED", "PARTIAL ALIGNMENT", "MISALIGNED"],
    "Team_Dynamics": ["STRONG RESOLUTION", "RESOLVED", "PARTIAL RESOLUTION", "UNRESOLVED"],
    "Compliance_and_Ethics": ["FULLY COMPLIANT", "COMPLIANT", "PARTIALLY COMPLIANT", "NON-COMPLIANT"],
}

DEFAULT_VERDICT_VOCAB = ["STRONG HIRE", "HIRE", "LEANING NO HIRE", "NO HIRE"]

def _category_of(scenario: str):
    data = PROMPTS_DB.get(scenario, {})
    return data.get("category") if isinstance(data, dict) else None

def _verdict_vocab_for(category):
    return VERDICT_VOCAB.get(category, DEFAULT_VERDICT_VOCAB)

def _verdict_level_for(verdict, vocab):
    """Map a returned verdict string to a 1-4 level (4 = best), deterministic."""
    v = (verdict or "").strip().upper()
    for idx, candidate in enumerate(vocab):
        if v == candidate.upper():
            return len(vocab) - idx
    if "STRONG" in v:
        return 4
    if "NON" in v or "UNRESOLVED" in v or "MISALIGNED" in v or "WEAK" in v or "NO HIRE" in v:
        return 1
    if "LEANING" in v or "PARTIAL" in v or "UNCERTAIN" in v:
        return 2
    if "HIRE" in v or "RESOLVED" in v or "ALIGN" in v or "COMPLIAN" in v or "LEADERSHIP" in v:
        return 3
    return 2

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is missing from environment configuration")
    return Groq(api_key=api_key)

def build_system_instruction(scenario: str, personality: str, context: str, brutal: bool) -> str:

    scenario_data = PROMPTS_DB.get(scenario)

    if not scenario_data:

        base_template = (
            "You are operating inside Sentinel. You are a professional counterpart in a workplace scenario. "
            "CURRENT FRAMEWORK: Context: {context}. Persona Style: {personality}. "
            "CORE MANDATES: 1. Stay in character completely. 2. Push back realistically on the user. "
            "3. Keep your responses concise and conversational (1-3 sentences maximum)."
        )
    else:
        base_template = scenario_data["template"]

    try:
        
        system_prompt = base_template.format(
            context=context,
            personality=personality
        )
    except KeyError as e:

        print(f"Template formatting error: Missing key {e}")
        system_prompt = base_template

    if brutal:
        system_prompt += (
            "\n\nCRITICAL - BRUTAL HONESTY MODE IS ACTIVE: "
            "1. If the user is vague, avoids the actual issue, or uses passive-aggressive corporate-speak, "
            "call it out directly inside the scene as a frustrated colleague/manager would. "
            "2. Do not let the user 'win' the conversation through vagueness or conflict-avoidance. Push back aggressively."
        )

    return system_prompt


def generate_interview_response(session_data: dict, current_message: str) -> str:
    client = get_groq_client()

    mood_shift = calc_mood_shift(
        client=client,
        user_message=current_message,
        scenario=session_data["scenario"],
        context=session_data["context"]
    )

    current_mood = session_data.get("current_mood", 5)
    new_mood = max(1, min(10, current_mood + mood_shift))

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
    current_emotion = mood_descriptions.get(new_mood, "neutral")

    base_instruction = build_system_instruction(
        scenario = session_data["scenario"],
        personality = session_data["personality"],
        context = session_data["context"],
        brutal = session_data.get("brutal_mode", False)
    )
    
    system_instruction = base_instruction + f"\n\nCRITICAL MOOD INSTRUCTION: Based on the user's last response, your current emotional state is {new_mood}/10 ({current_emotion}). Let this emotion dictate your tone, vocabulary, and level of cooperation in this next message."
    
    messages = [{"role": "system", "content": system_instruction}]
    
    for turn in session_data.get("history", []):
        role = turn.get("role", "user")
        groq_role = "assistant" if role == "model" else role
        
        content = ""
        if "text" in turn:
            content = turn["text"]
        elif "content" in turn:
            content = turn["content"]
        elif "parts" in turn and isinstance(turn["parts"], list) and len(turn["parts"]) > 0:
            part = turn["parts"][0]
            content = part.get("text", "") if isinstance(part, dict) else str(part)
            
        messages.append({"role": groq_role, "content": content})

    messages.append({
        "role": "user",
        "content": current_message
    })

    filler_analysis = count_filler_words(current_message)
    temp = TEMPERATURE_BRUTAL if session_data.get("brutal_mode", False) else TEMPERATURE_DEFAULT

    response = client.chat.completions.create(
        model = GROQ_MODEL_MAIN,
        messages = messages,
        temperature = temp,
        max_tokens = MAX_TOKENS_INTERVIEW,
        stream = True
    )

    full_text = ""
    for chunk in response:
        token = chunk.choices[0].delta.content
        if token:
            full_text += token
            yield f"data: {json.dumps({'type': 'chunk', 'text': token})}\n\n"

    final_data = {
        "type": "metadata",
        "full_text": full_text,
        "filler_analysis": filler_analysis,
        "new_mood": new_mood
    }
    yield f"data: {json.dumps(final_data)}\n\n"
    

def _extract_text(msg):
    if "text" in msg:
        return msg["text"]
    if "content" in msg:
        return msg["content"]
    parts = msg.get("parts", [])
    if parts:
        return parts[0] if isinstance(parts[0], str) else parts[0].get("text", "")
    return ""

def generate_report_card(session_data: dict) -> dict:

    client = get_groq_client()

    history = session_data.get("history", [])

    transcript = "\n".join([
        f"[Turn {i}] {msg.get('role', 'UNKNOWN').upper()}: {_extract_text(msg)}"
        for i, msg in enumerate(history)
    ])

    category = _category_of(session_data.get("scenario", ""))
    vocab = _verdict_vocab_for(category)
    verdict_hint = " | ".join(vocab)

    grader_instruction = """
        You are an elite enterprise HR Assessor and Crisis Management Expert. 
        Your sole objective is to analyze the provided conversation history and evaluate the USER's performance in de-escalating a workplace crisis.

        CRITICAL INSTRUCTION: 
            - The AI in the chat transcript is playing an adversarial, hostile, or defensive employee role. Do NOT evaluate the AI's behavior, tone, or compliance.
            - You are strictly grading the USER (the manager/interviewer) on their communication skills, de-escalation tactics, professionalism, and emotional intelligence.

        You must output a strictly formatted JSON object matching this schema exactly:
        {
              "overall_score": <int between 0 and 100>,
              "confidence_score": <int between 0 and 100, based on filler words, hedging, and assertiveness>,
              "verdict": "__VERDICT_VOCAB__",
              "strengths": ["string", "string", ...],
              "critical_weaknesses": ["string", "string", ...],
              "weak_moments": [
                  {
                      "turn_index": <int referencing the turn number in the transcript>,
                      "user_answer": "<the user's original answer>",
                      "issue": "<why it was weak — vague, defensive, no structure, etc.>",
                      "ideal_rewrite": "<a rewritten version following STAR or better communication principles>"
                  }
              ],
              "ideal_rewrites": ["<rewritten version of a weak answer>", ...],
              "executive_summary": "<Detailed paragraph analyzing the user's specific performance, de-escalation techniques used, and how well they managed the employee's mood>",
              "skills": {
                  "composure": <int between 0 and 100, keeping cool under pressure>,
                  "structure": <int between 0 and 100, organized STAR-style answers>,
                  "evidence": <int between 0 and 100, backing claims with concrete data/metrics>,
                  "empathy": <int between 0 and 100, acknowledging the counterpart's perspective>,
                  "decisiveness": <int between 0 and 100, committing to clear next steps>
              }
        }

        Evaluation Rubric for User:
            1. Accountability: Did they take ownership or immediately pivot to solutions?
            2. Tone & De-escalation: Did they keep their cool under pressure or mirror the AI's hostility?
            3. Resolution Focus: Did they steer the conversation toward a professional conclusion or get dragged into arguments?
             4. Confidence & Language: Did they use assertive language or hedge/fill with vague qualifiers?
    """.replace("__VERDICT_VOCAB__", verdict_hint)


    messages = [
            {"role": "system", "content": grader_instruction},
            {"role": "user", "content": f"Here is the interview transcript to evaluate:\n\n{transcript}"}
        ]
    
    response = client.chat.completions.create(
            model = GROQ_MODEL_MAIN,
            messages = messages,
            temperature = TEMPERATURE_GRADER,
            response_format = {"type": "json_object"}
        )

    report = json.loads(response.choices[0].message.content)
    report["mood_timeline"] = session_data.get("mood_timeline", [])
    report["verdict_level"] = _verdict_level_for(report.get("verdict"), vocab)
    report["category"] = category

    if not isinstance(report.get("skills"), dict):
        report["skills"] = {
            "composure": report.get("confidence_score", 70),
            "structure": report.get("overall_score", 70),
            "evidence": 50,
            "empathy": 50,
            "decisiveness": 50
        }

    return report


def transcribe_audio_file(file_path: str) -> str:

    client = get_groq_client()

    with open(file_path, "rb") as file:
        transcription = client.audio.transcriptions.create(
            file = file,
            model = "whisper-large-v3",
            prompt = "Accurately transcribe spoken audio. Preserve all filler words like um, uh, and like exactly as spoken.",
            response_format = "text"
        )
    return transcription.text

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
    
    try:

        response = client.chat.completions.create(
                model=GROQ_MODEL_FAST,
                messages=[{"role": "system", "content": eval_prompt}],
                temperature=0.0,
                max_tokens=5
            )

        score_text = response.choices[0].message.content.strip()
        
        # DEBUG: Log what model actually returns
        print(f"[DEBUG] Mood shift raw response: '{score_text}'")
        
        # Handle empty response
        if not score_text:
            print("[DEBUG] Empty mood shift response, defaulting to 0")
            return 0
            
        # Extract first integer from response (handles "+1", " -2 ", "Score: 1", etc.)
        import re
        match = re.search(r'[-+]?\d+', score_text)
        if match:
            score = int(match.group())
            return max(MOOD_SHIFT_MIN, min(MOOD_SHIFT_MAX, score))
        
        print(f"[DEBUG] No integer found in mood shift response: '{score_text}'")
        return 0
        
    except Exception as e:
        print(f"Mood shift calculation failed: {e}")
        return 0

