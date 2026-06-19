@echo off
cd /d "%~dp0"
start "Calorias y Proteina" /min python -m http.server 4174 --bind 127.0.0.1 --directory "%~dp0"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:4174/index.html"
