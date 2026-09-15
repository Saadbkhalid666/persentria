import cv2
import time
from inputs.image_input import load_image
from processing.process_frame import process_frame


def draw_cars(frame, cars):
    for car in cars:
        x1, y1, x2, y2 = car["bbox"]
        car_id = car["track_id"]

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 255), 2)
        cv2.putText(
            frame,
            f"Car #{car_id}",
            (x1, max(14, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 200, 255),
            2
        )


def main():
    image_path = "test_car.jpg"
    frame = load_image(image_path)
    timestamp_ms = int(time.monotonic() * 1000)

    results = process_frame(frame, timestamp_ms, reset_state=True)
    cars = results["cars"]
    draw_cars(frame, cars)

    print(f"Cars detected: {len(cars)}")
    for car in cars:
        print(f"Car #{car['track_id']} at bbox {car['bbox']}")

    cv2.imshow("Persentria - Vehicle Detection Test", frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()