import cv2
import time
from flask import Flask
from flask_cors import CORS
from camera.camera import open_camera, read_frame, release_camera
from detection.person_detector import load_model, detect_people

def draw_people(frame, people):
    for person in people:
        x1, y1, x2, y2 = person["bbox"]
        confidence = person["confidence"]

        cv2.rectangle(
            frame,
            (x1,y1),
            (x2,y2),
            (0, 255, 0),
            2
        )
        label = f"Person {confidence:.2f}"
        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2
        )
    return frame    

def create_app():
    app = Flask(__name__)

    CORS(app,
    supports_credentials=True
    )
    camera = open_camera(
        camera_index=0,
        width=1280,
        height=720,
        fps=60
    )
    model = load_model()
    previous_time = time.time()
    try:

        while True:
            frame = read_frame(camera)
            people = detect_people(model,frame)
            draw_people(frame,people)

            
            current_time = time.time()
            elapsed_time = current_time - previous_time
            fps = 1 / elapsed_time if elapsed_time > 0 else 0
            
            
            previous_time = current_time
            
            cv2.putText(
                frame,
                f"FPS: {fps:.1f}",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )

            cv2.putText(
                frame,
                f"People: {len(people)}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )
            cv2.imshow("Persentria", frame)
            
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
       
    except RuntimeError as error:
        print(f"Camera error: {error}")

    finally:
        release_camera(camera)
        cv2.destroyAllWindows()
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)