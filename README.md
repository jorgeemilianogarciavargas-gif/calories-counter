# Calorias y Proteina

Contador sencillo de calorias y proteina con dos versiones:

- `outputs/calorias-proteina`: version Android/PWA instalable desde Chrome.
- `outputs/calorias-proteina-windows`: version Windows con Python/Tkinter.

## Movil / Android PWA

Abre `outputs/calorias-proteina/index.html` o sirve la carpeta con:

```bash
python -m http.server 4174 --directory outputs/calorias-proteina
```

Luego visita:

```text
http://127.0.0.1:4174/index.html
```

En Android, usa la IP local de la computadora en vez de `127.0.0.1`.

La interfaz movil tiene navegacion inferior con las pantallas Hoy, Agregar e Historial.
En Agregar puedes buscar un alimento y escribir gramos; la app rellena kcal/proteina por 100g con Open Food Facts cuando hay internet y usa una base local para alimentos comunes.
El Historial guarda los dias localmente en el navegador para revisar registros anteriores.

Tambien hay una copia lista para GitHub Pages en `docs/`. Cuando Pages este activo, la app se podra abrir desde:

```text
https://jorgeemilianogarciavargas-gif.github.io/calories-counter/
```

## Version movil personal

Tambien hay un HTML autocontenido para enviar directo al telefono:

```text
outputs/calorias-proteina-movil-personal/calorias-proteina-movil.html
```

Esa version no depende de GitHub Pages. Abrela con Chrome en Android.
Tambien conserva el historial local por dias en el navegador del telefono.

## Windows

Abre:

```text
outputs/calorias-proteina-windows/abrir-windows.bat
```

Los datos se guardan en:

```text
%APPDATA%\CaloriasProteina
```
