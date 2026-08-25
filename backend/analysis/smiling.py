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


def detect_smile(face_landmarks):
    left = face_landmarks[LIP_LEFT]
    right = face_landmarks[LIP_RIGHT]

    top = face_landmarks[LIP_TOP]
    bottom = face_landmarks[LIP_BOTTOM]

    mouth_width = calculate_distance(left, right)
    mouth_height = calculate_distance(top, bottom)

    mouth_center_y = (
        top.y + bottom.y
    ) / 2

    corner_lift = (
        mouth_center_y -
        ((left.y + right.y) / 2)
    )
 
    if mouth_width == 0:
        smile_curve = 0
    else:
        smile_curve = corner_lift / mouth_width
 
    is_smiling = smile_curve > 0.02

    return {
        "smiling": is_smiling,
        "mouth_width": mouth_width,
        "mouth_height": mouth_height,
        "smile_curve": smile_curve
    }