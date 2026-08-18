import math
import time

UPPER_LIP = 13
LOWER_LIP = 14

LEFT_MOUTH = 61
RIGHT_MOUTH = 291

talking_states = {}

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

def detect_talking(
    face_landmarks,
    person_id,
    thresold = 0.08
):
    mouth_ratio = calculate_mouth_ratio(
        face_landmarks
    )

    current_time = time.monotonic()

    if person_id not in talking_states:
        talking_states[person_id] = {
            "previous_ratio": mouth_ratio,
            "movement_count":0,
            "last_movement":current_time,
            "talking": False
        }
    
    state = talking_states[person_id]

    difference = abs(
        mouth_ratio - state["previous_ratio"]
    )

    if difference > thresold:
        state["movement_count"] += 1
        state["last_movement"] = current_time

    state["previous_ratio"] = mouth_ratio

    time_since_movement = (
        current_time - state["last_movement"]
    )

    if (
        state["movement_count"] >= 3
        and time_since_movement < 0.8
    ):
        state["talking"] = True
    else:
        state["talking"] = False

    return {
        "talking": state["talking"],
        "mouth_ratio": mouth_ratio,
        "movement_count": state["movement_count"]
    }
        
