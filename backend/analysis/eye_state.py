import time
import math


LEFT_EYE = [
    362, 385, 387, 263, 373, 380
]

RIGHT_EYE = [
    33, 160, 158, 133, 153, 144
]


# Stores eye state for each tracked person
eye_states = {}


def calculate_distance(point1, point2):
    return math.sqrt(
        (point1.x - point2.x) ** 2 +
        (point1.y - point2.y) ** 2
    )


def calculate_eye_aspect_ratio(landmarks, eye_indices):
    vertical_1 = calculate_distance(
        landmarks[eye_indices[1]],
        landmarks[eye_indices[5]]
    )

    vertical_2 = calculate_distance(
        landmarks[eye_indices[2]],
        landmarks[eye_indices[4]]
    )

    horizontal = calculate_distance(
        landmarks[eye_indices[0]],
        landmarks[eye_indices[3]]
    )

    if horizontal == 0:
        return 0

    return (vertical_1 + vertical_2) / (2 * horizontal)


def get_eye_state(face_landmarks, person_id=None, threshold=0.20):
    left_ratio = calculate_eye_aspect_ratio(
        face_landmarks,
        LEFT_EYE
    )

    right_ratio = calculate_eye_aspect_ratio(
        face_landmarks,
        RIGHT_EYE
    )

    average_ratio = (
        left_ratio + right_ratio
    ) / 2

    current_time = time.monotonic()

    if person_id is None:
        return {
            "state": (
                "closed"
                if average_ratio < threshold
                else "open"
            ),
            "left_ratio": left_ratio,
            "right_ratio": right_ratio,
            "average_ratio": average_ratio
        }

    if person_id not in eye_states:
        eye_states[person_id] = {
            "closed": False,
            "closed_since": None,
            "blink_count": 0
        }

    state_data = eye_states[person_id]

    if average_ratio < threshold:

        if not state_data["closed"]:
            state_data["closed"] = True
            state_data["closed_since"] = current_time

    else:

        if state_data["closed"]:
            closed_duration = (
                current_time -
                state_data["closed_since"]
            )

            if 0.05 <= closed_duration <= 0.5:
                state_data["blink_count"] += 1

            state_data["closed"] = False
            state_data["closed_since"] = None

    closed_duration = 0

    if state_data["closed"]:
        closed_duration = (
            current_time -
            state_data["closed_since"]
        )

    return {
        "state": (
            "closed"
            if average_ratio < threshold
            else "open"
        ),
        "left_ratio": left_ratio,
        "right_ratio": right_ratio,
        "average_ratio": average_ratio,
        "closed_duration": closed_duration,
        "blink_count": state_data["blink_count"]
    }