import cv2
import numpy as np
import pyautogui

DEFAULT_TARGET_WIDTH = 1920
DEFAULT_TARGET_HEIGHT = 1080
TARGET_STEP = 20
MIN_TARGET_SIZE = 200
DISPLAY_OFFSET_X = -100
DISPLAY_OFFSET_Y = 0
OFFSET_STEP = 5
OFFSET_FINE_STEP = 1
SCALE_STEP = 0.01
SMOOTHING = 0.7
LOWER_GREEN = np.array([40, 35, 35])
UPPER_GREEN = np.array([95, 255, 255])
GREEN_DOMINANCE_OFFSET = 20
MIN_DETECTION_AREA = 80
MORPH_KERNEL = np.ones((5, 5), np.uint8)
CAMERA_INDEX = 1
CAMERA_WIDTH = 1920
CAMERA_HEIGHT = 1080
CAMERA_FPS = 60

cap = cv2.VideoCapture(CAMERA_INDEX)
if not cap.isOpened():
    print("No se puede abrir la camara")
    raise SystemExit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
cap.set(cv2.CAP_PROP_FPS, CAMERA_FPS)

pyautogui.FAILSAFE = False
arranque = False
corners = [(300, 100), (1600, 100), (1600, 900), (300, 900)]
dragging = False
current_corner = 0
button_x, button_y, button_w, button_h = 800, 960, 300, 50


def build_green_mask(image):
    blurred = cv2.GaussianBlur(image, (5, 5), 0)
    hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
    hsv_mask = cv2.inRange(hsv, LOWER_GREEN, UPPER_GREEN)

    b_channel, g_channel, r_channel = cv2.split(blurred)
    green_dominance = cv2.bitwise_and(
        cv2.compare(g_channel, cv2.add(r_channel, GREEN_DOMINANCE_OFFSET), cv2.CMP_GT),
        cv2.compare(g_channel, cv2.add(b_channel, GREEN_DOMINANCE_OFFSET), cv2.CMP_GT),
    )

    mask = cv2.bitwise_and(hsv_mask, green_dominance)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, MORPH_KERNEL, iterations=1)
    mask = cv2.dilate(mask, MORPH_KERNEL, iterations=2)
    return mask


def clamp_target_size(value):
    return max(MIN_TARGET_SIZE, value)


def clamp_point(value, limit):
    return max(0, min(limit - 1, value))


def clamp_scale(value):
    return max(0.2, min(3.0, value))


