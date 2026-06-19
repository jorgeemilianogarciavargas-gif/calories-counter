# Calorias y Proteina

Contador sencillo de calorias y proteina con dos versiones:

- `outputs/calorias-proteina`: version Android/PWA instalable desde Chrome.
- `outputs/calorias-proteina-windows`: version Windows con Python/Tkinter.

## Android/PWA

Abre `outputs/calorias-proteina/index.html` o sirve la carpeta con:

```bash
python -m http.server 4174 --directory outputs/calorias-proteina
```

Luego visita:

```text
http://127.0.0.1:4174/index.html
```

En Android, usa la IP local de la computadora en vez de `127.0.0.1`.

## Windows

Abre:

```text
outputs/calorias-proteina-windows/abrir-windows.bat
```

Los datos se guardan en:

```text
%APPDATA%\CaloriasProteina
```
