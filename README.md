#  Axon — Next-Gen Multi-Model AI Assistant

Axon is a premium, high-performance AI assistant platform featuring a robust **FastAPI backend** and a stunning **Vite-powered React frontend**. It supports the latest Gemini models, real-time streaming, persistent chat history, and advanced tool integrations like web search, weather, and mathematical computation.

---

## Features

-  **Multi-Model Support**: Integrated with Gemini 2.0, 2.5, 3.0, 3.1, and Gemma models.
-  **Real-Time Streaming**: Token-by-token response generation using SSE (Server-Sent Events).
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
- **AI SDK**: Google Generative AI
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
  gemini_api_key: "YOUR_GEMINI_API_KEY"
  weather_api_key: "YOUR_OPENWEATHER_API_KEY"
  search_api_key: "YOUR_GOOGLE_SEARCH_API_KEY"
  search_engine_id: "YOUR_SEARCH_ENGINE_ID"
  google_client_id: "YOUR_GOOGLE_CLIENT_ID"

database:
  db_path: "data/assistant.db"

logging:
  level: "INFO"
  file: "logs/app.log"
```

### 4. Run the Backend
```bash
python server.py
```
The API will be available at `http://localhost:8000`.

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

##  License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

##  Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements.

---

*Built with  by [MEGHA SHYAM]*
