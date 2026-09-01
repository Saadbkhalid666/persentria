from ultralytics import YOLO

def load_model():
    return YOLO("yolov11n.pt")

def detect_car(model,frame, confidence=0.5):
    results = model(frame,cof=confidence, verbose=false)

    cars = []

    for result in results:
        boxes = result.boxes

        if not boxes:
            continue

        for box in boxes:
            class_id = int(box.cls[0])
            score = fload(box.conf[0])

            if class_id !=2:
                continue
            
            x1,y1,x2,y2 = map(int, box.xyxy[0])

            cars.append({
                "class": "car",
                "confidence": score,
                "bbox": [x1,y1,x2,y2]
            })

    return cars