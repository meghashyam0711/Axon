import os, sys, re, math, ast, uuid, logging, sqlite3, json, random, string, time
from datetime import datetime
import io, hashlib
import yaml
import requests as http_requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
CONFIG_PATH = "config/config.yaml"
def load_config():
    if not os.path.exists(CONFIG_PATH):
        print(f"FATAL: Config file not found at '{CONFIG_PATH}'")
        sys.exit(1)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
CONFIG = load_config()
api_keys = CONFIG.get("api_keys", {})
GEMINI_API_KEY = api_keys.get("gemini_api_key", "")
ALL_GEMINI_KEYS = [v for k, v in api_keys.items() if k.startswith("gemini_api_key") and v and "YOUR_" not in v]
current_key_index = 0
if ALL_GEMINI_KEYS and GEMINI_API_KEY in ALL_GEMINI_KEYS:
    current_key_index = ALL_GEMINI_KEYS.index(GEMINI_API_KEY)
OPENWEATHER_API_KEY = api_keys.get("weather_api_key", "")
SEARCH_API_KEY = api_keys.get("search_api_key", "")
SEARCH_ENGINE_ID = api_keys.get("search_engine_id", "")
log_config = CONFIG.get("logging", {})
LOG_FILE = log_config.get("file", "logs/app.log")
LOG_LEVEL = log_config.get("level", "INFO").upper()
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
os.makedirs("data", exist_ok=True)
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("Axon_API")
chat_sessions = {}
gemini_models = {}
GENAI_AVAILABLE = False
DEFAULT_MODEL = "gemini-2.5-flash"
SUPPORTED_MODELS = [
    {"id": "gemini-2.5-flash",       "name": "Gemini 2.5 Flash",       "description": "Fast & efficient"},
    {"id": "gemini-2.5-pro",         "name": "Gemini 2.5 Pro",         "description": "Most capable thinking model"},
    {"id": "gemini-2.5-flash-lite",  "name": "Gemini 2.5 Flash Lite",  "description": "Lightweight 2.5 model"},
    {"id": "gemini-2.0-flash",       "name": "Gemini 2 Flash",         "description": "Balanced performance"},
    {"id": "gemini-2.0-flash-lite",  "name": "Gemini 2 Flash Lite",    "description": "Lightweight & quick"},
    {"id": "gemini-3-flash-preview",  "name": "Gemini 3 Flash",       "description": "Next-gen fast model"},
    {"id": "gemini-3-pro-preview",    "name": "Gemini 3 Pro",         "description": "Next-gen pro model"},
    {"id": "gemini-3.1-flash-lite-preview", "name": "Gemini 3.1 Flash Lite", "description": "Ultra-light 3.1 model"},
    {"id": "gemini-3.1-pro-preview",        "name": "Gemini 3.1 Pro",        "description": "Advanced 3.1 pro model"},
    {"id": "gemini-2.5-flash-preview-tts",        "name": "Gemini 3.1 Flash TTS",        "description": "Text-to-speech optimised"},
    {"id": "gemini-robotics-er-1.5-preview",      "name": "Gemini Robotics ER 1.6 Preview", "description": "Robotics & embodiment"},
    {"id": "gemini-2.5-computer-use-preview-10-2025", "name": "Computer Use Preview",     "description": "Autonomous computer control"},
    {"id": "deep-research-pro-preview-12-2025",   "name": "Deep Research Pro Preview",    "description": "Deep multi-step research"},
    {"id": "gemini-2.0-flash-001",   "name": "Gemini 2 (Search)",          "description": "Search grounding — Gemini 2"},
    {"id": "gemini-2.5-flash-image", "name": "Gemini 2.5 Flash Image",     "description": "Image generation model"},
    {"id": "gemini-3-pro-image-preview", "name": "Gemini 3 (Search)",      "description": "Search grounding — Gemini 3"},
    {"id": "gemini-3.1-flash-image-preview", "name": "Gemini 3.1 Flash Image", "description": "Next-gen image generation"},
    {"id": "gemma-3-1b-it",    "name": "Gemma 3 1B",  "description": "Compact on-device model"},
    {"id": "gemma-3-4b-it",    "name": "Gemma 3 4B",  "description": "Small but capable"},
    {"id": "gemma-3-12b-it",   "name": "Gemma 3 12B", "description": "Mid-size open model"},
    {"id": "gemma-3-27b-it",   "name": "Gemma 3 27B", "description": "Largest Gemma model"},
    {"id": "gemma-3n-e4b-it",  "name": "Gemma 3n E4B", "description": "Efficient nano 4B"},
    {"id": "gemma-3n-e2b-it",  "name": "Gemma 3n E2B", "description": "Efficient nano 2B"},
]
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
    if GEMINI_API_KEY and "YOUR_GEMINI" not in GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        for model_info in SUPPORTED_MODELS:
            try:
                gemini_models[model_info["id"]] = genai.GenerativeModel(model_info["id"])
                logger.info(f"[OK] Initialized model: {model_info['id']}")
            except Exception as e:
                logger.warning(f"[WARN] Could not initialize model '{model_info['id']}': {e}")
        if gemini_models:
            logger.info(f"[OK] {len(gemini_models)} models ready. Default: '{DEFAULT_MODEL}'")
        else:
            logger.error("[ERROR] No models initialized.")
    else:
        logger.warning("[WARN] Gemini API key not set.")
