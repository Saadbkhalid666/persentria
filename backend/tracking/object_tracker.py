def track_people(model, frame,confidence = 0.5):
    results = model.track(
        frame,
        persist = True,
        tracker = "bytetrack.yaml",
        conf = confidence,
        classes=[0],
        verbose=False
    )
    people = []

    result = results[0]

    if result.boxes is None or result.boxes.id is None:
        return people
    
    boxes = result.boxes

    for box, track_id in zip(boxes.xyxy, boxes.id):
        x1, y1, x2, y2 = map(int,box)
        person_id = int(track_id)
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2

        people.append({
            "track_id": person_id,
            "class": "person",
            "bbox": [x1, y1, x2, y2],
            "center": [center_x, center_y]
        })
    return people