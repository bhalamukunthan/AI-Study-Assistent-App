# StudyMate AI – Your Personal AI Study Assistant

> A modern, full-stack, AI-powered web application built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS**, **FastAPI**, **SQLite**, and the official **Google Gen AI SDK (Gemini API)**.

---

## 🌟 Overview & Key Features

StudyMate AI is designed like a SaaS platform for students and lifelong learners, offering six AI modules connected to an interactive learning analytics dashboard:

1. **AI Chat Tutor**:
   - Multi-turn conversational AI teacher specializing in Computer Science (Python, Java, C, C++, DSA, DBMS, OS, Networks), Mathematics, and Science.
   - Formats answers with beginner-friendly explanations, step-by-step points, and code syntax highlighting with one-click copying.
   - Preserves full conversation history with SQLite database persistence.
2. **Smart Quiz Generator**:
   - Generates interactive, topic-specific quizzes across customizable difficulty levels (Easy, Medium, Hard).
   - One-question-at-a-time interactive stepper with instantaneous score calculation and confetti celebrations.
   - Comprehensive answers breakdown showing your selected answer, correct answer, and in-depth AI explanations for why options are right or wrong.
3. **AI Study Plan Generator**:
   - Constructs personalized daily study schedules with topic breakdowns, study duration recommendations, practice sessions, revision checkpoints, and break intervals.
   - Visual timeline displaying task status with interactive completion checkboxes that persist state directly to the SQLite database.
4. **Notes Summarizer & Flashcard Creator**:
   - Supports pasted text and file uploads (`.txt`, `.pdf`, `.docx`) up to 15MB.
   - Multiple AI summarization modes: **Quick Executive Summary**, **Detailed Study Guide**, **Key Takeaways**, **Interactive 3D Flip Flashcards**, and **Practice Q&A**.
5. **AI Doubt Solver**:
   - Dedicated problem resolution tool for code bugs, mathematical formulas, and academic queries.
   - Delivers structured responses: problem overview, step-by-step resolution, core theoretical principles, and recommended next topics to practice.
6. **Progress Tracker & Interactive Study Timer**:
   - Comprehensive learning dashboard with **Recharts** visualizations (7-Day Study Hours Trend, Subject Distribution Pie Chart).
   - Live built-in **Stopwatch / Study Timer Modal** allowing students to track real-time study sessions and log them directly into SQLite.
7. **SaaS Dashboard & Theme Support**:
   - Modern indigo/purple SaaS aesthetic, responsive for mobile, tablet, and desktop.
   - Full Light mode and Dark mode toggling with persistent user preference.
   - Toast notifications for user feedback and empty states.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React, React Router v7, Axios, Recharts, Canvas-Confetti |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, SQLite, Pydantic v2, Python-Multipart |
| **AI SDK** | Official Google Gen AI SDK (`google-genai`), Gemini 2.5 Flash |
| **Document Processing** | `pypdf`, `python-docx` for secure, in-memory parsing of PDF and DOCX files |

---

## 🚀 Quick Start (Development)

### Option 1: Automatic Launch (Windows)

Double-click or run from terminal:
```cmd
start.bat
```
This script will:
1. Verify Python and Node.js environments.
2. Create and activate the Python virtual environment in `backend/venv`.
3. Install any missing Python dependencies.
4. Install frontend npm dependencies if needed.
5. Launch the FastAPI backend on `http://localhost:8000`.
6. Launch the Vite frontend on `http://localhost:5173`.
7. Automatically open your default web browser to the application.

### Option 2: Automatic Launch (macOS / Linux)

```bash
chmod +x start.sh
./start.sh
```

---

### Option 3: Manual Startup

#### 1. Backend Server
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your Gemini API Key
copy .env.example .env   # (or cp .env.example .env on Linux/macOS)

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will be live at:
- **API Server:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Endpoint:** `http://localhost:8000/api/health`

#### 2. Frontend Development Server
In a separate terminal:
```bash
cd frontend

# Install packages
npm install

# Run Vite dev server
npm run dev
```
The frontend will be live at:
- **Application URL:** `http://localhost:5173`

