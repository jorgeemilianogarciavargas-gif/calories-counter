@echo off
cd /d "%~dp0"
echo Abre esta carpeta en tu celular usando la IP de tu PC si estan en el mismo WiFi.
echo Si Windows pregunta por firewall, permite redes privadas.
python -m http.server 4190 --bind 0.0.0.0
