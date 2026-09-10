from detection.person_detector import load_model
from detection.face_analyzer import (
    create_face_landmarker,
    create_face_landmarker_image,
    analyze_faces,
    analyze_faces_image,
)
from tracking.object_tracker import (
    track_people,
    detect_people_image,
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

# Separate landmarkers for VIDEO mode (webcam) and IMAGE mode (gallery).
# VIDEO mode requires strictly increasing timestamps so it must NOT be
# used for standalone photos - we'd get timestamp collisions causing
# silent result-drops for every image after the first.
landmarker = create_face_landmarker()            # webcam / continuous stream
landmarker_image = create_face_landmarker_image() # standalone photos

pose_landmarker = create_pose_landmarker()


def process_frame(frame, timestamp_ms, reset_state=False):
    """
    Run the full pipeline (person detection/tracking, face/eye/mouth
    analysis, posture, car detection/tracking) on a single frame.

    reset_state:
        False (default) - continuous webcam stream. Track IDs, blink
        counts, and talking history persist frame-to-frame, which is
        what makes tracking/blinking/talking detection work at all.
        Uses model.track() + VIDEO-mode face landmarker.

        True - standalone image with no relation to any previous call
        (gallery upload, directory scan). Uses model.predict() (so
        separate per-person boxes are returned even without ByteTrack
        IDs) + IMAGE-mode face landmarker (no timestamp requirement,
        fully independent per image). Clears tracker + eye/talking
        state first.
    """

    if reset_state:
        reset_person_tracking()
        reset_eye_states()
        reset_talking_states()

    # ── Person detection ────────────────────────────────────────
    if reset_state:
        # Standalone image: predict() always returns boxes with no
        # tracking-ID requirement; we assign sequential IDs ourselves.
        people = detect_people_image(model, frame)
    else:
        people = track_people(model, frame, persist=True)

    # ── Posture (pose landmarker - VIDEO mode, shared for both) ─
    postures = analyze_posture(
        pose_landmarker,
        frame,
        timestamp_ms
    )

    events = detect_entry_exit(people)

    # ── Face analysis ───────────────────────────────────────────
    if reset_state:
        # IMAGE mode: no timestamp, each call is fully independent.
        face_result = analyze_faces_image(landmarker_image, frame)
    else:
        face_result = analyze_faces(landmarker, frame, timestamp_ms)

    # ── Car detection ───────────────────────────────────────────
    cars = track_cars(
        model,
        frame,
        persist=not reset_state
    )

    # ── Face ↔ Person matching ──────────────────────────────────
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
