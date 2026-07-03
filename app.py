import os
import sys
import requests
import re
import math
import ast
import logging
import yaml
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
try:
    import docx
except ImportError:
    docx = None
    print("Warning: 'python-docx' not found. DOCX files will not be processed.")
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
    print("Warning: 'PyPDF2' not found. PDF files will not be processed.")
CONFIG_PATH = "config/config.yaml"
def load_config():
    if not os.path.exists(CONFIG_PATH):
        print(f"FATAL ERROR: Configuration file not found at '{CONFIG_PATH}'")
        sys.exit(1)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
CONFIG = load_config()
api_keys = CONFIG.get('api_keys', {})
log_config = CONFIG.get('logging', {})
GEMINI_API_KEY = api_keys.get('gemini_api_key')
OPENWEATHER_API_KEY = api_keys.get('weather_api_key')
SEARCH_API_KEY = api_keys.get('search_api_key')
SEARCH_ENGINE_ID = api_keys.get('search_engine_id')
LOG_FILE = log_config.get('file', 'logs/app.log')
LOG_LEVEL = log_config.get('level', 'INFO').upper()
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.FileHandler(LOG_FILE), logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("AI_Assistant_Server")
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
    if GEMINI_API_KEY and "YOUR_GEMINI" not in GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        chat_session = gemini_model.start_chat(history=[])
        logger.info("Gemini AI model initialized successfully with 'gemini-2.5-flash'.")
    else:
        chat_session = None
        logger.warning("Gemini API key not provided in config. General chat will be limited.")
except ImportError:
    GENAI_AVAILABLE = False
    chat_session = None
    logger.error("'google-generativeai' library not found. General chat is disabled.")
def extract_text_from_file(file):
    filename = file.filename.lower()
    text_content = ""
    try:
        if filename.endswith('.docx'):
            if docx is None:
                return "[Error: python-docx library is missing. Cannot read DOCX.]"
            doc = docx.Document(file)
            text_content = "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith('.txt'):
            text_content = file.read().decode('utf-8', errors='ignore')
        elif filename.endswith('.pdf'):
            if PyPDF2 is None:
                return "[Error: PyPDF2 library is missing. Cannot read PDF.]"
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_content += text + "\n"
        else:
            return "[Error: Unsupported file type. Only TXT, DOCX, and PDF are supported.]"
        if not text_content.strip():
            return "[File was empty]"
        return text_content
    except Exception as e:
        logger.error(f"File processing error: {e}")
        return f"[Error reading file: {str(e)}]"
def get_weather(city: str):
    if not OPENWEATHER_API_KEY or "YOUR_OPENWEATHER" in OPENWEATHER_API_KEY:
        return "Weather API key is not configured."
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric"
    try:
        res = requests.get(url, timeout=5).json()
        if res.get("cod") == 200:
            return f"The weather in {city.title()} is {res['weather'][0]['description']} at {res['main']['temp']}°C."
        else:
            return f"Could not find weather for '{city}'. Reason: {res.get('message', 'Unknown error')}."
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return "Sorry, I couldn't retrieve the weather."
def search_web(query: str):
    if not SEARCH_API_KEY or not SEARCH_ENGINE_ID:
        return "Search is not configured."
    try:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {'key': SEARCH_API_KEY, 'cx': SEARCH_ENGINE_ID, 'q': query}
        response = requests.get(url, params=params, timeout=5).json()
        items = response.get("items", [])
        if not items:
            return "No web results found."
        snippets = [f"- {item.get('title', '')}: {item.get('snippet', '')}" for item in items[:3]]
        return "\n".join(snippets)
    except Exception as e:
        logger.error(f"Web search error: {e}")
        return "Sorry, the web search failed."
def safe_eval(expr: str):
    ALLOWED_NAMES = {"pi": math.pi, "e": math.e, "sqrt": math.sqrt, "pow": pow, "log": math.log}
    try:
        node = ast.parse(expr, mode='eval')
        return str(eval(compile(node, "<string>", "eval"), {"__builtins__": {}}, ALLOWED_NAMES))
    except Exception as e:
        return f"Math Error: {e}"
def get_gemini_response(prompt):
    if not chat_session:
        return "AI chat is not available. Please configure the Gemini API key."
    try:
        system_prompt = (
            "You are a highly intelligent and helpful AI assistant. Your goal is to provide "
            "comprehensive, accurate, and well-structured answers. Use markdown formatting such as "
            "headings (using '#', '##', etc.), bullet points, numbered lists, and bold text to make "
            "information clear and easy to read. Always aim to be thorough."
        )
        full_prompt = f"{system_prompt}\n\n--- USER'S QUESTION ---\n{prompt}"
        return chat_session.send_message(full_prompt).text
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        return "An error occurred with the AI model. Please check the terminal for more details."
app = Flask(__name__, template_folder='.')
CORS(app)
@app.route('/')
def index():
    return render_template('chat_interface.html')
@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = ""
    file_context = ""
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        user_message = request.form.get('message', '').strip()
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                extracted_text = extract_text_from_file(file)
                file_context = f"\n\n--- CONTENT OF UPLOADED FILE ({file.filename}) ---\n{extracted_text}\n--- END OF FILE ---\n"
    else:
        data = request.json or {}
        user_message = data.get('message', '').strip()
    if not user_message and not file_context:
        return jsonify({'reply': 'Please enter a message or upload a file.'})
    full_input = user_message + file_context
    low_input = user_message.lower() 
    ai_reply = ""
    if "weather in" in low_input:
        city = low_input.split("weather in", 1)[-1].strip()
        ai_reply = get_weather(city)
    elif low_input.startswith("search"):
        query = user_message.split(maxsplit=1)[-1]
        ai_reply = search_web(query)
    elif re.match(r'^[\d\.\s\+\-\*\/\%\(\)\^]+$', low_input) and not file_context:
        ai_reply = safe_eval(low_input)
    else:
        ai_reply = get_gemini_response(full_input)
    return jsonify({'reply': ai_reply})
if __name__ == '__main__':
    print("--- Starting AI Assistant Web Server ---")
    print("Your AI is now running.")
    print("Open your web browser and go to: http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)