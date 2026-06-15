# Laser Graffiti - LYNK & CO

Experiencia interactiva de laser graffiti para activacion de marca. El sistema permite dibujar sobre una proyeccion usando un puntero laser como si fuera el mouse.

La experiencia combina:

- Una app web en React/Vite para mostrar la interfaz, dibujar sobre canvas, exportar el resultado y generar QR.
- Un script Python con OpenCV para detectar el puntero laser desde una camara y mover el cursor del sistema con `pyautogui`.
- Firebase Storage para subir el PNG final y entregar un enlace de descarga al usuario mediante QR.

## Flujo de la experiencia

```text
Proyector muestra la app web
Usuario apunta con laser a la proyeccion
Camara detecta el punto del laser
Python convierte la posicion detectada en movimiento de mouse
La app web dibuja sobre el canvas
Usuario finaliza el diseno
La app exporta un PNG
La app sube el PNG a Firebase
La app muestra un QR para descargar el resultado
```

## Partes del proyecto

- `src/App.jsx`: experiencia principal, canvas, pantallas, botones por hover, exportacion de imagen y QR.
- `src/firebase.js`: configuracion de Firebase Storage.
- `python/laser_graffiti.py`: deteccion principal del laser/camara y control del mouse.
- `python/GuiLaser.py`: version alternativa con interfaz PyQt5 para calibracion/control.
- `public/`: assets visuales de la experiencia, botones, logos, plantillas y pantallas finales.

## Requisitos

Para la app web:

- Node.js
- npm
- Navegador en modo pantalla completa
- Proyector o segunda pantalla

Para el detector laser:

- Python 3
- Camara conectada
- OpenCV
- NumPy
- PyAutoGUI
- PyQt5, solo si se usa `GuiLaser.py`

## Ejecutar la app web

Instalar dependencias:

```bash
npm install
```

Ejecutar en desarrollo:

```bash
npm run dev
```

Abrir:

```text
http://localhost:5173
```

Generar build:

```bash
npm run build
```

Vista previa del build:

```bash
npm run preview
```

## Ejecutar deteccion de laser

Entrar a la carpeta Python:

```bash
cd python
```

Instalar dependencias:

```bash
pip install opencv-python numpy pyautogui
```

Ejecutar detector principal:

```bash
python laser_graffiti.py
```

Para usar la version con GUI:

```bash
pip install PyQt5
python GuiLaser.py
```

## Calibracion

El script `python/laser_graffiti.py` abre una ventana de camara con cuatro esquinas. Esas esquinas delimitan la zona de la proyeccion que debe mapearse al movimiento del mouse.

Pasos recomendados:

1. Abrir la app web en el proyector.
2. Ejecutar `python/laser_graffiti.py`.
3. Ajustar las cuatro esquinas en la ventana `Camera`.
4. Presionar el boton visual `Iniciar Touch` dentro de la ventana de camara.
5. Probar el laser sobre la proyeccion.
6. Ajustar offset, escala o tamano si el cursor no coincide con el punto proyectado.

Controles del script principal:

- `A/D`: reducir/aumentar ancho de salida.
- `W/S`: aumentar/reducir alto de salida.
- Flechas: ajustar offset del puntero.
- `J/L`: ajuste fino en X.
- `I/K`: ajuste fino en Y.
- `U/O`: ajustar escala X.
- `Y/H`: ajustar escala Y.
- `R`: reiniciar offset.
- `P`: reiniciar escala.
- `Q` o `ESC`: salir.

## Configuracion importante

En `python/laser_graffiti.py`:

```python
CAMERA_INDEX = 1
CAMERA_WIDTH = 1920
CAMERA_HEIGHT = 1080
CAMERA_FPS = 60
```

Si la camara no abre, cambiar `CAMERA_INDEX` a `0` u otro indice disponible.

La app web usa una composicion interna de:

```js
STAGE_WIDTH = 1920
STAGE_HEIGHT = 1536
```

Por eso la proyeccion y la calibracion deben revisarse en sitio para que el movimiento del laser coincida con el canvas.

## Firebase

Al finalizar un diseno, la app:

1. Genera un PNG local.
2. Lo sube a Firebase Storage.
3. Obtiene una URL publica/de descarga.
4. Genera un QR para que el usuario abra el archivo desde su celular.

La ruta usada en Storage es:

```text
Link&Co/<nombre-del-archivo>.png
```

Si falla la subida, revisar:

- Configuracion de `src/firebase.js`.
- Reglas del bucket de Firebase Storage.
- Conexion a internet.
- Permisos de escritura/lectura.

## Notas de operacion

- Usar un muro o superficie de proyeccion con suficiente contraste.
- Evitar reflejos fuertes que puedan confundirse con el laser.
- El detector actual busca principalmente un punto verde intenso.
- La camara debe ver toda el area proyectada.
- El cursor del sistema debe poder moverse sobre la pantalla donde esta la app.
- Se recomienda correr la app en pantalla completa durante el evento.

## Tecnologias

- React
- Vite
- Tailwind CSS
- Firebase Storage
- QRCode
- Python
- OpenCV
- NumPy
- PyAutoGUI
- PyQt5
