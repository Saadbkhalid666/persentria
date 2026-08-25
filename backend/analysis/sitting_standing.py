import os
import math
import cv2

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "models",
    "pose_landmarker.task"
)


def create_pose_landmarker():
    base_options = python.BaseOptions(
        model_asset_path=MODEL_PATH
    )

    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_poses=10
    )

    return vision.PoseLandmarker.create_from_options(options)


def calculate_angle(a, b, c):
    """
    Calculate angle ABC.
    """

    ba = (
        a.x - b.x,
        a.y - b.y
    )

    bc = (
        c.x - b.x,
        c.y - b.y
    )

    dot_product = (
        ba[0] * bc[0] +
        ba[1] * bc[1]
    )

    magnitude_ba = math.sqrt(
        ba[0] ** 2 +
        ba[1] ** 2
    )

    magnitude_bc = math.sqrt(
        bc[0] ** 2 +
        bc[1] ** 2
    )

    if magnitude_ba == 0 or magnitude_bc == 0:
        return None

    cosine = dot_product / (
        magnitude_ba * magnitude_bc
    )

    cosine = max(-1.0, min(1.0, cosine))

    return math.degrees(
        math.acos(cosine)
    )


def analyze_posture(
    landmarker,
    frame,
    timestamp_ms
):
    """
    Analyze sitting/standing posture.

    Returns a list because multiple people
    can exist in one frame.
    """

    rgb_frame = cv2.cvtColor(
        frame,
        cv2.COLOR_BGR2RGB
    )

    mp_image = vision.MPImage(
        image_format=vision.ImageFormat.SRGB,
        data=rgb_frame
    )

    result = landmarker.detect_for_video(
        mp_image,
        timestamp_ms
    )

    results = []

    for pose_landmarks in result.pose_landmarks:

        if len(pose_landmarks) < 33:
            continue

        left_shoulder = pose_landmarks[11]
        right_shoulder = pose_landmarks[12]

        left_hip = pose_landmarks[23]
        right_hip = pose_landmarks[24]

        left_knee = pose_landmarks[25]
        right_knee = pose_landmarks[26]

        left_ankle = pose_landmarks[27]
        right_ankle = pose_landmarks[28]

        left_knee_angle = calculate_angle(
            left_hip,
            left_knee,
            left_ankle
        )

        right_knee_angle = calculate_angle(
            right_hip,
            right_knee,
            right_ankle
        )

        if (
            left_knee_angle is None
            or right_knee_angle is None
        ):
            state = "unknown"

        else:

            average_knee_angle = (
                left_knee_angle +
                right_knee_angle
            ) / 2

            if average_knee_angle > 155:
                state = "standing"

            elif average_knee_angle < 145:
                state = "sitting"

            else:
                state = "unknown"

        results.append({
            "state": state,
            "left_knee_angle": left_knee_angle,
            "right_knee_angle": right_knee_angle,
            "landmarks": pose_landmarks
        })

    return results