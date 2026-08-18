import math
import time

UPPER_LIP = 13
LOWER_LIP = 14

LEFT_MOUTH = 61
RIGHT_MOUTH = 291

def calculate_distance(point1,point2):
    return math.sqrt((point1.x - point2.x) ** 2 +
    (point1.y - point2.y) ** 2
    )

def calculate_mouth_ratio(landmarks):
    mouth_height = calculate_distance(
        landmarks[UPPER_LIP],
        landmarks[LOWER_LIP]
    )

    mouth_width = calculate_distance(
        landmarks[LEFT_MOUTH]
        ,landmarks[RIGHT_MOUTH]
    )

    if mouth_width == 0:
        return 0

    return mouth_height / mouth_width