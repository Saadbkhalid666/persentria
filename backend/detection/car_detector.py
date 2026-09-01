from ultralytics import YOLO


MODEL_PATH = "yolo11n.pt"


def load_car_model():
    return YOLO(MODEL_PATH)


def detect_cars(model, frame, confidence=0.5):

    results = model(
        frame,
        conf=confidence,
        classes=[2],  
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