import cv2
import base64
from inputs.image import load_image
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

    return base64.b64encode(
        buffer
    ).decode("utf-8")




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

        cv2.putText(
            frame,
            f"Person #{person_id}",
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

    image_path = "test.jpg"

    frame = load_image(image_path)

    timestamp_ms = 0

    results = process_frame(
        frame,
        timestamp_ms
    )

    people = results["people"]
    cars = results["cars"]
    faces = results["faces"]

    draw_people(
        frame,
        people
    )

    draw_cars(
        frame,
        cars
    )

    draw_face_mesh(
        frame,
        faces
    )

    print(f"People: {len(people)}")
    print(f"Cars: {len(cars)}")

    for person in faces:
        print(
            f"Person #{person['person_id']} | "
            f"Eyes: {person['eye_state']['state']} | "
            f"Talking: {person['talking']['talking']}"
        )

    for posture in results["postures"]:
        print(
            f"Posture: {posture['state']}"
        )

    cv2.imshow(
        "Persentria - Image",
        frame
    )

    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()