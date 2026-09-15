from detection.car_detector import load_car_model
from tracking.object_tracker import (
    track_cars,
    detect_cars_image,
    reset_vehicle_tracking
)

# Shared YOLO instance for vehicle detection and tracking
model = load_car_model()


def process_frame(frame, timestamp_ms=0, reset_state=False):
    """
    Run vehicle detection and tracking pipeline on a frame.

    reset_state:
        False (default) - continuous stream (webcam / video). Track IDs
        and trajectory persist across frames.
        True - standalone image (gallery / directory scan). Uses
        model.predict() for independent detection without track bleeding.
    """
    if reset_state:
        reset_vehicle_tracking()
        cars = detect_cars_image(model, frame)
    else:
        cars = track_cars(model, frame, persist=True)

    return {
        "cars": cars,
        "count": len(cars)
    }
