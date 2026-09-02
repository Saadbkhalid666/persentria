import os
import sys
import glob
import time
import base64
import cv2
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# Load .env manually if needed
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()

# Add backend directory to sys.path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import existing backend modules
from processing.process_frame import process_frame
from inputs.image_input import load_image
from inputs.camera import open_camera, read_frame, release_camera
from detection.person_detector import load_model, detect_people
from detection.car_detector import load_car_model, detect_cars
from tracking.object_tracker import track_people, track_cars, detect_entry_exit
from analysis.vehicle_recognition import recognize_vehicle
from analysis.eye_state import get_eye_state
from analysis.talking import detect_talking

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Global state for webcam streaming
camera_instance = None
camera_active = False

def encode_image_base64(image_np, quality=80):
    success, buffer = cv2.imencode(".jpg", image_np, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    if not success:
        return None
    return base64.b64encode(buffer).decode("utf-8")

def decode_image_base64(base64_str):
    if "," in base64_str:
        base64_str = base64_str.split(",", 1)[1]
    image_bytes = base64.b64decode(base64_str)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def draw_person_annotations(frame, people, faces=None, postures=None):
    annotated = frame.copy()
    h, w = annotated.shape[:2]

    # Map face data by person_id
    face_map = {f["person_id"]: f for f in (faces or [])}
    
    # Draw people bounding boxes & state tags
    for person in people:
        x1, y1, x2, y2 = person["bbox"]
        pid = person["track_id"]
        face_info = face_map.get(pid, {})
        
        # Color based on state
        is_drowsy = face_info.get("eye_state", {}).get("state") == "closed"
        is_talking = face_info.get("talking", {}).get("talking", False)
        
        color = (0, 0, 255) if is_drowsy else ((255, 120, 0) if is_talking else (0, 255, 0))
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        
        tag_text = f"Person #{pid}"
        if is_drowsy:
            tag_text += " [DROWSY]"
        elif is_talking:
            tag_text += " [TALKING]"
            
        cv2.putText(annotated, tag_text, (x1, max(20, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
        
        # Draw face center if available
        if "face_center" in face_info:
            fx, fy = face_info["face_center"]
            cv2.circle(annotated, (fx, fy), 4, (0, 255, 255), -1)

    return annotated

def draw_vehicle_annotations(frame, cars, vehicle_catalog=None):
    annotated = frame.copy()
    catalog = vehicle_catalog or {}

    for car in cars:
        x1, y1, x2, y2 = car["bbox"]
        cid = car["track_id"]
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (255, 200, 0), 2)
        
        label = f"Car #{cid}"
        if cid in catalog:
            brand_model = catalog[cid].get("brand_model", "")
            if brand_model:
                label += f": {brand_model}"
                
        cv2.putText(annotated, label, (x1, max(20, y1 - 10)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 200, 0), 2)

    return annotated

def serialize_landmarks(landmarks):
    if not landmarks:
        return []
    # Sample down landmarks for efficient transmission
    result = []
    for lm in landmarks:
        if hasattr(lm, "x") and hasattr(lm, "y"):
            result.append({"x": round(lm.x, 4), "y": round(lm.y, 4)})
    return result

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Persentria AI Intelligence Engine",
        "modules": {
            "person_detection": ["webcam", "directory"],
            "vehicle_detection": ["directory"]
        }
    })

# --- MODULE 1: PERSON DETECTION (Webcam & Frame Processing) ---

@app.route("/api/person/process_frame", methods=["POST"])
def api_process_person_frame():
    try:
        data = request.json or {}
        image_base64 = data.get("image")
        timestamp_ms = data.get("timestamp_ms", int(time.time() * 1000))
        
        if not image_base64:
            return jsonify({"error": "No image data provided"}), 400

        frame = decode_image_base64(image_base64)
        if frame is None:
            return jsonify({"error": "Failed to decode frame"}), 400

        # Execute existing pipeline
        results = process_frame(frame, timestamp_ms)
        people = results.get("people", [])
        faces = results.get("faces", [])
        postures = results.get("postures", [])
        events = results.get("events", {"entered": [], "left": []})

        # Format people telemetry
        formatted_people = []
        face_map = {f["person_id"]: f for f in faces}

        for p in people:
            pid = p["track_id"]
            x1, y1, x2, y2 = p["bbox"]
            face = face_map.get(pid, {})
            eye_info = face.get("eye_state", {})
            talk_info = face.get("talking", {})

            # Match posture if available
            posture_state = "unknown"
            if postures:
                posture_state = postures[0].get("state", "unknown")

            is_talking = bool(talk_info.get("talking", False))
            eyes_state = eye_info.get("state", "open")
            drowsiness = "possible drowsiness" if eyes_state == "closed" or eye_info.get("closed_duration", 0) > 1.5 else "normal"

            formatted_people.append({
                "id": pid,
                "name": f"Track #{pid}",
                "bbox": [x1, y1, x2 - x1, y2 - y1],  # [x, y, w, h] for canvas
                "raw_bbox": [x1, y1, x2, y2],
                "talking": is_talking,
                "smiling": False,
                "eyes": eyes_state,
                "movement": "moving" if len(p.get("history", [])) > 2 else "stationary",
                "posture": posture_state,
                "confidence": 0.95,
                "drowsiness": drowsiness,
                "blinks": eye_info.get("blink_count", 0),
                "closed_duration": round(eye_info.get("closed_duration", 0), 2),
                "mouth_ratio": round(talk_info.get("mouth_ratio", 0), 3),
                "faceLandmarks": serialize_landmarks(face.get("landmarks", []))[:30]
            })

        # Generate event items
        generated_events = []
        for entered_id in events.get("entered", []):
            generated_events.append({
                "id": f"ent-{entered_id}-{int(time.time()*1000)}",
                "timestamp": time.strftime("%H:%M:%S"),
                "type": "PERSON_ENTERED",
                "message": f"Person #{entered_id} entered the scene",
                "person_id": entered_id
            })
        for left_id in events.get("left", []):
            generated_events.append({
                "id": f"left-{left_id}-{int(time.time()*1000)}",
                "timestamp": time.strftime("%H:%M:%S"),
                "type": "PERSON_LEFT",
                "message": f"Person #{left_id} left the scene",
                "person_id": left_id
            })

        # Calculate statistics
        stats = {
            "talkingCount": sum(1 for p in formatted_people if p["talking"]),
            "drowsyCount": sum(1 for p in formatted_people if p["drowsiness"] != "normal"),
            "sittingCount": sum(1 for p in formatted_people if p["posture"] == "sitting"),
            "standingCount": sum(1 for p in formatted_people if p["posture"] == "standing"),
            "movingCount": sum(1 for p in formatted_people if p["movement"] == "moving")
        }

        # Create annotated image preview
        annotated_frame = draw_person_annotations(frame, people, faces, postures)
        annotated_b64 = encode_image_base64(annotated_frame, quality=75)

        return jsonify({
            "timestamp": timestamp_ms,
            "people_count": len(formatted_people),
            "people": formatted_people,
            "events": generated_events,
            "stats": stats,
            "annotated_frame": f"data:image/jpeg;base64,{annotated_b64}" if annotated_b64 else None
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- MODULE 1: PERSON DETECTION (Directory Scan) ---

@app.route("/api/person/directory", methods=["POST"])
def api_person_directory():
    try:
        data = request.json or {}
        directory_path = data.get("directory_path", "").strip()

        if not directory_path:
            # Default to backend folder
            directory_path = backend_dir

        dir_obj = Path(directory_path)
        if not dir_obj.exists() or not dir_obj.is_dir():
            return jsonify({"error": f"Directory not found: {directory_path}"}), 404

        # Search for images
        image_extensions = ["*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp"]
        image_files = []
        for ext in image_extensions:
            image_files.extend(glob.glob(str(dir_obj / ext)))
            image_files.extend(glob.glob(str(dir_obj / ext.upper())))

        image_files = sorted(list(set(image_files)))
        if not image_files:
            return jsonify({"error": f"No image files found in {directory_path}"}), 404

        results_list = []
        total_people = 0
        total_talking = 0
        total_drowsy = 0

        for idx, img_path in enumerate(image_files[:25]):  # limit batch to 25
            try:
                frame = cv2.imread(img_path)
                if frame is None:
                    continue

                ts = int(time.time() * 1000)
                frame_res = process_frame(frame, ts)
                people = frame_res.get("people", [])
                faces = frame_res.get("faces", [])
                postures = frame_res.get("postures", [])

                face_map = {f["person_id"]: f for f in faces}
                people_details = []

                for p in people:
                    pid = p["track_id"]
                    x1, y1, x2, y2 = p["bbox"]
                    face = face_map.get(pid, {})
                    eye_info = face.get("eye_state", {})
                    talk_info = face.get("talking", {})
                    
                    is_talking = bool(talk_info.get("talking", False))
                    eyes_state = eye_info.get("state", "open")
                    is_drowsy = eyes_state == "closed" or eye_info.get("closed_duration", 0) > 1.5

                    if is_talking:
                        total_talking += 1
                    if is_drowsy:
                        total_drowsy += 1

                    people_details.append({
                        "id": pid,
                        "bbox": [x1, y1, x2, y2],
                        "talking": is_talking,
                        "eyes": eyes_state,
                        "drowsiness": "drowsy" if is_drowsy else "normal",
                        "posture": postures[0].get("state", "unknown") if postures else "unknown"
                    })

                total_people += len(people)

                annotated = draw_person_annotations(frame, people, faces, postures)
                thumb_b64 = encode_image_base64(annotated, quality=65)

                results_list.append({
                    "filename": Path(img_path).name,
                    "filepath": img_path,
                    "people_count": len(people),
                    "people": people_details,
                    "thumbnail": f"data:image/jpeg;base64,{thumb_b64}"
                })

            except Exception as item_err:
                print(f"Error processing {img_path}: {item_err}")

        return jsonify({
            "directory": directory_path,
            "total_images": len(results_list),
            "total_people_detected": total_people,
            "total_talking": total_talking,
            "total_drowsy": total_drowsy,
            "results": results_list
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- MODULE 2: VEHICLE DETECTION (Directory Scan & AI Recognition) ---

@app.route("/api/vehicle/directory", methods=["POST"])
def api_vehicle_directory():
    try:
        data = request.json or {}
        directory_path = data.get("directory_path", "").strip()
        run_ai_recognition = data.get("ai_recognition", True)

        if not directory_path:
            directory_path = backend_dir

        dir_obj = Path(directory_path)
        if not dir_obj.exists() or not dir_obj.is_dir():
            return jsonify({"error": f"Directory not found: {directory_path}"}), 404

        image_extensions = ["*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp"]
        image_files = []
        for ext in image_extensions:
            image_files.extend(glob.glob(str(dir_obj / ext)))
            image_files.extend(glob.glob(str(dir_obj / ext.upper())))

        image_files = sorted(list(set(image_files)))
        if not image_files:
            return jsonify({"error": f"No image files found in {directory_path}"}), 404

        results_list = []
        all_vehicles = []
        model = load_model()

        for img_path in image_files[:25]:
            try:
                frame = cv2.imread(img_path)
                if frame is None:
                    continue

                cars = track_cars(model, frame)
                vehicle_catalog = {}

                for car in cars:
                    cid = car["track_id"]
                    x1, y1, x2, y2 = car["bbox"]
                    
                    h, w = frame.shape[:2]
                    x1_c, y1_c = max(0, x1), max(0, y1)
                    x2_c, y2_c = min(w, x2), min(h, y2)
                    crop = frame[y1_c:y2_c, x1_c:x2_c]
                    
                    crop_b64 = encode_image_base64(crop, quality=85) if crop.size > 0 else None
                    
                    # AI Vehicle Recognition via OpenRouter / Gemma
                    ai_result_text = None
                    parsed_brand = "Vehicle"
                    parsed_model = f"Track #{cid}"
                    parsed_type = "Car"

                    if run_ai_recognition and crop_b64:
                        try:
                            ai_result_text = recognize_vehicle(crop_b64)
                            if ai_result_text:
                                for line in ai_result_text.splitlines():
                                    if "Brand:" in line:
                                        parsed_brand = line.replace("Brand:", "").strip()
                                    elif "Model:" in line:
                                        parsed_model = line.replace("Model:", "").strip()
                                    elif "Type:" in line:
                                        parsed_type = line.replace("Type:", "").strip()
                        except Exception as ai_err:
                            print(f"Vehicle AI recognition error: {ai_err}")

                    vehicle_info = {
                        "id": cid,
                        "image_name": Path(img_path).name,
                        "bbox": [x1, y1, x2 - x1, y2 - y1],
                        "raw_bbox": [x1, y1, x2, y2],
                        "type": parsed_type,
                        "make": parsed_brand,
                        "model": parsed_model,
                        "brand_model": f"{parsed_brand} {parsed_model}".strip(),
                        "confidence": 0.94,
                        "ai_raw_output": ai_result_text,
                        "crop": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None
                    }

                    vehicle_catalog[cid] = vehicle_info
                    all_vehicles.append(vehicle_info)

                annotated = draw_vehicle_annotations(frame, cars, vehicle_catalog)
                thumb_b64 = encode_image_base64(annotated, quality=65)

                results_list.append({
                    "filename": Path(img_path).name,
                    "filepath": img_path,
                    "vehicle_count": len(cars),
                    "vehicles": list(vehicle_catalog.values()),
                    "thumbnail": f"data:image/jpeg;base64,{thumb_b64}"
                })

            except Exception as item_err:
                print(f"Error in vehicle processing for {img_path}: {item_err}")

        return jsonify({
            "directory": directory_path,
            "total_images": len(results_list),
            "total_vehicles_detected": len(all_vehicles),
            "vehicles": all_vehicles,
            "results": results_list
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- DIRECT FILE UPLOADS ---

@app.route("/api/person/upload", methods=["POST"])
def api_person_upload():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files["file"]
        file_bytes = file.read()
        np_arr = np.frombuffer(file_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image file"}), 400

        ts = int(time.time() * 1000)
        results = process_frame(frame, ts)
        people = results.get("people", [])
        faces = results.get("faces", [])
        postures = results.get("postures", [])

        annotated = draw_person_annotations(frame, people, faces, postures)
        thumb_b64 = encode_image_base64(annotated, quality=80)

        return jsonify({
            "filename": file.filename,
            "people_count": len(people),
            "people": people,
            "faces_count": len(faces),
            "postures": postures,
            "annotated_image": f"data:image/jpeg;base64,{thumb_b64}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vehicle/upload", methods=["POST"])
def api_vehicle_upload():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files["file"]
        file_bytes = file.read()
        np_arr = np.frombuffer(file_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image file"}), 400

        model = load_model()
        cars = track_cars(model, frame)
        vehicle_catalog = {}

        for car in cars:
            cid = car["track_id"]
            x1, y1, x2, y2 = car["bbox"]
            
            h, w = frame.shape[:2]
            crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
            crop_b64 = encode_image_base64(crop, quality=85) if crop.size > 0 else None
            
            ai_text = None
            brand = "Vehicle"
            vmodel = f"#{cid}"
            vtype = "Car"

            if crop_b64:
                try:
                    ai_text = recognize_vehicle(crop_b64)
                    if ai_text:
                        for line in ai_text.splitlines():
                            if "Brand:" in line:
                                brand = line.replace("Brand:", "").strip()
                            elif "Model:" in line:
                                vmodel = line.replace("Model:", "").strip()
                            elif "Type:" in line:
                                vtype = line.replace("Type:", "").strip()
                except Exception as e:
                    print(f"AI recognition error: {e}")

            vehicle_catalog[cid] = {
                "id": cid,
                "bbox": [x1, y1, x2 - x1, y2 - y1],
                "type": vtype,
                "make": brand,
                "model": vmodel,
                "brand_model": f"{brand} {vmodel}".strip(),
                "crop": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None,
                "ai_output": ai_text
            }

        annotated = draw_vehicle_annotations(frame, cars, vehicle_catalog)
        thumb_b64 = encode_image_base64(annotated, quality=80)

        return jsonify({
            "filename": file.filename,
            "vehicle_count": len(cars),
            "vehicles": list(vehicle_catalog.values()),
            "annotated_image": f"data:image/jpeg;base64,{thumb_b64}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting Persentria Flask Server on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)
