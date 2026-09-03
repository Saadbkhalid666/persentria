from detection.person_detector import load_model
from detection.face_analyzer import create_face_landmarker, analyze_faces
from tracking.object_tracker import (
    track_people,
    track_cars,
    detect_entry_exit,
    reset_person_tracking
)
from analysis.face_person_matcher import match_faces_to_people
from analysis.eye_state import get_eye_state, reset_eye_states
from analysis.talking import detect_talking, reset_talking_states
from analysis.smile import detect_smile
from analysis.sitting_standing import (
    analyze_posture,
    create_pose_landmarker
)


# One shared YOLO instance handles BOTH people and cars - track_people()
# and track_cars() each pass their own `classes=[...]` filter, so a
# second model load (the project previously also loaded a `car_model`
# that was never actually used) was just wasted memory.
model = load_model()
landmarker = create_face_landmarker()
pose_landmarker = create_pose_landmarker()


def process_frame(frame, timestamp_ms, reset_state=False):
    """
    Run the full pipeline (person detection/tracking, face/eye/mouth
    analysis, posture, car detection/tracking) on a single frame.

    reset_state:
        False (default) - continuous webcam stream. Track IDs, blink
        counts, and talking history persist frame-to-frame, which is
        what makes tracking/blinking/talking detection work at all.

        True - standalone image with no relation to any previous call
        (gallery upload, directory scan). Clears tracker + eye/talking
        state first and disables ByteTrack's persist flag, so results
        from one photo can't leak into the next unrelated photo in the
        same batch.
    """

    if reset_state:
        reset_person_tracking()
        reset_eye_states()
        reset_talking_states()

    people = track_people(
        model,
        frame,
        persist=not reset_state
    )

    postures = analyze_posture(
        pose_landmarker,
        frame,
        timestamp_ms
    )

    events = detect_entry_exit(
        people
    )

    face_result = analyze_faces(
        landmarker,
        frame,
        timestamp_ms
    )

    cars = track_cars(
        model,
        frame,
        persist=not reset_state
    )

    matches = match_faces_to_people(
        face_result.face_landmarks,
        people,
        frame.shape[1],
        frame.shape[0]
    )

    results = []

    for match in matches:

        person_id = match["person_id"]
        face_landmarks = match["landmarks"]

        eye_state = get_eye_state(
            face_landmarks,
            person_id
        )

        talking = detect_talking(
            face_landmarks,
            person_id
        )

        smile = detect_smile(
            face_landmarks
        )

        results.append({
            "person_id": person_id,
            "eye_state": eye_state,
            "talking": talking,
            "smile": smile,
            "face_center": match["face_center"],
            "landmarks": face_landmarks
        })

    return {
        "people": people,
        "cars": cars,
        "events": events,
        "faces": results,
        "postures": postures
    }
