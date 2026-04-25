@echo off
echo ============================================
echo   MediCare Hospital Appointment System
echo ============================================
echo.
echo Starting local server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

:: Try to open browser
start "" http://localhost:3000

:: Try py launcher first (Windows default), then python, then python3
py -m http.server 3000 2>nul
if %errorlevel% neq 0 (
    python -m http.server 3000 2>nul
    if %errorlevel% neq 0 (
        python3 -m http.server 3000 2>nul
        if %errorlevel% neq 0 (
            echo.
            echo ERROR: Python is not installed or not in PATH.
            echo Please install Python from https://www.python.org/downloads/
            echo.
            pause
        )
    )
)
pause