def draw_help_overlay(image, target_width, target_height, offset_x, offset_y, scale_x, scale_y):
    overlay_lines = [
        f"Salida: {target_width}x{target_height}",
        f"Offset puntero X/Y: {offset_x} / {offset_y}",
        f"Escala puntero X/Y: {scale_x:.2f} / {scale_y:.2f}",
        "A/D cambia ancho",
        "W/S cambia alto",
        "Flechas calibran el puntero",
        "J/L y I/K ajuste fino",
        "U/O escala X  Y/H escala Y",
        "R reinicia offset  P reinicia escala",
        "Q o ESC sale",
    ]
    for index, text in enumerate(overlay_lines):
        y = 35 + (index * 28)
        cv2.putText(image, text, (20, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 255, 2, cv2.LINE_AA)


def on_mouse(event, x, y, flags, param):
    global dragging, current_corner, arranque

    if event == cv2.EVENT_LBUTTONDOWN:
        for index, corner in enumerate(corners):
            if np.hypot(corner[0] - x, corner[1] - y) < 10:
                dragging = True
                current_corner = index
                break

        if button_x < x < button_x + button_w and button_y < y < button_y + button_h:
            print("El sistema Touch ha iniciado")
            arranque = True

    elif event == cv2.EVENT_LBUTTONUP:
        dragging = False

    elif event == cv2.EVENT_MOUSEMOVE and dragging:
        corners[current_corner] = (x, y)


cv2.namedWindow("Camera")
cv2.namedWindow("Verde detectado", cv2.WINDOW_NORMAL)
cv2.setMouseCallback("Camera", on_mouse)

target_width = DEFAULT_TARGET_WIDTH
target_height = DEFAULT_TARGET_HEIGHT
display_offset_x = DISPLAY_OFFSET_X
display_offset_y = DISPLAY_OFFSET_Y
prev_cx = None
prev_cy = None
screen_width, screen_height = pyautogui.size()
pointer_scale_x = 1.0
pointer_scale_y = 1.0

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        color_image = frame.copy()
        cv2.polylines(color_image, [np.array(corners)], isClosed=True, color=(255, 144, 30), thickness=2)

        npcorners = np.array(corners, dtype="float32")
        max_width = max(
            int(np.hypot(corners[2][0] - corners[3][0], corners[2][1] - corners[3][1])),
            int(np.hypot(corners[1][0] - corners[0][0], corners[1][1] - corners[0][1])),
        )
        max_height = max(
            int(np.hypot(corners[1][0] - corners[2][0], corners[1][1] - corners[2][1])),
            int(np.hypot(corners[0][0] - corners[3][0], corners[0][1] - corners[3][1])),
        )
        max_width = max(1, max_width)
        max_height = max(1, max_height)
        dst = np.array(
            [[0, 0], [max_width - 1, 0], [max_width - 1, max_height - 1], [0, max_height - 1]],
            dtype="float32",
        )

        cv2.putText(
            color_image,
            "Iniciar Touch",
            (button_x, button_y + 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.5,
            (255, 144, 30),
            2,
            cv2.LINE_AA,
        )
        cv2.rectangle(
            color_image,
            (button_x, button_y),
            (button_x + button_w, button_y + button_h),
            (255, 144, 30),
            2,
        )

        if arranque:
            perspective = cv2.getPerspectiveTransform(npcorners, dst)
            warped = cv2.warpPerspective(frame, perspective, (max_width, max_height))
            mask = build_green_mask(warped)
            output_mask = cv2.resize(mask, (target_width, target_height), interpolation=cv2.INTER_AREA)
            contours, _ = cv2.findContours(output_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            if contours:
                largest_contour = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest_contour) > MIN_DETECTION_AREA:
                    moments = cv2.moments(largest_contour)
                    if moments["m00"] != 0:
                        cx = int(moments["m10"] / moments["m00"])
                        cy = int(moments["m01"] / moments["m00"])

                        if prev_cx is None or prev_cy is None:
                            smooth_cx = cx
                            smooth_cy = cy
                        else:
                            smooth_cx = int(prev_cx + (cx - prev_cx) * SMOOTHING)
                            smooth_cy = int(prev_cy + (cy - prev_cy) * SMOOTHING)

                        mouse_x = int((smooth_cx * pointer_scale_x) + display_offset_x)
                        mouse_y = int((smooth_cy * pointer_scale_y) + display_offset_y)
                        mouse_x = clamp_point(mouse_x, screen_width)
                        mouse_y = clamp_point(mouse_y, screen_height)
                        pyautogui.moveTo(mouse_x, mouse_y)

                        prev_cx, prev_cy = smooth_cx, smooth_cy
                        cv2.drawContours(output_mask, [largest_contour], -1, (255, 255, 255), 2)
                        cv2.circle(output_mask, (smooth_cx, smooth_cy), 7, (255, 255, 255), -1)
                        preview_x = clamp_point(int((smooth_cx * pointer_scale_x) + display_offset_x), target_width)
                        preview_y = clamp_point(int((smooth_cy * pointer_scale_y) + display_offset_y), target_height)
                        cv2.circle(output_mask, (preview_x, preview_y), 9, 180, 2)
                        cv2.line(output_mask, (smooth_cx, smooth_cy), (preview_x, preview_y), 180, 1)

            draw_help_overlay(
                output_mask,
                target_width,
                target_height,
                display_offset_x,
                display_offset_y,
                pointer_scale_x,
                pointer_scale_y,
            )
            cv2.resizeWindow("Verde detectado", target_width, target_height)
            cv2.imshow("Verde detectado", output_mask)

        cv2.imshow("Camera", color_image)
        key = cv2.waitKeyEx(1)

        if key in (ord("a"), ord("A")):
            target_width = clamp_target_size(target_width - TARGET_STEP)
        elif key in (ord("d"), ord("D")):
            target_width = clamp_target_size(target_width + TARGET_STEP)
        elif key in (ord("w"), ord("W")):
            target_height = clamp_target_size(target_height + TARGET_STEP)
        elif key in (ord("s"), ord("S")):
            target_height = clamp_target_size(target_height - TARGET_STEP)
        elif key == 2424832:
            display_offset_x -= OFFSET_STEP
        elif key == 2555904:
            display_offset_x += OFFSET_STEP
        elif key == 2490368:
            display_offset_y -= OFFSET_STEP
        elif key == 2621440:
            display_offset_y += OFFSET_STEP
        elif key in (ord("j"), ord("J")):
            display_offset_x -= OFFSET_FINE_STEP
        elif key in (ord("l"), ord("L")):
            display_offset_x += OFFSET_FINE_STEP
        elif key in (ord("i"), ord("I")):
            display_offset_y -= OFFSET_FINE_STEP
        elif key in (ord("k"), ord("K")):
            display_offset_y += OFFSET_FINE_STEP
        elif key in (ord("r"), ord("R")):
            display_offset_x = DISPLAY_OFFSET_X
            display_offset_y = DISPLAY_OFFSET_Y
        elif key in (ord("u"), ord("U")):
            pointer_scale_x = clamp_scale(pointer_scale_x - SCALE_STEP)
        elif key in (ord("o"), ord("O")):
            pointer_scale_x = clamp_scale(pointer_scale_x + SCALE_STEP)
        elif key in (ord("y"), ord("Y")):
            pointer_scale_y = clamp_scale(pointer_scale_y - SCALE_STEP)
        elif key in (ord("h"), ord("H")):
            pointer_scale_y = clamp_scale(pointer_scale_y + SCALE_STEP)
        elif key in (ord("p"), ord("P")):
            pointer_scale_x = 1.0
            pointer_scale_y = 1.0
        elif key & 0xFF == ord("q") or key == 27:
            print(corners)
            break
finally:
    cap.release()
    cv2.destroyAllWindows()
