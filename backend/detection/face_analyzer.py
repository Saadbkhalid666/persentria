import cv2
import mediapipe as mp

import config


def create_face_landmarker():
    """VIDEO-mode landmarker for the live webcam stream."""
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


def create_face_landmarker_image():
    """
    IMAGE-mode landmarker for standalone photos.

    Unlike VIDEO mode, IMAGE mode has no timestamp requirement and
    treats every call as a completely independent image - which is
    exactly what we need for gallery / batch uploads where each photo
    is unrelated to the previous one.
    """
    base_options = mp.tasks.BaseOptions(
        model_asset_path=config.FACE_LANDMARKER_MODEL_PATH
    )

    options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_faces=10,
        min_face_detection_confidence=0.5,
        min_face_presence_confidence=0.5,
        min_tracking_confidence=0.5
    )

    return mp.tasks.vision.FaceLandmarker.create_from_options(options)


def analyze_faces(landmarker, frame, timestamp_ms):
    """Analyze faces in a VIDEO-mode stream frame."""
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


def analyze_faces_image(landmarker, frame):
    """
    Analyze faces in a standalone image (IMAGE mode - no timestamp).

    Use this instead of analyze_faces() when reset_state=True so that
    each photo is processed in total isolation without any timestamp
    sequencing constraint.
    """
    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    result = landmarker.detect(
        mp_image
    )

    return result
