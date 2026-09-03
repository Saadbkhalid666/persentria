import math
import time

import config


LEFT_EYE = [
    362, 385, 387, 263, 373, 380
]

RIGHT_EYE = [
    33, 160, 158, 133, 153, 144
]


eye_states = {}


def reset_eye_states():
    """
    Clear all tracked eye state.

    Call this before scanning a standalone image (gallery/directory
    mode) so blink counts and closed-duration timers don't leak over
    from a previous, unrelated photo. Do NOT call this in the webcam
    loop - continuity across frames is exactly what blink detection
    depends on there.
    """
    eye_states.clear()


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


def get_eye_state(face_landmarks, person_id, threshold=None):
    if threshold is None:
        threshold = config.EYE_CLOSED_THRESHOLD

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

    if person_id not in eye_states:
        eye_states[person_id] = {
            "is_closed": False,
            "closed_since": None,
            "blink_count": 0
        }

    state = eye_states[person_id]

    # Eyes are currently closed
    if average_ratio < threshold:

        if not state["is_closed"]:
            state["is_closed"] = True
            state["closed_since"] = current_time

    # Eyes are currently open
    else:

        if state["is_closed"]:
            closed_duration = (
                current_time - state["closed_since"]
            )

            # Short eye closure = blink
            if config.BLINK_MIN_DURATION <= closed_duration <= config.BLINK_MAX_DURATION:
                state["blink_count"] += 1

            state["is_closed"] = False
            state["closed_since"] = None

    closed_duration = 0

    if state["is_closed"]:
        closed_duration = (
            current_time -
            state["closed_since"]
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
        "blink_count": state["blink_count"]
    }
