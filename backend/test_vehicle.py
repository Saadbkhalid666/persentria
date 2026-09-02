from ultralytics import YOLO
import cv2


model = YOLO("yolo11n.pt")

image_path = "test_car.jpg"

frame = cv2.imread(image_path)

if frame is None:
    raise ValueError("Could not load test_car.jpg")


results = model(
    frame,
    conf=0.25,
    verbose=False
)


for result in results:

    if result.boxes is None:
        print("No objects detected.")
        continue

    for box in result.boxes:

        class_id = int(box.cls[0])
        confidence = float(box.conf[0])

        x1, y1, x2, y2 = map(
            int,
            box.xyxy[0]
        )

        print(
            f"Class ID: {class_id} | "
            f"Confidence: {confidence:.2f} | "
            f"Box: {[x1, y1, x2, y2]}"
        )

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            f"Class {class_id} {confidence:.2f}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )


cv2.imshow(
    "YOLO Detection Test",
    frame
)

cv2.waitKey(0)
cv2.destroyAllWindows()