#!/usr/bin/env bash

# StudyMate AI - Launcher for macOS / Linux

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "        StudyMate AI - Your Personal AI Study Assistant"
echo "============================================================"
echo ""

# Check python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 is required. Please install Python 3.10+."
    exit 1
fi

# Check node
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is required. Please install Node.js 18+."
    exit 1
fi

# Backend Setup
echo "[1/4] Checking Python Virtual Environment..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    echo "[*] Creating venv in backend/venv..."
    python3 -m venv venv
fi

echo "[2/4] Verifying Backend Dependencies..."
source venv/bin/activate
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "[*] Creating .env from .env.example..."
    cp .env.example .env
fi

# Frontend Setup
echo "[3/4] Verifying Frontend Dependencies..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "[*] Installing frontend dependencies..."
    npm install
fi

echo ""
echo "[4/4] Starting Local Development Servers..."
echo "------------------------------------------------------------"
echo " Backend:   http://localhost:8000"
echo " API Docs:  http://localhost:8000/docs"
echo " Frontend:  http://localhost:5173"
echo "------------------------------------------------------------"
echo ""

# Run backend in background
cd "$PROJECT_ROOT/backend"
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Run frontend
cd "$PROJECT_ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

wait

