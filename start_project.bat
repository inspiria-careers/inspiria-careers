@echo off
setlocal EnableDelayedExpansion
title INSPIRIA CAREERS - Launcher
color 0B

:: Ensure script runs in the directory of this batch file
cd /d "%~dp0"

echo ===============================================================================
echo                 INSPIRIA CAREERS - e-COUNSELLING LAUNCHER
echo ===============================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 goto no_node

:: 2. Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 goto no_npm

echo [OK] Node.js version:
node -v
echo [OK] npm version:
call npm -v
echo.

:: 3. Check for .env.local configuration
if exist ".env.local" goto check_modules
if exist "env.local.txt" (
    echo [INFO] .env.local not found. Creating from env.local.txt...
    copy "env.local.txt" ".env.local" >nul
    echo [OK] .env.local created successfully.
    echo.
)

:check_modules
:: 4. Check if node_modules exists, otherwise install dependencies
if exist "node_modules\" goto start_server

echo [INFO] node_modules folder missing. Installing dependencies...
echo This may take a couple of minutes on first run. Please wait...
echo.
call npm install
if %errorlevel% neq 0 goto npm_install_failed
echo.
echo [OK] Dependencies installed successfully.
echo.

:start_server
echo ===============================================================================
echo Starting Next.js Development Server...
echo Portal URL: http://localhost:3000
echo Login / Admin: http://localhost:3000/login
echo.
echo Opening browser in 3 seconds...
echo Press Ctrl + C in this window to stop the server at any time.
echo ===============================================================================
echo.

:: Automatically open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Start dev server
call npm run dev

goto exit_script

:no_node
color 0C
echo [ERROR] Node.js is NOT installed or not in your system PATH.
echo Please install Node.js 18 or higher from: https://nodejs.org/
echo.
pause
exit /b 1

:no_npm
color 0C
echo [ERROR] npm is NOT installed or not in your system PATH.
echo.
pause
exit /b 1

:npm_install_failed
color 0C
echo [ERROR] npm install encountered an error. Please verify your internet connection.
echo.
pause
exit /b 1

:exit_script
echo.
echo Server stopped.
endlocal
exit /b 0
