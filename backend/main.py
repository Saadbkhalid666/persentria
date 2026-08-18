import cv2
import time

from camera.camera import open_camera, read_frame, release_camera
from detection.person_detector import load_model
from detection.face_analyzer import create_face_landmarker, analyze_faces
from tracking.object_tracker import track_people, detect_entry_exit
from analysis.eye_state import get_eye_state
from analysis.face_person_matcher import match_faces_to_people

def draw_people(frame, people):
    for person in people:
        x1, y1, x2, y2 = person["bbox"]
        person_id = person["track_id"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        label = f"Person #{person_id}"

        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )


def main():
    camera = open_camera(
        camera_index=0,
        width=1280,
        height=720,
        fps=30
    )

    model = load_model()
    landmarker = create_face_landmarker()
    start_time = time.monotonic()

    previous_time = time.time()

    try:
        while True:
            frame = read_frame(camera)
            timestamp_ms = int(
                (time.monotonic() - start_time) * 1000
            )

            face_result = analyze_faces(
                landmarker,
                frame,
                timestamp_ms
            )
            for face_landmarks in face_result.face_landmarks:

                eye_state = get_eye_state(face_landmarks)

                print(
                    f"Eyes: {eye_state['state']} | "
                    f"EAR: {eye_state['average_ratio']:.3f}"
                )

            matches = match_faces_to_people(
                face_result.face_landmarks,
                people,
                frame.shape[1],
                frame.shape[0]
            )

            for match in matches:
                person_id = match["person_id"]
                face_landmarks = match[landmarks]
                eye_state = get_eye_state(face_landmarks)

                print(
                    f"Person #{person_id} | "
                    f"Eyes: {eye_state['state']} | "
                    f"EAR: {eye_state['average_ratio']:.3f}"
                )

            people = track_people(model, frame)

            events = detect_entry_exit(people)

            draw_people(frame, people)


            for person_id in events["entered"]:
                print(f"Person #{person_id} entered")

            for person_id in events["left"]:
                print(f"Person #{person_id} left")

            current_time = time.time()
            elapsed_time = current_time - previous_time

            fps = 1 / elapsed_time if elapsed_time > 0 else 0

            previous_time = current_time

            cv2.putText(
                frame,
                f"FPS: {fps:.1f}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                f"People: {len(people)}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            cv2.imshow("Persentria", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        landmarker.close()
        release_camera(camera)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()