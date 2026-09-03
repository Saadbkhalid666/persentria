def get_face_center(face_landmarks):
    x_values = [landmark.x for landmark in face_landmarks]
    y_values = [landmark.y for landmark in face_landmarks]

    center_x = sum(x_values) / len(x_values)
    center_y = sum(y_values) / len(y_values)

    return center_x, center_y


def match_faces_to_people(face_landmarks_list, people, frame_width, frame_height):
    matches = []

    for face_index, face_landmarks in enumerate(face_landmarks_list):

        center_x, center_y = get_face_center(face_landmarks)

        pixel_x = int(center_x * frame_width)
        pixel_y = int(center_y * frame_height)

        matched_person = None

        for person in people:
            x1, y1, x2, y2 = person["bbox"]

            if (
                x1 <= pixel_x <= x2
                and
                y1 <= pixel_y <= y2
            ):
                matched_person = person
                break

        if matched_person is not None:
            matches.append({
                "person_id": matched_person["track_id"],
                "face_index": face_index,
                "landmarks": face_landmarks,
                "face_center": [pixel_x, pixel_y]
            })

    return matches
