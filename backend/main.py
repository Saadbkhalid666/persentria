import base64
import cv2
import time

from inputs.camera import (
    open_camera,
    read_frame,
    release_camera
)

from processing.process_frame import process_frame
from analysis.vehicle_recognition import recognize_vehicle


# Per-track-id cache: we only want to call the vehicle-recognition API
# once for each car, the first time we see its track id - not on every
# single frame while it stays in view. This was missing entirely
# before (main.py referenced an undefined `vehicle_cache`).
vehicle_cache = {}


def encode_car_crop(frame, bbox):
    x1, y1, x2, y2 = bbox
    h, w = frame.shape[:2]

    x1 = max(0, x1)
    y1 = max(0, y1)
    x2 = min(w, x2)
    y2 = min(h, y2)

    crop = frame[y1:y2, x1:x2]

    if crop.size == 0:
        return None

    success, buffer = cv2.imencode(".jpg", crop)

    if not success:
        return None

    return base64.b64encode(buffer).decode("utf-8")


def draw_people(frame, people, smile_map):
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
        if smile_map.get(person_id):
            label += "  :)"

        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )


def draw_cars(frame, cars, vehicle_results):
    for car in cars:

        x1, y1, x2, y2 = car["bbox"]
        car_id = car["track_id"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 255),
            2
        )

        cv2.putText(
            frame,
            f"Car ID: {car_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 255),
            2
        )

        result = vehicle_results.get(car_id)

        if result:
            label = " | ".join(
                line.strip()
                for line in result.splitlines()
                if line.strip()
            )

            if len(label) > 100:
                label = label[:100] + "..."

            cv2.putText(
                frame,
                label,
                (x1, y2 + 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (0, 255, 255),
                1
            )


def draw_face_mesh(frame, faces):
    height, width = frame.shape[:2]

    for face in faces:
        landmarks = face.get("landmarks")

        if not landmarks:
            continue

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
            cars = results["cars"]
            faces = results["faces"]

            smile_map = {
                f["person_id"]: f["smile"]["smiling"]
                for f in faces
            }

            # Recognize each car once, the first time its track id
            # appears. NOTE: this call is synchronous/blocking, so the
            # video will briefly freeze the moment a brand-new car
            # shows up - fine to start with, but if that stutter
            # bothers you the fix is to run recognize_vehicle() in a
            # background thread and fill vehicle_cache when it returns.
            for car in cars:
                car_id = car["track_id"]

                if car_id in vehicle_cache:
                    continue

                image_base64 = encode_car_crop(
                    frame,
                    car["bbox"]
                )

                if image_base64 is None:
                    continue

                try:
                    vehicle_cache[car_id] = recognize_vehicle(
                        image_base64
                    )
                except Exception as e:
                    print(
                        f"Vehicle recognition failed for "
                        f"Car ID {car_id}: {e}"
                    )

            draw_people(
                frame,
                people,
                smile_map
            )

            draw_cars(
                frame,
                cars,
                vehicle_cache
            )

            draw_face_mesh(
                frame,
                faces
            )

            for person in faces:

                print(
                    f"Person #{person['person_id']} | "
                    f"Eyes: "
                    f"{person['eye_state']['state']} | "
                    f"Blinks: "
                    f"{person['eye_state']['blink_count']} | "
                    f"Talking: "
                    f"{person['talking']['talking']} | "
                    f"Smiling: "
                    f"{person['smile']['smiling']}"
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

            cv2.imshow(
                "Persentria",
                frame
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:

        release_camera(camera)

        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
