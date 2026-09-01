from collections import defaultdict, deque


# Stores recent center positions for each person
movement_history = defaultdict(lambda: deque(maxlen=20))

# Stores IDs from the previous frame
previous_ids = set()


def track_people(model, frame, confidence=0.5):
    results = model.track(
        frame,
        persist=True,
        tracker="bytetrack.yaml",
        conf=confidence,
        classes=[0],
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


def track_cars(model, frame, confidence=0.5):
    results = model.track(
        frame,
        persist = True,
        tracker = "bytrack.yml",
        conf = confidence,
        classes = [2],
        verbose = False
    )
    