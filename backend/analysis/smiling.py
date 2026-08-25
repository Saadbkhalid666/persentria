import math


LIP_LEFT = 61
LIP_RIGHT = 291
LIP_TOP = 13
LIP_BOTTOM = 14


def calculate_distance(point1, point2):
    return math.sqrt(
        (point1.x - point2.x) ** 2 +
        (point1.y - point2.y) ** 2
    )


def calculate_smile_ratio(face_landmarks):
    mouth_width = calculate_distance(
        face_landmarks[LIP_LEFT],
        face_landmarks[LIP_RIGHT]
    )

    mouth_height = calculate_distance(
        face_landmarks[LIP_TOP],
        face_landmarks[LIP_BOTTOM]
    )

    if mouth_height == 0:
        return 0

    return mouth_width / mouth_height


def detect_smile(
    face_landmarks,
    threshold=4.0
):
    smile_ratio = calculate_smile_ratio(
        face_landmarks
    )

    is_smiling = smile_ratio > threshold

    return {
        "smiling": is_smiling,
        "smile_ratio": smile_ratio
    }