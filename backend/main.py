import cv2
from flask import Flask
from flask_cors import CORS
from camera.camera import open_camera, read_frame, release_camera

def create_app():
    app = Flask(__name__)

    CORS(app,
    supports_credentials=True
    )
    camera = open_camera()
    while True:
        frame = read_frame(camera)
        cv2.imshow("Persentria", frame)
        
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    release_camera(camera)
    cv2.destroyAllWindows()





    
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)