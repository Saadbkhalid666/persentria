import time
import math


LIP_LEFT = 61
LIP_RIGHT = 291
LIP_TOP = 13
LIP_BOTTOM = 14


smile_states = {}


def calculate_distance(point1, point2):
    return math.sqrt(
        (point1.x - point2.x) ** 2 +
        (point1.y - point2.y) ** 2
    )


def detect_smile(face_landmarks, person_id):

    left = face_landmarks[LIP_LEFT]
    right = face_landmarks[LIP_RIGHT]

    top = face_landmarks[LIP_TOP]
    bottom = face_landmarks[LIP_BOTTOM]

    mouth_width = calculate_distance(left, right)
    mouth_height = calculate_distance(top, bottom)

    if mouth_width == 0:
        return {
            "smiling": False,
            "smile_score": 0
        }

    mouth_center_y = (
        top.y + bottom.y
    ) / 2

    corners_y = (
        left.y + right.y
    ) / 2

    corner_lift = (
        mouth_center_y - corners_y
    )

    normalized_lift = (
        corner_lift / mouth_width
    )

    face_left = face_landmarks[234]
    face_right = face_landmarks[454]

    face_width = calculate_distance(
        face_left,
        face_right
    )

    if face_width == 0:
        mouth_width_ratio = 0
    else:
        mouth_width_ratio = (
            mouth_width / face_width
        )

    if person_id not in smile_states:
        smile_states[person_id] = {
            "positive_frames": 0
        }

    state = smile_states[person_id]

    # Smile conditions
    corner_condition = normalized_lift > 0.02
    width_condition = mouth_width_ratio > 0.25

    if corner_condition and width_condition:
        state["positive_frames"] += 1
    else:
        state["positive_frames"] = max(
            0,
            state["positive_frames"] - 1
        )

    smiling = state["positive_frames"] >= 5

    smile_score = (
        normalized_lift * 10 +
        mouth_width_ratio
    )

    return {
        "smiling": smiling,
        "smile_score": smile_score,
        "corner_lift": normalized_lift,
        "mouth_width_ratio": mouth_width_ratio
    }