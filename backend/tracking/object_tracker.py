from collections import defaultdict, deque
import config

vehicle_history = defaultdict(lambda: deque(maxlen=20))
previous_vehicle_ids = set()


def reset_vehicle_tracking():
    """Clear vehicle tracking state between isolated images/batches."""
    global previous_vehicle_ids
    vehicle_history.clear()
    previous_vehicle_ids = set()


def track_cars(model, frame, confidence=None, persist=True):
    """Track vehicles across frames using ByteTrack."""
    if confidence is None:
        confidence = config.CAR_CONFIDENCE

    results = model.track(
        frame,
        persist=persist,
        tracker="bytetrack.yaml",
        conf=confidence,
        classes=config.CAR_CLASS_IDS,
        verbose=False
    )

    cars = []
    result = results[0]

    if result.boxes is None or result.boxes.id is None:
        return cars

    boxes = result.boxes

    for box, track_id in zip(boxes.xyxy, boxes.id):
        x1, y1, x2, y2 = map(int, box)
        car_id = int(track_id)

        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        vehicle_history[car_id].append((center_x, center_y))

        cars.append({
            "track_id": car_id,
            "class": "car",
            "bbox": [x1, y1, x2, y2],
            "center": [center_x, center_y],
            "history": list(vehicle_history[car_id])
        })

    return cars


def detect_cars_image(model, frame, confidence=None):
    """
    Detect vehicles in a standalone image using model.predict().
    Assigns sequential synthetic IDs per image for clean cataloging.
    """
    if confidence is None:
        confidence = config.CAR_CONFIDENCE

    results = model.predict(
        frame,
        conf=confidence,
        classes=config.CAR_CLASS_IDS,
        verbose=False
    )

    cars = []
    result = results[0]

    if result.boxes is None:
        return cars

    for idx, box in enumerate(result.boxes.xyxy, start=1):
        x1, y1, x2, y2 = map(int, box)

        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        cars.append({
            "track_id": idx,
            "class": "car",
            "bbox": [x1, y1, x2, y2],
            "center": [center_x, center_y],
            "history": [(center_x, center_y)]
        })

    return cars
