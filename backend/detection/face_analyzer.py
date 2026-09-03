import cv2
import mediapipe as mp

import config


def create_face_landmarker():
    base_options = mp.tasks.BaseOptions(
        model_asset_path=config.FACE_LANDMARKER_MODEL_PATH
    )

    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_faces=10,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )

    return mp.tasks.vision.FaceLandmarker.create_from_options(options)


def analyze_faces(landmarker, frame, timestamp_ms):
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    result = landmarker.detect_for_video(
        mp_image,
        timestamp_ms
    )

    return result
