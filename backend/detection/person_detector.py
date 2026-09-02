from ultralytics import YOLO


def load_model():
    return YOLO("yolo11n.pt")


def detect_people(model, frame, confidence=0.5):
    results = model(frame, conf=confidence, verbose=False)

    people = []

    for result in results:
        boxes = result.boxes

        for box in boxes:
            class_id = int(box.cls[0])
            score = float(box.conf[0])

          
            if class_id != 0:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            people.append({
                "class": "person",
                "confidence": score,
                "bbox": [x1, y1, x2, y2]
            })

    return people