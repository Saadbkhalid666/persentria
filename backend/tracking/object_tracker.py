from collections import defaultdict, deque

import config


movement_history = defaultdict(lambda: deque(maxlen=20))

previous_ids = set()


def reset_person_tracking():
    """
    Clear all person-tracking state (movement history + entry/exit
    bookkeeping).

    Call this before processing a standalone image that has no
    relationship to previous calls (gallery/directory scans). Without
    this, track IDs and movement history from one unrelated photo
    bleed into the next one in the same batch. Do NOT call this in the
    webcam loop - continuity across frames is the whole point there.
    """
    global previous_ids
    movement_history.clear()
    previous_ids = set()


def track_people(model, frame, confidence=None, persist=True):
    if confidence is None:
        confidence = config.PERSON_CONFIDENCE

    results = model.track(
        frame,
        persist=persist,
        tracker="bytetrack.yaml",
        conf=confidence,
        classes=[config.PERSON_CLASS_ID],
        verbose=False
    )

    people = []

    result = results[0]

    if result.boxes is None or result.boxes.id is None:
        return people

    boxes = result.boxes

    for box, track_id in zip(boxes.xyxy, boxes.id):
        x1, y1, x2, y2 = map(int, box)

        person_id = int(track_id)

        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        center = (center_x, center_y)

        movement_history[person_id].append(center)

        people.append({
            "track_id": person_id,
            "class": "person",
            "bbox": [x1, y1, x2, y2],
            "center": [center_x, center_y],
            "history": list(movement_history[person_id])
        })

    return people


def detect_entry_exit(people):
    global previous_ids

    current_ids = {
        person["track_id"]
        for person in people
    }

    entered = current_ids - previous_ids
    left = previous_ids - current_ids

    previous_ids = current_ids

    return {
        "entered": list(entered),
        "left": list(left)
    }


def track_cars(model, frame, confidence=None, persist=True):
    if confidence is None:
        confidence = config.CAR_CONFIDENCE

    results = model.track(
        frame,
        persist=persist,
        tracker="bytetrack.yaml",
        conf=confidence,
        classes=config.CAR_CLASS_IDS,
        verbose=False
    )

    cars = []

    result = results[0]

    if result.boxes is None or result.boxes.id is None:
        return cars

    boxes = result.boxes

    for box, track_id in zip(
        boxes.xyxy,
        boxes.id
    ):

        x1, y1, x2, y2 = map(int, box)

        car_id = int(track_id)

        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        cars.append({
            "track_id": car_id,
            "class": "car",
            "bbox": [x1, y1, x2, y2],
            "center": [center_x, center_y]
        })

    return cars
