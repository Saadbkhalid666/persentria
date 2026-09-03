from ultralytics import YOLO

import config


def load_model():
    return YOLO(config.YOLO_MODEL_PATH)


def detect_people(model, frame, confidence=None):
    if confidence is None:
        confidence = config.PERSON_CONFIDENCE

    results = model(frame, conf=confidence, verbose=False)

    people = []

    for result in results:
        boxes = result.boxes

        for box in boxes:
            class_id = int(box.cls[0])
            score = float(box.conf[0])

            if class_id != config.PERSON_CLASS_ID:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            people.append({
                "class": "person",
                "confidence": score,
                "bbox": [x1, y1, x2, y2]
            })

    return people
