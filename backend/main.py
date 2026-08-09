import cv2
import time

from flask import Flask
from flask_cors import CORS

from camera.camera import open_camera, read_frame, release_camera


def create_app():
    app = Flask(__name__)

    CORS(
        app,
        supports_credentials=True
    )

    return app


def run_camera():
    camera = open_camera(
        camera_index=0,
        width=1280,
        height=720,
        fps=30
    )

    # Load the face detector ONCE, not inside the loop
    cascade_path = (
        cv2.data.haarcascades
        + "haarcascade_frontalface_default.xml"
    )

    face_cascade = cv2.CascadeClassifier(cascade_path)

    if face_cascade.empty():
        raise RuntimeError(
            "Failed to load Haar Cascade classifier."
        )

    previous_time = time.time()

    try:
        while True:
            frame = read_frame(camera)

            current_time = time.time()
            elapsed_time = current_time - previous_time

            fps = (
                1 / elapsed_time
                if elapsed_time > 0
                else 0
            )

            gray = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2GRAY
            )

            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4
            )

            for (x, y, w, h) in faces:
                cv2.rectangle(
                    frame,
                    (x, y),
                    (x + w, y + h),
                    (0, 255, 0),
                    2
                )

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

            cv2.imshow(
                "Persentria",
                frame
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    except RuntimeError as error:
        print(f"Camera error: {error}")

    finally:
        release_camera(camera)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    app = create_app()

    run_camera()

    app.run(debug=True)