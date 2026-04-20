@echo off
start cmd /k "node server.js"
timeout /t 2
start cmd /k "npx serve . -p 3002"
pause
