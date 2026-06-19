@echo off
REM AI Kids Buddy - Backend Startup Script (Batch)
REM Usage: scripts\run_alpha.bat [port] [--reload]

setlocal enabledelayedexpansion

set PORT=8000
set HOST=0.0.0.0
set RELOAD=

REM Parse arguments
:parse_args
if "%~1"=="" goto :start
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--reload" (
    set RELOAD=--reload
    shift
    goto :parse_args
)
if "%~1"=="--help" (
    goto :help
)
REM First positional arg is port
set PORT=%~1
shift
goto :parse_args

:help
echo AI Kids Buddy - Backend Server
echo Usage: scripts\run_alpha.bat [port] [--reload] [--help]
echo.
echo Options:
echo   port       Server port ^(default: 8000^)
echo   --reload   Enable auto-reload for development
exit /b 0

:start
REM Navigate to project root
pushd "%~dp0\.."

set "PROJECT_ROOT=%CD%"

REM Colors via ANSI (Windows 10+)
echo ========================================
echo   AI Kids Buddy - full_speed_alpha_plus
echo ========================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    popd
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYVER=%%i
echo [OK] Python found: %PYVER%

REM Check dependencies
echo [INFO] Checking dependencies...
if exist requirements.txt (
    pip install -r requirements.txt --quiet >nul 2>&1
    echo [OK] Dependencies installed
) else (
    echo [WARN] No requirements.txt found
)

REM Check .env
if not exist .env (
    echo [WARN] No .env file found. Using defaults.
) else (
    echo [OK] .env file found
)

echo.
echo Starting server on http://%HOST%:%PORT%
echo Health check: http://localhost:%PORT%/health
echo API docs: http://localhost:%PORT%/docs
echo Press Ctrl+C to stop
echo.

REM Start uvicorn
python -m uvicorn backend.main:app --host %HOST% --port %PORT% %RELOAD%

popd
endlocal