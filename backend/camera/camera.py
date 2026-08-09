import cv2
import time

def open_camera(camera_index=0):
    camera = cv2.VideoCapture(camera_index)

    if not camera.isOpened():
        raise RuntimeError("Could not Open Camera")

    return camera

def read_frame(camera):
    success, frame = camera.read()

    if not success:
        raise RuntimeError("failed to read frame")
    return frame

def release_camera(camera):
    camera.release()
    print("Camera released")