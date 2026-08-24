import spacy
from app.models import supabase
from flask import request, jsonify, g
import functools

nlp = spacy.load('en_core_web_sm')

def count_filler_words(text: str) -> dict:

    pure_fillers = {"um", "uh", "hmm"}
    tricky_fillers = {"like", "so", "basically", "literally"}

    found = {}
    total = 0

    doc = nlp(text.lower())

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

FILLER_WORDS = {"um", "uh", "hmm", "like", "so", "basically", "literally", "actually", "sort of", "kind of", "you know", "i mean", "i guess"}
HEDGING_WORDS = {"maybe", "perhaps", "possibly", "probably", "i think", "i feel", "might", "could be", "a bit", "a little", "somewhat", "almost"}
ASSERTIVE_WORDS = {"i believe", "i am confident", "certainly", "definitely", "absolutely", "undoubtedly", "without question", "clearly", "i know", "i am sure"}

def calculate_confidence(text: str) -> int:
    doc = nlp(text.lower())
    words = [token.text for token in doc if not token.is_punct and not token.is_space]
    total_words = len(words)
    if total_words == 0:
        return 50

    filler_count = sum(1 for token in doc if token.text.lower() in FILLER_WORDS)
    hedging_count = sum(1 for token in doc if token.text.lower() in HEDGING_WORDS)
    assertive_count = sum(1 for token in doc if token.text.lower() in ASSERTIVE_WORDS)

    filler_ratio = filler_count / total_words
    hedging_ratio = hedging_count / total_words
    assertive_ratio = assertive_count / total_words

    score = 70
    score -= filler_ratio * 300
    score -= hedging_ratio * 200
    score += assertive_ratio * 150
    return max(0, min(100, int(score)))

def verify_supabase_jwt(token: str):

    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return {
                "id": user_response.user.id,
                "email": user_response.user.email
            }
    except Exception as e:
        print(f"🔒 Auth Token Validation Failed: {e}")
    return None

def requires_auth(f):

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        
        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401
        
        try:
            token_type, token = auth_header.split(" ")
            if token_type.lower() != "bearer":
                return jsonify({"error": "Authorization header must start with Bearer"}), 401
        except ValueError:
            return jsonify({"error": "Malformed Authorization header format"}), 401
            
        user_context = verify_supabase_jwt(token)
        if not user_context:
            return jsonify({"error": "Invalid or expired security token"}), 401

        g.user_id = user_context["id"]
        g.user_email = user_context["email"]
        
        return f(*args, **kwargs)
    return decorated
