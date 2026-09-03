"""
Lightweight smile heuristic built on the same face-mesh landmarks
already used by talking.py / eye_state.py - no separate ML model
needed.

A smile is approximated as a mouth that is:
  (a) wide relative to the face (width_ratio), and
  (b) has its corners lifted above the mouth's vertical midpoint
      (corner_lift) - the visual signature of a smile curve.

The two thresholds live in config.py (SMILE_WIDTH_RATIO_THRESHOLD,
SMILE_CORNER_LIFT_THRESHOLD). They're reasonable starting points but,
like the eye/talking thresholds, should be tuned against your own
footage and lighting - there was no smile logic in the project before
this, so these numbers haven't been validated against real faces yet.
"""

import math

import config

UPPER_LIP = 13
LOWER_LIP = 14
LEFT_MOUTH = 61
RIGHT_MOUTH = 291

# Standard MediaPipe face-mesh landmarks near the left/right temple.
# Used only as a stable "face width" reference so the mouth-width
# ratio isn't thrown off by the person being closer to or further
# from the camera.
LEFT_FACE_EDGE = 234
RIGHT_FACE_EDGE = 454


def _distance(point1, point2):
    return math.sqrt(
        (point1.x - point2.x) ** 2 +
        (point1.y - point2.y) ** 2
    )


def detect_smile(face_landmarks):
    """
    Returns a dict with a boolean 'smiling' flag plus the raw
    measurements, so thresholds can be tuned/logged later.
    """

    left_mouth = face_landmarks[LEFT_MOUTH]
    right_mouth = face_landmarks[RIGHT_MOUTH]
    upper_lip = face_landmarks[UPPER_LIP]
    lower_lip = face_landmarks[LOWER_LIP]

    left_face = face_landmarks[LEFT_FACE_EDGE]
    right_face = face_landmarks[RIGHT_FACE_EDGE]

    mouth_width = _distance(left_mouth, right_mouth)
    face_width = _distance(left_face, right_face)

    if face_width == 0:
        return {
            "smiling": False,
            "width_ratio": 0,
            "corner_lift": 0
        }

    width_ratio = mouth_width / face_width

    mouth_center_y = (upper_lip.y + lower_lip.y) / 2
    corner_avg_y = (left_mouth.y + right_mouth.y) / 2

    # Image coordinates grow downward, so a positive value means the
    # corners sit above the mouth's vertical center.
    corner_lift = mouth_center_y - corner_avg_y

    smiling = (
        width_ratio > config.SMILE_WIDTH_RATIO_THRESHOLD
        and corner_lift > config.SMILE_CORNER_LIFT_THRESHOLD
    )

    return {
        "smiling": smiling,
        "width_ratio": round(width_ratio, 4),
        "corner_lift": round(corner_lift, 4)
    }