except ImportError:
    logger.error("[ERROR] google-generativeai not installed.")
SYSTEM_PROMPT = (
    "You are Axon, a highly intelligent and helpful AI assistant. "
    "Provide comprehensive, accurate, well-structured answers. "
    "Use markdown: headings (###), bold, bullet points, tables, code blocks. "
    "When providing code, always include a clear explanation section after the code. "
    "Be thorough but concise."
)
DB_PATH = CONFIG.get("database", {}).get("db_path", "data/assistant.db")
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
def init_db():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            avatar TEXT,
            provider TEXT DEFAULT 'email',
            verified INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            timestamp TEXT,
            model TEXT,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
        )
    """)
    conn.commit()
    conn.close()
    logger.info(f"[OK] Database initialized at '{DB_PATH}'")
init_db()
otp_store = {}       
auth_tokens = {}     
sessions_store = {}  
def generate_otp():
    return ''.join(random.choices(string.digits, k=6))
def create_auth_token(user_id: str) -> str:
    token = str(uuid.uuid4())
    auth_tokens[token] = user_id
    return token
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "")
    user_id = auth_tokens.get(token)
    if not user_id:
        return None
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None
def get_weather(city: str) -> dict:
    if not OPENWEATHER_API_KEY or "YOUR_" in OPENWEATHER_API_KEY:
        return {"error": "Weather API key not configured."}
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
    try:
        res = http_requests.get(url, timeout=5).json()
        if res.get("cod") == 200:
            return {
                "city": city.title(),
                "description": res["weather"][0]["description"].title(),
                "temp": res["main"]["temp"],
                "feels_like": res["main"]["feels_like"],
                "humidity": res["main"]["humidity"],
                "wind_speed": res["wind"]["speed"],
            }
        return {"error": f"City '{city}' not found."}
    except Exception as e:
        logger.error(f"Weather error: {e}")
        return {"error": "Failed to fetch weather."}
def search_web(query: str) -> list:
    if not SEARCH_API_KEY or not SEARCH_ENGINE_ID:
        return []
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {"key": SEARCH_API_KEY, "cx": SEARCH_ENGINE_ID, "q": query}
        resp = http_requests.get(url, params=params, timeout=5).json()
        items = resp.get("items", [])
        return [{"title": i.get("title",""), "snippet": i.get("snippet",""), "link": i.get("link","")} for i in items[:3]]
    except Exception as e:
        logger.error(f"Search error: {e}")
        return []
def safe_eval(expr: str) -> str:
    ALLOWED = {"pi": math.pi, "e": math.e, "sqrt": math.sqrt, "pow": pow, "log": math.log,
               "sin": math.sin, "cos": math.cos, "tan": math.tan, "abs": abs, "round": round}
    try:
        node = ast.parse(expr, mode="eval")
        return str(eval(compile(node, "<string>", "eval"), {"__builtins__": {}}, ALLOWED))
    except Exception as e:
        return f"Math Error: {e}"
def detect_intent(message: str) -> tuple:
    low = message.lower().strip()
    if "weather in" in low:
        return ("weather", low.split("weather in", 1)[-1].strip())
    if low.startswith(("search ", "google ", "look up ")):
        return ("search", message.split(maxsplit=1)[-1])
    if re.match(r'^[\d\.\s\+\-\*\/\%\(\)\^]+$', low):
        return ("math", low)
    return ("general", message)
def get_ai_response(session_id: str, prompt: str, model_id: str = None) -> tuple:
    global current_key_index
    used_model_id = model_id or DEFAULT_MODEL
    model = gemini_models.get(used_model_id) or gemini_models.get(DEFAULT_MODEL)
    if not model:
        return ("⚠️ AI is not available.", None)
    used_model_id = model_id if model_id in gemini_models else DEFAULT_MODEL
    session_key = f"{session_id}:{used_model_id}"
    if session_key not in chat_sessions:
        chat_sessions[session_key] = model.start_chat(history=[])
    current_time = datetime.now().strftime("%A, %B %d, %Y %I:%M %p")
    dynamic_prompt = f"{SYSTEM_PROMPT}\n\nCurrent System Time: {current_time}"
    full_prompt = f"{dynamic_prompt}\n\n--- USER ---\n{prompt}"
    for attempt in range(len(ALL_GEMINI_KEYS) if ALL_GEMINI_KEYS else 1):
        try:
            session = chat_sessions[session_key]
            response = session.send_message(full_prompt)
            return (response.text, used_model_id)
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
                logger.warning(f"Key limit crossed (model={used_model_id}): {e}")
                if ALL_GEMINI_KEYS:
                    current_key_index = (current_key_index + 1) % len(ALL_GEMINI_KEYS)
                    new_key = ALL_GEMINI_KEYS[current_key_index]
                    genai.configure(api_key=new_key)
                    logger.info(f"Switched Gemini API Key to backup (index {current_key_index}). Retrying...")
                    continue
            logger.error(f"Gemini error (model={used_model_id}): {e}")
            return (f"❌ AI Error: {str(e)}", used_model_id)
    return ("❌ AI Error: All API keys exhausted.", used_model_id)
def get_ai_response_stream(session_id: str, prompt: str, model_id: str = None):
    global current_key_index
    used_model_id = model_id or DEFAULT_MODEL
    model = gemini_models.get(used_model_id) or gemini_models.get(DEFAULT_MODEL)
    if not model:
        yield "⚠️ AI is not available."
        return
    used_model_id = model_id if model_id in gemini_models else DEFAULT_MODEL
    session_key = f"{session_id}:{used_model_id}"
    if session_key not in chat_sessions:
        chat_sessions[session_key] = model.start_chat(history=[])
    current_time = datetime.now().strftime("%A, %B %d, %Y %I:%M %p")
    dynamic_prompt = f"{SYSTEM_PROMPT}\n\nCurrent System Time: {current_time}"
    full_prompt = f"{dynamic_prompt}\n\n--- USER ---\n{prompt}"
    for attempt in range(len(ALL_GEMINI_KEYS) if ALL_GEMINI_KEYS else 1):
        try:
            session = chat_sessions[session_key]
            response = session.send_message(full_prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            return
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "exhausted" in err_str:
                logger.warning(f"Key limit crossed (model={used_model_id}): {e}")
                if ALL_GEMINI_KEYS:
                    current_key_index = (current_key_index + 1) % len(ALL_GEMINI_KEYS)
                    new_key = ALL_GEMINI_KEYS[current_key_index]
                    genai.configure(api_key=new_key)
                    logger.info(f"Switched Gemini API Key to backup (index {current_key_index}). Retrying...")
                    continue
            logger.error(f"Stream error (model={used_model_id}): {e}")
            yield f"❌ AI Error: {str(e)}"
            return
    yield "❌ AI Error: All API keys exhausted."
def save_session_to_db(session_id, user_id, title):
    conn = get_db()
    conn.execute(
        "INSERT OR IGNORE INTO chat_sessions (session_id, user_id, title, created_at) VALUES (?, ?, ?, ?)",
        (session_id, user_id, title, datetime.now().isoformat())
    )
    conn.commit()
    conn.close()
def save_message_to_db(session_id, role, content, model=None):
    conn = get_db()
    conn.execute(
        "INSERT INTO messages (session_id, role, content, timestamp, model) VALUES (?, ?, ?, ?, ?)",
        (session_id, role, content, datetime.now().isoformat(), model)
    )
    conn.commit()
    conn.close()
def get_user_sessions(user_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT session_id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
def get_session_messages(session_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT role, content, timestamp, model FROM messages WHERE session_id = ? ORDER BY id ASC",
        (session_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
app = FastAPI(title="AivoraX API", version="3.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    model_id: Optional[str] = None
class OTPRequest(BaseModel):
    email: str
class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    username: str
    provider: Optional[str] = "email"
class LoginRequest(BaseModel):
    email: str
    otp: str
class GoogleAuthRequest(BaseModel):
    credential: str  
@app.post("/auth/send-otp")
async def send_otp(req: OTPRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    code = generate_otp()
    otp_store[email] = {
        "code": code,
        "expires_at": time.time() + 600,  
        "attempts": 0,
    }
    logger.info(f"[OTP] Code for {email}: {code}")
    print(f"\n{'='*50}")
    print(f"  📧 OTP for {email}: {code}")
    print(f"{'='*50}\n")
    return {
        "message": f"Verification code sent to {email}",
        "email": email,
        "dev_code": code,
    }
@app.post("/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    email = req.email.strip().lower()
    otp_entry = otp_store.get(email)
    if not otp_entry:
        raise HTTPException(status_code=400, detail="No OTP was sent to this email. Request a new one.")
    if time.time() > otp_entry["expires_at"]:
        del otp_store[email]
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")
    otp_entry["attempts"] += 1
    if otp_entry["attempts"] > 5:
        del otp_store[email]
        raise HTTPException(status_code=429, detail="Too many attempts. Request a new OTP.")
    if req.otp != otp_entry["code"]:
        raise HTTPException(status_code=400, detail=f"Invalid code. {5 - otp_entry['attempts']} attempts remaining.")
    del otp_store[email]
    conn = get_db()
    existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        user = dict(existing)
        if req.username and req.username != user["username"]:
            conn.execute("UPDATE users SET username = ? WHERE id = ?", (req.username, user["id"]))
            conn.commit()
            user["username"] = req.username
    else:
        user_id = str(uuid.uuid4())
        username = req.username.strip() or email.split("@")[0]
        conn.execute(
            "INSERT INTO users (id, username, email, provider, verified, created_at) VALUES (?, ?, ?, ?, 1, ?)",
            (user_id, username, email, req.provider or "email", datetime.now().isoformat())
        )
        conn.commit()
        user = {"id": user_id, "username": username, "email": email, "provider": req.provider or "email", "avatar": None, "verified": 1}
    conn.close()
    token = create_auth_token(user["id"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar": user.get("avatar"),
            "provider": user.get("provider", "email"),
        },
    }
@app.get("/auth/me")
async def get_me(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "avatar": user.get("avatar"),
            "provider": user.get("provider"),
        }
    }
@app.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "")
        auth_tokens.pop(token, None)
    return {"status": "logged_out"}
@app.post("/auth/google")
async def auth_google(req: GoogleAuthRequest):
    try:
        import base64
        parts = req.credential.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid credential format.")
        payload_b64 = parts[1]
        payload_b64 += '=' * (4 - len(payload_b64) % 4)  
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        email = payload.get("email", "").lower().strip()
        name = payload.get("name", "")
        picture = payload.get("picture", "")
        google_sub = payload.get("sub", "")
        if not email:
            raise HTTPException(status_code=400, detail="No email in Google credential.")
        conn = get_db()
        existing = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            user = dict(existing)
            conn.execute(
                "UPDATE users SET username = ?, avatar = ?, provider = 'google', verified = 1 WHERE id = ?",
                (name or user["username"], picture or user.get("avatar"), user["id"])
            )
            conn.commit()
            user["username"] = name or user["username"]
            user["avatar"] = picture or user.get("avatar")
        else:
            user_id = f"google_{google_sub}"
            username = name or email.split("@")[0]
            conn.execute(
                "INSERT INTO users (id, username, email, avatar, provider, verified, created_at) VALUES (?, ?, ?, ?, 'google', 1, ?)",
                (user_id, username, email, picture, datetime.now().isoformat())
            )
            conn.commit()
            user = {"id": user_id, "username": username, "email": email, "avatar": picture, "provider": "google", "verified": 1}
        conn.close()
        token = create_auth_token(user["id"])
        logger.info(f"[AUTH] Google sign-in: {email}")
        return {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "avatar": user.get("avatar"),
                "provider": "google",
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail=f"Google authentication failed: {str(e)}")
@app.get("/auth/google-client-id")
async def get_google_client_id():
    client_id = CONFIG.get("api_keys", {}).get("google_client_id", "")
    return {"client_id": client_id}
@app.get("/")
async def root():
    return {"status": "ok", "name": "AivoraX API", "version": "3.0.0"}
@app.get("/models")
async def list_models():
    models = [{**m, "available": m["id"] in gemini_models} for m in SUPPORTED_MODELS]
    return {"models": models, "default": DEFAULT_MODEL}
@app.post("/chat")
async def chat(req: ChatRequest, authorization: Optional[str] = Header(None)):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    user = get_current_user(authorization)
    session_id = req.session_id or str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    model_id = req.model_id
    if session_id not in sessions_store:
        title = message[:40] + ("..." if len(message) > 40 else "")
        sessions_store[session_id] = {
            "title": title,
            "created_at": timestamp,
            "messages": [],
            "user_id": user["id"] if user else None,
        }
        if user:
            save_session_to_db(session_id, user["id"], title)
    intent, extracted = detect_intent(message)
    reply = ""
    response_data = None
    used_model = None
    if intent == "weather":
        weather = get_weather(extracted)
        if "error" in weather:
            reply = f"❌ {weather['error']}"
        else:
            response_data = weather
            reply = (
                f"### 🌤️ Weather in {weather['city']}\n\n"
                f"| Metric | Value |\n|--------|-------|\n"
                f"| **Temperature** | {weather['temp']}°C |\n"
                f"| **Feels Like** | {weather['feels_like']}°C |\n"
                f"| **Humidity** | {weather['humidity']}% |\n"
                f"| **Wind** | {weather['wind_speed']} m/s |"
            )
    elif intent == "search":
        results = search_web(extracted)
        if not results:
            reply = "🔍 No results found."
        else:
            response_data = {"results": results}
            parts = [f"**{i}. [{r['title']}]({r['link']})**\n> {r['snippet']}" for i, r in enumerate(results, 1)]
            reply = "### 🌐 Search Results\n\n" + "\n\n".join(parts)
    elif intent == "math":
        result = safe_eval(extracted)
        reply = f"**🧮 Result:** `{extracted}` = **{result}**"
    else:
        reply, used_model = get_ai_response(session_id, message, model_id)
    sessions_store[session_id]["messages"].append({"role": "user", "content": message, "timestamp": timestamp})
    sessions_store[session_id]["messages"].append({"role": "assistant", "content": reply, "timestamp": datetime.now().isoformat(), "model": used_model})
    if user:
        save_message_to_db(session_id, "user", message)
        save_message_to_db(session_id, "assistant", reply, used_model)
    return {
        "reply": reply,
        "intent": intent,
        "data": response_data,
        "session_id": session_id,
        "timestamp": timestamp,
        "model": used_model,
    }
@app.post("/chat/stream")
async def chat_stream(req: ChatRequest, authorization: Optional[str] = Header(None)):
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    user = get_current_user(authorization)
    session_id = req.session_id or str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    model_id = req.model_id
    if session_id not in sessions_store:
        title = message[:40] + ("..." if len(message) > 40 else "")
        sessions_store[session_id] = {
            "title": title, "created_at": timestamp, "messages": [],
            "user_id": user["id"] if user else None,
        }
        if user:
            save_session_to_db(session_id, user["id"], title)
    sessions_store[session_id]["messages"].append({"role": "user", "content": message, "timestamp": timestamp})
    if user:
        save_message_to_db(session_id, "user", message)
    async def event_generator():
        full_reply = []
        used_model = model_id or DEFAULT_MODEL
        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
        intent, extracted = detect_intent(message)
        agent_prompt = message
        if intent == "weather":
            weather = get_weather(extracted)
            if "error" in weather:
                agent_prompt = f"The user asked about the weather in '{extracted}', but the weather service returned an error: {weather['error']}. Apologize to the user."
            else:
                agent_prompt = f"The user asked for the weather in '{extracted}'. Here is the data: Temp: {weather['temp']}°C, Feels like: {weather['feels_like']}°C, Condition: {weather['description']}, Humidity: {weather['humidity']}%, Wind: {weather['wind_speed']} m/s. Write a friendly response summarizing this for the user."
        elif intent == "search":
            results = search_web(extracted)
            if not results:
                agent_prompt = f"The user asked to search for '{extracted}', but no web results were found. Apologize to the user."
            else:
                formatted_results = "\n\n".join([f"Source: {r['title']} ({r['link']})\nSnippet: {r['snippet']}" for r in results])
                agent_prompt = f"The user asked to search the web for '{extracted}'. Here are the top results from the web:\n\n{formatted_results}\n\nPlease summarize these results to answer the user's query comprehensively."
        elif intent == "math":
            result = safe_eval(extracted)
            agent_prompt = f"The user asked to calculate '{extracted}'. The exact mathematical result is {result}. Please provide the answer clearly."
        for chunk in get_ai_response_stream(session_id, agent_prompt, model_id):
            full_reply.append(chunk)
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
        complete_reply = "".join(full_reply)
        sessions_store[session_id]["messages"].append({
            "role": "assistant", "content": complete_reply,
            "timestamp": datetime.now().isoformat(), "model": used_model
        })
        if user:
            save_message_to_db(session_id, "assistant", complete_reply, used_model)
        yield f"data: {json.dumps({'type': 'done', 'model': used_model})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
@app.post("/session/new")
async def new_session():
    session_id = str(uuid.uuid4())
    sessions_store[session_id] = {"title": "New Chat", "created_at": datetime.now().isoformat(), "messages": []}
    return {"session_id": session_id}
@app.get("/history")
async def get_history(authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if user:
        db_sessions = get_user_sessions(user["id"])
        sessions = []
        for s in db_sessions:
            sessions.append({
                "session_id": s["session_id"],
                "title": s["title"],
                "created_at": s["created_at"],
                "message_count": len(get_session_messages(s["session_id"])),
            })
        return {"sessions": sessions}
    else:
        sessions = []
        for sid, data in sessions_store.items():
            sessions.append({
                "session_id": sid,
                "title": data["title"],
                "created_at": data["created_at"],
                "message_count": len(data["messages"]),
            })
        sessions.sort(key=lambda x: x["created_at"], reverse=True)
        return {"sessions": sessions}
@app.get("/history/{session_id}")
async def get_session(session_id: str, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if user:
        messages = get_session_messages(session_id)
        if messages:
            return {"session_id": session_id, "messages": messages}
    if session_id in sessions_store:
        return {"session_id": session_id, **sessions_store[session_id]}
    raise HTTPException(status_code=404, detail="Session not found.")
@app.delete("/session/{session_id}")
async def delete_session(session_id: str, authorization: Optional[str] = Header(None)):
    user = get_current_user(authorization)
    if user:
        conn = get_db()
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        conn.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
        conn.commit()
        conn.close()
    sessions_store.pop(session_id, None)
    keys_to_remove = [k for k in chat_sessions if k.startswith(session_id)]
    for k in keys_to_remove:
        del chat_sessions[k]
    return {"status": "deleted"}
@app.post("/upload")
async def upload_file(file: UploadFile = File(...), message: str = Form("")):
    filename = file.filename.lower()
    text_content = ""
    try:
        if filename.endswith(".txt"):
            content = await file.read()
            text_content = content.decode("utf-8", errors="ignore")
        elif filename.endswith(".pdf"):
            try:
                import PyPDF2
                content = await file.read()
                reader = PyPDF2.PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    t = page.extract_text()
                    if t: text_content += t + "\n"
            except ImportError:
                text_content = "[PyPDF2 not installed]"
        elif filename.endswith(".docx"):
            try:
                import docx
                content = await file.read()
                doc = docx.Document(io.BytesIO(content))
                text_content = "\n".join([p.text for p in doc.paragraphs])
            except ImportError:
                text_content = "[python-docx not installed]"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")
    user_prompt = message or "Summarize this document."
    full_prompt = f"{user_prompt}\n\n--- DOCUMENT: {file.filename} ---\n{text_content[:8000]}\n--- END ---"
    session_id = str(uuid.uuid4())
    reply, used_model = get_ai_response(session_id, full_prompt)
    return {"reply": reply, "filename": file.filename, "word_count": len(text_content.split()), "session_id": session_id, "model": used_model}
tts_cache = {}
@app.get("/tts")
async def text_to_speech(text: str = Query(..., min_length=1, max_length=5000), lang: str = Query("en")):
    clean = re.sub(r'[*_#`~]', '', text)
    clean = re.sub(r'\n+', '. ', clean).strip()
    if not clean:
        raise HTTPException(status_code=400, detail="No speakable text.")
    cache_key = hashlib.md5(f"{clean}:{lang}".encode()).hexdigest()
    if cache_key in tts_cache:
        return StreamingResponse(io.BytesIO(tts_cache[cache_key]), media_type="audio/mpeg")
    try:
        from gtts import gTTS
        tts = gTTS(text=clean[:3000], lang=lang, slow=False)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        audio = buf.read()
        if len(tts_cache) > 100:
            del tts_cache[next(iter(tts_cache))]
        tts_cache[cache_key] = audio
        return StreamingResponse(io.BytesIO(audio), media_type="audio/mpeg")
    except ImportError:
        raise HTTPException(status_code=500, detail="gTTS not installed.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS failed: {str(e)}")
@app.get("/tts/status")
async def tts_status():
    try:
        from gtts import gTTS
        return {"available": True}
    except ImportError:
        return {"available": False}
if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("  Axon — FastAPI Server v3.0")
    print(f"  Models: {', '.join(gemini_models.keys()) or 'None'}")
    print("  API:  http://127.0.0.1:8000")
    print("  Docs: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)