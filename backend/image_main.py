import cv2
import base64

from inputs.image import load_image
from processing.process_frame import process_frame
from analysis.vehicle_recognition import recognize_vehicle


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


def draw_people(frame, people):
    for person in people:

        x1, y1, x2, y2 = person["bbox"]
        person_id = person["track_id"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2
        )

        cv2.putText(
            frame,
            f"Person ID: {person_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 0, 0),
            2
        )


def main():

    image_path = "test_car.jpg"

    print(f"\nLoading image: {image_path}")

    frame = load_image(image_path)

    results = process_frame(
        frame,
        timestamp_ms=0
    )


    people = results["people"]

    print(f"\nPeople detected: {len(people)}")

    draw_people(
        frame,
        people
    )


    cars = results["cars"]

    print(f"Cars detected: {len(cars)}")

    vehicle_results = {}

    for car in cars:

        car_id = car["track_id"]

        print(f"\nRecognizing Car ID: {car_id}")

        image_base64 = encode_car_crop(
            frame,
            car["bbox"]
        )

        if image_base64 is None:
            print("Could not create car crop.")
            continue

        try:

            vehicle_result = recognize_vehicle(
                image_base64
            )

            vehicle_results[car_id] = vehicle_result

            print("\nVehicle Recognition Result:")
            print(vehicle_result)

        except Exception as e:

            print(
                f"Vehicle recognition failed for "
                f"Car ID {car_id}: {e}"
            )

    draw_cars(
        frame,
        cars,
        vehicle_results
    )


    cv2.imshow(
        "Persentria - Image Analysis",
        frame
    )

    print("\nPress any key to close...")

    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()