import cv2


def load_image(image_path):
    frame = cv2.imread(image_path)

    if frame is None:
        raise ValueError(
            f"Unable to load image: {image_path}"
        )
    return frame
