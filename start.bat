@echo off
setlocal enabledelayedexpansion

title StudyMate AI - Launcher

echo ============================================================
echo         StudyMate AI - Your Personal AI Study Assistant
echo ============================================================
echo.

:: Get root directory of project
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: 1. Verify Python Installation
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please install Python 3.10+ from python.org and add it to your PATH.
    pause
    exit /b 1
)

:: 2. Verify Node.js / NPM Installation
call npm.cmd -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js / npm is not found in PATH!
    echo Please install Node.js 18+ from nodejs.org.
    pause
    exit /b 1
)

:: 3. Backend Setup
echo [1/4] Checking Python Virtual Environment...
cd /d "%PROJECT_ROOT%backend"

if not exist "venv\Scripts\python.exe" (
    echo [*] Creating virtual environment in backend\venv...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo [2/4] Verifying Backend Dependencies...
call venv\Scripts\activate.bat
python -c "import fastapi, uvicorn, sqlalchemy, google.genai" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [*] Installing required Python packages...
    python -m pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
)

:: Check if .env exists
if not exist ".env" (
    echo [*] Creating backend\.env from .env.example...
    copy .env.example .env >nul
    echo [!] Remember to configure your GEMINI_API_KEY in backend\.env
)

:: 4. Frontend Setup
echo [3/4] Verifying Frontend Dependencies...
cd /d "%PROJECT_ROOT%frontend"

if not exist "node_modules" (
    echo [*] Installing frontend packages via npm...
    call npm.cmd install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)

:: 5. Launch Servers
echo.
echo [4/4] Starting Local Development Servers...
echo ------------------------------------------------------------
echo  Backend:   http://localhost:8000
echo  API Docs:  http://localhost:8000/docs
echo  Frontend:  http://localhost:5173
echo ------------------------------------------------------------
echo.

:: Start FastAPI Backend in new window
cd /d "%PROJECT_ROOT%backend"
start "StudyMate AI - Backend Server (Port 8000)" cmd /k "venv\Scripts\activate.bat && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: Give backend 2 seconds to initialize
timeout /t 2 /nobreak >nul

:: Start Vite Frontend in new window
cd /d "%PROJECT_ROOT%frontend"
start "StudyMate AI - Frontend Server (Port 5173)" cmd /k "npm.cmd run dev"

:: Open default browser
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo StudyMate AI is now running! Keep this window open or press any key to close launcher.
pause

