import sys
import cv2
import numpy as np
import pyautogui
from PyQt5.QtWidgets import QApplication, QMainWindow, QPushButton, QLabel
from PyQt5.QtCore import QTimer, Qt
from PyQt5.QtGui import QImage, QPixmap

LOWER_GREEN = np.array([40, 35, 35])
UPPER_GREEN = np.array([95, 255, 255])
GREEN_DOMINANCE_OFFSET = 20
MIN_DETECTION_AREA = 80
SMOOTHING = 0.7
MORPH_KERNEL = np.ones((5, 5), np.uint8)

class TouchSystemGUI(QMainWindow):
    def __init__(self):
        super().__init__()

        # Configuration variables
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            raise RuntimeError("Cannot open camera")

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        self.cap.set(cv2.CAP_PROP_FPS, 60)

        pyautogui.FAILSAFE = False
        self.corners = [(300, 100), (1600, 100), (1600, 900), (300, 900)]
        self.arranque = False
        self.prev_mouse_pos = None

        # GUI setup
        self.setWindowTitle("Powered By Mocion")
        self.setGeometry(100, 100, 800, 600)

        self.video_label = QLabel(self)
        self.video_label.setGeometry(0, 0, 800, 450)
        self.video_label.setMouseTracking(True)
        self.video_label.mousePressEvent = self.on_mouse_press
        self.video_label.mouseReleaseEvent = self.on_mouse_release
        self.video_label.mouseMoveEvent = self.on_mouse_move

        self.start_button = QPushButton("Iniciar Touch", self)
        self.start_button.setGeometry(350, 500, 100, 40)
        self.start_button.clicked.connect(self.start_touch_system)

        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(30)

        self.dragging = False
        self.current_corner = None

    def start_touch_system(self):
        self.arranque = True
        self.start_button.setEnabled(False)  # Disable the button once pressed
        print("El sistema Touch ha iniciado")

    def build_green_mask(self, image):
        blurred = cv2.GaussianBlur(image, (5, 5), 0)
        hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)
        hsv_mask = cv2.inRange(hsv, LOWER_GREEN, UPPER_GREEN)

        b, g, r = cv2.split(blurred)
        green_dominance = cv2.bitwise_and(
            cv2.compare(g, cv2.add(r, GREEN_DOMINANCE_OFFSET), cv2.CMP_GT),
            cv2.compare(g, cv2.add(b, GREEN_DOMINANCE_OFFSET), cv2.CMP_GT),
        )

        mask = cv2.bitwise_and(hsv_mask, green_dominance)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, MORPH_KERNEL, iterations=1)
        mask = cv2.dilate(mask, MORPH_KERNEL, iterations=2)
        return mask

    def update_frame(self):
        ret, frame = self.cap.read()
        if not ret:
            return

        if self.arranque:
            # Transform perspective when touch system is active
            np_corners = np.array(self.corners, dtype="float32")
            maxWidth = int(max(np.linalg.norm(np_corners[2] - np_corners[3]), np.linalg.norm(np_corners[1] - np_corners[0])))
            maxHeight = int(max(np.linalg.norm(np_corners[1] - np_corners[2]), np.linalg.norm(np_corners[0] - np_corners[3])))
            dst = np.array([[0, 0], [maxWidth - 1, 0], [maxWidth - 1, maxHeight - 1], [0, maxHeight - 1]], dtype="float32")

            M = cv2.getPerspectiveTransform(np_corners, dst)
            warped = cv2.warpPerspective(frame, M, (maxWidth, maxHeight))
            mask = self.build_green_mask(warped)
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            display_frame = warped.copy()

            if contours:
                largest_contour = max(contours, key=cv2.contourArea)
                area = cv2.contourArea(largest_contour)

                if area > MIN_DETECTION_AREA:
                    moments = cv2.moments(largest_contour)
                    if moments["m00"] != 0:
                        cX = int(moments["m10"] / moments["m00"])
                        cY = int(moments["m01"] / moments["m00"])

                        if self.prev_mouse_pos is None:
                            smooth_x, smooth_y = cX, cY
                        else:
                            prev_x, prev_y = self.prev_mouse_pos
                            smooth_x = int(prev_x + (cX - prev_x) * SMOOTHING)
                            smooth_y = int(prev_y + (cY - prev_y) * SMOOTHING)

                        pyautogui.moveTo(smooth_x, smooth_y)
                        self.prev_mouse_pos = (smooth_x, smooth_y)
                        cv2.drawContours(display_frame, [largest_contour], -1, (0, 255, 0), 2)
                        cv2.circle(display_frame, (smooth_x, smooth_y), 10, (255, 0, 0), -1)
        else:
            # Draw polygon and corners on the original frame
            for corner in self.corners:
                cv2.circle(frame, corner, 10, (0, 255, 0), -1)
            cv2.polylines(frame, [np.array(self.corners)], isClosed=True, color=(255, 144, 30), thickness=2)
            display_frame = frame
            self.prev_mouse_pos = None

        # Display the frame in the GUI
        display_frame = cv2.resize(display_frame, (800, 450))
        rgb_image = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_image.shape
        bytes_per_line = ch * w
        qt_image = QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format_RGB888)
        self.video_label.setPixmap(QPixmap.fromImage(qt_image))

    def on_mouse_press(self, event):
        if event.button() == Qt.LeftButton:
            pos = event.pos()
            for i, corner in enumerate(self.corners):
                if abs(corner[0] - pos.x() * 1920 / 800) < 15 and abs(corner[1] - pos.y() * 1080 / 450) < 15:
                    self.dragging = True
                    self.current_corner = i

    def on_mouse_release(self, event):
        if event.button() == Qt.LeftButton:
            self.dragging = False
            self.current_corner = None

    def on_mouse_move(self, event):
        if self.dragging and self.current_corner is not None:
            pos = event.pos()
            self.corners[self.current_corner] = (int(pos.x() * 1920 / 800), int(pos.y() * 1080 / 450))

    def closeEvent(self, event):
        self.timer.stop()
        self.cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = TouchSystemGUI()
    window.show()
    sys.exit(app.exec_())
