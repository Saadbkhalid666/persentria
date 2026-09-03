from ultralytics import YOLO

import config


def load_car_model():
    return YOLO(config.YOLO_MODEL_PATH)


def detect_cars(model, frame, confidence=None):
    if confidence is None:
        confidence = config.CAR_CONFIDENCE

    results = model(
        frame,
        conf=confidence,
        classes=config.CAR_CLASS_IDS,
        verbose=False
    )

    cars = []

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            confidence_score = float(box.conf[0])

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            cars.append({
                "class": "car",
                "confidence": confidence_score,
                "bbox": [x1, y1, x2, y2]
            })

    return cars
