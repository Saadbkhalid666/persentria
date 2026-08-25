from detection.person_detector import load_model
from tracking.object_tracker import track_people, detect_entry_exit
from detection.face_analyzer import create_face_landmarker, analyze_faces
from analysis.face_person_matcher import match_faces_to_people
from analysis.eye_state import get_eye_state
from analysis.talking import detect_talking


model = load_model()
landmarker = create_face_landmarker()


def process_frame(frame, timestamp_ms):
    # 1. Detect and track people
    people = track_people(model, frame)

    # 2. Detect entry/exit
    events = detect_entry_exit(people)

    # 3. Detect faces
    face_result = analyze_faces(
        landmarker,
        frame,
        timestamp_ms
    )

    # 4. Match faces to tracked people
    matches = match_faces_to_people(
        face_result.face_landmarks,
        people,
        frame.shape[1],
        frame.shape[0]
    )

    # 5. Analyze each person
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

        results.append({
            "person_id": person_id,
            "eye_state": eye_state,
            "talking": talking,
            "face_center": match["face_center"]
        })

    return {
        "people": people,
        "events": events,
        "faces": results
    }