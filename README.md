# Mano Graffiti - LYNK & CO

Variante de la experiencia Laser Graffiti controlada con la mano. En lugar de usar un puntero laser, este proyecto detecta la punta del dedo indice con una camara y la convierte en movimiento del cursor para dibujar sobre la proyeccion.

La experiencia combina:

- Una app web React/Vite para mostrar la interfaz de dibujo, exportar el resultado y generar un QR de descarga.
- Un script Python con OpenCV + MediaPipe para detectar la mano/dedo indice y mover el mouse con `pyautogui`.
- Firebase Storage para subir el PNG final y obtener la liga que se convierte en QR.

## Flujo de la experiencia

```text
Proyector muestra la app web
Usuario mueve la mano frente a la camara
Python detecta la punta del dedo indice con MediaPipe
Python convierte esa posicion en movimiento de mouse
La app web dibuja sobre el canvas
Usuario finaliza el diseno
La app exporta un PNG
La app sube el PNG a Firebase
La app muestra un QR para descargar el resultado
```

## Partes del proyecto

- `src/App.jsx`: experiencia principal, canvas, botones por hover, exportacion, subida a Firebase y QR.
- `src/firebase.js`: configuracion de Firebase Storage.
- `python/laser_graffiti.py`: detector principal por mano/dedo indice.
- `python/GuiLaser.py`: version alternativa con GUI en PyQt5.
- `public/`: assets visuales de LYNK & CO, plantillas, botones y pantallas finales.

## Requisitos

Para la app web:

- Node.js
- npm
- Navegador en pantalla completa
- Proyector o segunda pantalla

Para deteccion de mano:

- Python 3
- Camara conectada
- OpenCV
- MediaPipe
- NumPy
- PyAutoGUI
- PyQt5 solo para `GuiLaser.py`

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

Vista previa:

```bash
npm run preview
```

## Ejecutar deteccion de mano

Entrar a la carpeta Python:

```bash
cd python
```

Instalar dependencias:

```bash
pip install opencv-python mediapipe numpy pyautogui
```

Ejecutar:

```bash
python laser_graffiti.py
```

## Calibracion

El script abre una ventana `Camera` con cuatro esquinas. Esas esquinas delimitan la zona de la proyeccion que se mapeara al cursor.

Pasos recomendados:

1. Abrir la app web en el proyector.
2. Ejecutar `python/laser_graffiti.py`.
3. Ajustar las cuatro esquinas en la ventana `Camera`.
4. Presionar el boton visual `Iniciar Touch`.
5. Mover el dedo indice dentro del area calibrada.
6. Ajustar offset o escala si el cursor no coincide con la posicion esperada.

Controles del script:

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
CAMERA_INDEX = 2
CAMERA_WIDTH = 1920
CAMERA_HEIGHT = 1080
CAMERA_FPS = 60
MAX_HANDS = 1
FINGERTIP_LANDMARK = 8
```

Si la camara no abre, cambiar `CAMERA_INDEX` a `0`, `1` u otro indice disponible.

`FINGERTIP_LANDMARK = 8` corresponde a la punta del dedo indice en MediaPipe Hands.

La app web usa una composicion interna:

```js
STAGE_WIDTH = 1920
STAGE_HEIGHT = 1536
```

## Firebase

Al finalizar un diseno, la app:

1. Genera el PNG final.
2. Lo sube a Firebase Storage.
3. Obtiene una URL de descarga.
4. Genera un QR para que el usuario abra su archivo desde el celular.

Ruta usada en Storage:

```text
Link&Co/<nombre-del-archivo>.png
```

Si falla la subida, revisar:

- `src/firebase.js`
- reglas del bucket de Firebase Storage
- conexion a internet
- permisos de lectura/escritura

## Notas de operacion

- La camara debe ver completa el area proyectada.
- La mano debe estar bien iluminada.
- Evitar fondos que dificulten la deteccion de MediaPipe.
- El cursor del sistema debe poder moverse sobre la pantalla donde esta la app.
- Correr la app en pantalla completa durante la activacion.
- Esta rama corresponde a la variante `Mano_Graffiti` del repositorio `Laser_Graffiti`.
