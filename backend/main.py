import cv2
import time

from inputs.camera import (
    open_camera,
    read_frame,
    release_camera
)

from processing.process_frame import process_frame
from analysis.vehicle_recognition import recognize_vehicle

def encode_car_crop(frame, bbox):
    x1, y1, x2, y2 = bbox

    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(frame.shape[1], x2)
    y2 = min(frame.shape[0], y2)

    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    success, buffer = cv2.imencode(".jpg", crop)

    if not success:
        return None

    return base64.b64encode(buffer).decode("utf-8")

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

def draw_cars(frame, cars):

    for car in cars:

        x1, y1, x2, y2 = car["bbox"]
        car_id = car["track_id"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2
        )

        cv2.putText(
            frame,
            f"Car #{car_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),
            2
        )

def draw_face_landmarks(frame, face_results):
    h, w = frame.shape[:2]

    for face in face_results:
        landmarks = face.get("landmarks")

        if not landmarks:
            continue

        for landmark in landmarks:
            x = int(landmark.x * w)
            y = int(landmark.y * h)

            cv2.circle(
                frame,
                (x, y),
                1,
                (0, 255, 0),
                -1
            )

def draw_face_mesh(frame, faces):

    height, width = frame.shape[:2]

    for face in faces:

        landmarks = face["landmarks"]

        for landmark in landmarks:

            x = int(landmark.x * width)
            y = int(landmark.y * height)

            cv2.circle(
                frame,
                (x, y),
                1,
                (0, 255, 0),
                -1
            )

def main():
    camera = open_camera(
        camera_index=0,
        width=1280,
        height=720,
        fps=30
    )

    start_time = time.monotonic()

    try:
        while True:
            frame = read_frame(camera)

            timestamp_ms = int(
                (time.monotonic() - start_time) * 1000
            )

            results = process_frame(
                frame,
                timestamp_ms
            )

            people = results["people"]
            draw_people(frame, people)

            cars = results["cars"]
            draw_cars(frame, cars)

            for person in results["faces"]:
                print(
                    f"Person #{person['person_id']} | "
                    f"Eyes: {person['eye_state']['state']} | "
                    f"Blinks: {person['eye_state']['blink_count']} | "
                    f"Talking: {person['talking']['talking']} | "
                    f"Mouth: {person['talking']['mouth_ratio']:.3f}"
                )

            for posture in results["postures"]:
                print(
                    f"Posture: {posture['state']}"
                )   

            cv2.putText(
                frame,
                f"People: {len(people)}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )
            cv2.putText(
                frame,
                f"Cars: {len(cars)}",
                (20, 75),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 0, 0),
                2
            )

            cv2.imshow("Persentria", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        release_camera(camera)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()