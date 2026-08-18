@echo off
setlocal enabledelayedexpansion
title Next.js HTTPS Dev Server

echo =======================================================
echo  Searching for Active Local IPv4 Address...
echo =======================================================

set "IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set "TEMP_IP=%%a"
    set "TEMP_IP=!TEMP_IP: =!"
    if not "!TEMP_IP!"=="127.0.0.1" (
        if not defined IP set "IP=!TEMP_IP!"
    )
)

if not defined IP set "IP=localhost"

echo.
echo =======================================================
echo  Starting Next.js Server (HTTPS)
echo =======================================================
echo  Network:  https://%IP%:3000/dashboard
echo =======================================================
echo.

npx next dev --experimental-https -H 0.0.0.0 -p 3000
pause