---

## 🔑 Configuring Your Google Gemini API Key

1. Obtain a free API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open `backend/.env`.
3. Replace the placeholder with your key:
   ```env
   GEMINI_API_KEY=AIzaSy...YourKeyHere
   GEMINI_MODEL=gemini-2.5-flash
   ```
4. Save the file.
5. *Note:* If the API key is not configured, StudyMate AI gracefully communicates this status across the UI (status indicator in navbar and settings page) and protects endpoints from failure without crashing.

---

## 📁 Project Structure

```
studymate-ai/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py          # Settings, CORS, uploads, env loading
│   │   ├── database/
│   │   │   └── session.py         # SQLAlchemy engine & sessionmaker
│   │   ├── models/                # SQLAlchemy database models
│   │   │   ├── user.py            # Student profile model
│   │   │   ├── chat.py            # Conversation & Message models
│   │   │   ├── quiz.py            # Quiz, Questions & Results models
│   │   │   ├── study_plan.py      # StudyPlan & StudyTask models
│   │   │   ├── study_session.py   # StudySession model
│   │   │   ├── note.py            # Note & Flashcards models
│   │   │   └── doubt.py           # Doubt solution model
│   │   ├── schemas/               # Pydantic validation schemas
│   │   │   ├── user.py
│   │   │   ├── chat.py
│   │   │   ├── quiz.py
│   │   │   ├── study_plan.py
│   │   │   ├── note.py
│   │   │   ├── doubt.py
│   │   │   ├── session.py
│   │   │   └── analytics.py
│   │   ├── services/
│   │   │   ├── ai_service.py      # Google Gen AI SDK integration & prompts
│   │   │   └── document_service.py# PDF & DOCX text extraction
│   │   ├── routes/                # REST API endpoints
│   │   │   ├── health.py          # /api/health
│   │   │   ├── user.py            # /api/user/profile
│   │   │   ├── chat.py            # /api/chat/*
│   │   │   ├── quiz.py            # /api/quiz/*
│   │   │   ├── study_plan.py      # /api/study-plans/*, /api/study-tasks/*
│   │   │   ├── notes.py           # /api/notes/*
│   │   │   ├── doubt.py           # /api/doubt/*
│   │   │   ├── sessions.py        # /api/sessions/*
│   │   │   └── analytics.py       # /api/analytics/*
│   │   └── main.py                # FastAPI app initialization & DB seed
│   ├── uploads/                   # Secure temporary upload directory
│   ├── main.py                    # Root entrypoint
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Environment variables template
│   └── studymate.db               # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # CodeBlock, StudyTimerModal, Skeleton, EmptyState
│   │   │   └── layout/            # Sidebar, Navbar, Layout
│   │   ├── context/               # ThemeContext, ToastContext, UserContext
│   │   ├── pages/                 # Dashboard, ChatTutor, QuizGenerator, etc.
│   │   ├── services/              # Axios API client & endpoints
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── App.tsx                # React Router setup
│   │   ├── index.css              # Tailwind CSS styling & animations
│   │   └── main.tsx               # React DOM entrypoint
│   ├── index.html                 # HTML template
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   └── vite.config.ts             # Vite configuration with Tailwind plugin
├── start.bat                      # Windows one-click startup script
├── start.sh                       # macOS/Linux one-click startup script
├── .gitignore
└── README.md
```

---

## 🔒 Security & Best Practices

- **Zero Client-Side Keys**: The Gemini API key is accessed exclusively on the FastAPI backend from `.env`. Frontend code never accesses or stores secrets.
- **Document Safety**: Uploaded files (`.txt`, `.pdf`, `.docx`) are parsed in-memory using strict file extension and size validation (maximum 15MB). Uploaded files are never executed.
- **Input Validation**: All API requests and responses are strictly validated using Pydantic schemas.
- **CORS Configured**: Cross-Origin Resource Sharing is set up for local development across all standard dev ports.

