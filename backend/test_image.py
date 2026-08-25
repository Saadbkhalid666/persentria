import cv2
import time

from inputs.image_input import load_image
from processing.process_frame import process_frame


def main():

    image_path = "test2.jpg"

    frame = load_image(image_path)

    timestamp_ms = int(
        time.monotonic() * 1000
    )

    results = process_frame(
        frame,
        timestamp_ms
    )

    print(
        f"People detected: "
        f"{len(results['people'])}"
    )

    print("Faces:")

    for person in results["faces"]:
        print(
            f"Person #{person['person_id']} | "
            f"Eyes: {person['eye_state']['state']} | "
            f"Talking: {person['talking']['talking']}"
        )

    print("Postures:")

    for posture in results["postures"]:
        print(
            f"Posture: {posture['state']}"
        )

    cv2.imshow(
        "Persentria - Image",
        frame
    )

    cv2.waitKey(0)
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()