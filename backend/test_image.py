import cv2
import time

from inputs.image_input import load_image
from processing.process_frame import process_frame

def draw_people(frame, people):
    for person in people:
        x1, y1, x2, y2 = person["bbox"]
        person_id = person["track_id"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        label = f"Person #{person_id}"

        cv2.putText(
            frame,
            label,
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

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
    people = results["people"]
    draw_people(frame, people)

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