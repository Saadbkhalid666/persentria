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

# Per-track-id cache: recognize each vehicle once when first seen
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
            timestamp_ms = int((time.monotonic() - start_time) * 1000)

            results = process_frame(frame, timestamp_ms)
            cars = results["cars"]

            for car in cars:
                car_id = car["track_id"]
                x1, y1, x2, y2 = car["bbox"]

                if car_id not in vehicle_cache:
                    image_base64 = encode_car_crop(frame, car["bbox"])
                    if image_base64:
                        try:
                            vehicle_cache[car_id] = recognize_vehicle(image_base64)
                        except Exception as e:
                            print(f"Vehicle recognition failed for Car ID {car_id}: {e}")

                label = f"Car #{car_id}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 200, 255), 2)
                cv2.putText(frame, label, (x1, max(14, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)

            cv2.imshow("Persentria - Vehicle AI", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    finally:
        release_camera(camera)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
