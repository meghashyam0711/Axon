#  Axon — Next-Gen Multi-Model AI Assistant

Axon is a premium, high-performance AI assistant platform featuring a robust **FastAPI backend** and a stunning **Vite-powered React frontend**. It supports running local models (like **Qwen 2.5**) via Ollama/LM Studio as well as cloud-based model integration with **Gemini 2.5 Flash**, offering real-time streaming, persistent chat history, and advanced tool integrations like web search, weather, and mathematical computation.

---

## Features

-  **Local & Cloud Multi-Model Support**: Switch seamlessly between local models (e.g. Qwen 2.5) and cloud models (e.g. Gemini 2.5 Flash) directly from the UI dropdown.
-  **Real-Time Streaming**: Token-by-token response generation using SSE (Server-Sent Events) for both local and cloud models.
-  **Secure Authentication**: Email OTP and Google OneTap sign-in.
-  **File Processing**: Support for `.txt`, `.docx`, and `.pdf` document analysis.
-  **Smart Tools**:
  -  **Web Search**: Real-time Google Search grounding.
  -  **Weather**: Live weather updates via OpenWeatherMap.
  -  **Safe Math**: Secure mathematical expression evaluation.
-  **Persistent History**: SQLite-backed chat history with session management.
-  **Dynamic UI**: Modern, glassmorphic interface with support for animations and responsive layouts.

---

##  Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI SDK**: Google Generative AI & OpenAI-compatible Local API (Ollama / LM Studio)
- **Database**: SQLite
- **Security**: JWT-based Auth, UUID session tracking

### Frontend
- **Framework**: Vite + React
- **Styling**: Vanilla CSS (Premium Glassmorphism)
- **State Management**: React Context API
- **Animations**: Framer Motion / CSS Transitions

---

##  Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/Axon.git
cd Axon
```

### 2. Backend Setup
Create a virtual environment and install dependencies:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 3. Configuration 
**Important**: The `config/config.yaml` file is ignored by Git for security. You must create it manually.

Create a folder named `config` and a file named `config.yaml` inside it:
```yaml
api_keys:
  gemini_api_key: "YOUR_GEMINI_API_KEY"      # Required for Gemini 2.5 Cloud model
  weather_api_key: "YOUR_OPENWEATHER_API_KEY"
  search_api_key: "YOUR_GOOGLE_SEARCH_API_KEY"
  search_engine_id: "YOUR_SEARCH_ENGINE_ID"
  google_client_id: "YOUR_GOOGLE_CLIENT_ID"

database:
  db_path: "data/assistant.db"

logging:
  level: "INFO"
  file: "logs/app.log"

voice:
  tts_rate: 200
  tts_voice: 0

local_model:
  enabled: true
  url: "http://localhost:11434/v1"
  model_name: "qwen2.5:1.5b-instruct-q4_K_M"
```

### 4. Local Model Setup (Optional)

If using a local model, make sure you have your local runner (e.g. Ollama) running:
1. Download and install [Ollama](https://ollama.com).
2. Pull and run the local Qwen model:
   ```bash
   ollama run qwen2.5:1.5b-instruct-q4_K_M
   ```
3. Ensure the `local_model` section in your `config.yaml` points to the correct runner URL and model name.

### 5. Run the Backend
```bash
python server.py
```
The API will be available at `http://localhost:8000`.

### 6. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment & Setup for the Web

If you are planning to deploy Axon to a public cloud platform (like Render, AWS, Heroku, or Vercel):

### 1. Cloud Models (Gemini)
- **Zero Setup Needed**: The cloud-based **Gemini 2.5 Flash** model will work out-of-the-box in production as long as your `gemini_api_key` is set inside `config/config.yaml`.

### 2. Local Models (Qwen)
- **By Default**: Local models expect Ollama to run on `http://localhost:11434` (the host server's local address).
- **GPU Server Hosting**: If deploying to a host machine with a GPU, you can download and run Ollama directly on that host.
- **Remote Endpoint**: If hosting the backend on a server without a GPU, change the `url` parameter under `local_model` in `config/config.yaml` to point to a remote OpenAI-compatible host endpoint (e.g. RunPod, DeepSeek, or a custom GPU server).

---

##  License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements.

---

*Built with  by [MEGHA SHYAM]*
