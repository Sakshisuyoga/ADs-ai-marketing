@echo off
setlocal enabledelayedexpansion

REM Root dir of the project
set ROOT=%~dp0
pushd "%ROOT%"

REM --- Backend ---
echo Starting Backend...

REM Check if backend node_modules exists
if not exist backend\node_modules (
  echo Installing backend dependencies...
  pushd backend
  call npm install
  popd
)

REM Check environment configuration and show API key status
echo Checking environment configuration...
echo.

REM Check if we can read the .env file and extract API key info
setlocal enabledelayedexpansion
set "CONFIGURED_KEYS=0"

REM Check for Google Gemini API Key
for /f "tokens=2 delims==" %%a in ('findstr /c:"GOOGLE_GEMINI_API_KEY=" backend\.env 2^>nul') do (
  set "GEMINI_KEY=%%a"
  set "GEMINI_PREFIX=!GEMINI_KEY:~0,5!"
  echo 🔑 Gemini API Key: !GEMINI_PREFIX!...
  set /a "CONFIGURED_KEYS+=1"
)

REM Check for ClipDrop API Key
for /f "tokens=2 delims==" %%a in ('findstr /c:"CLIPDROP_API_KEY=" backend\.env 2^>nul') do (
  set "CLIPDROP_KEY=%%a"
  set "CLIPDROP_PREFIX=!CLIPDROP_KEY:~0,5!"
  echo 🎨 ClipDrop API Key: !CLIPDROP_PREFIX!...
  set /a "CONFIGURED_KEYS+=1"
)

REM Check for Hugging Face API Token
for /f "tokens=2 delims==" %%a in ('findstr /c:"HUGGINGFACE_API_TOKEN=" backend\.env 2^>nul') do (
  set "HF_KEY=%%a"
  set "HF_PREFIX=!HF_KEY:~0,5!"
  echo 🤗 Hugging Face Token: !HF_PREFIX!...
  set /a "CONFIGURED_KEYS+=1"
)

REM Check for Unsplash API Key
for /f "tokens=2 delims==" %%a in ('findstr /c:"UNSPLASH_ACCESS_KEY=" backend\.env 2^>nul') do (
  set "UNSPLASH_KEY=%%a"
  set "UNSPLASH_PREFIX=!UNSPLASH_KEY:~0,5!"
  echo 📸 Unsplash API Key: !UNSPLASH_PREFIX!...
  set /a "CONFIGURED_KEYS+=1"
)

if !CONFIGURED_KEYS! gtr 0 (
  echo ✅ Environment configured correctly ^(!CONFIGURED_KEYS! API key^(s^) found^)
) else (
  echo ⚠️  No API keys found in backend\.env
  echo 💡 Please add at least GOOGLE_GEMINI_API_KEY to backend\.env
  echo 📍 Get Gemini key from: https://makersuite.google.com/app/apikey
)

echo.

REM Start Express backend on port 8000
start "Backend" cmd /c "cd backend && npm run dev"

REM --- Frontend ---
echo Starting Frontend...

REM Check if frontend node_modules exists
if not exist frontend\node_modules (
  echo Installing frontend dependencies...
  pushd frontend
  call npm install
  popd
)

REM Start frontend development server
start "Frontend" cmd /c "cd frontend && npm run dev"

REM --- Wait a moment for servers to start ---
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo 🚀 Development servers started!
echo ========================================
echo.
echo 🌐 Backend: http://127.0.0.1:8000
echo 🌐 Frontend: Check the terminal windows for the local URL (usually http://127.0.0.1:5173)
echo.
echo 📋 API Endpoints:
echo     • Authentication: /api/auth/*
echo     • Campaigns: /api/campaigns/*
echo     • AI Services: /api/ai/*
echo     • Files: /api/files/*
echo     • Users: /api/users/*
echo.
echo 💡 Tips:
echo     • Make sure to set your environment variables in backend/.env
echo     • For AI features, set GOOGLE_GEMINI_API_KEY in your .env file
echo     • Test API with: curl http://127.0.0.1:8000/api/ai/test
echo.
echo Press Ctrl+C in this window to stop all servers, or close individual windows to stop specific servers.
echo ========================================
echo.

REM Keep the launcher window open
pause >nul

popd
endlocal
