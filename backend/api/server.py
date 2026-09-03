import os
import sys
import glob
import time
import base64
import cv2
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# ─────────────────────────────────────────────
# Bootstrap: paths & environment
# ─────────────────────────────────────────────
BACKEND_DIR = str(Path(__file__).resolve().parent.parent)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

env_path = Path(BACKEND_DIR) / ".env"
if env_path.exists():
    with open(env_path, "r") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

# ─────────────────────────────────────────────
# Import existing backend modules (heavy models)
# ─────────────────────────────────────────────
print("[server] Loading AI models …")
import config
from processing.process_frame import process_frame          # loads YOLO + MediaPipe
from detection.person_detector import load_model            # YOLO
from tracking.object_tracker import track_cars
from analysis.vehicle_recognition import recognize_vehicle
print("[server] Models loaded ✓")

_YOLO_MODEL = load_model()   # shared instance, reused for vehicle-only routes

# ─────────────────────────────────────────────
# Flask app
# ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# ──────────────── helpers ────────────────────

def _encode_b64(frame: np.ndarray, quality: int = 78) -> str | None:
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return base64.b64encode(buf).decode() if ok else None


def _decode_b64(b64_str: str) -> np.ndarray | None:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    arr = np.frombuffer(base64.b64decode(b64_str), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _serialize_lm(landmarks) -> list:
    out = []
    for lm in (landmarks or []):
        if hasattr(lm, "x") and hasattr(lm, "y"):
            out.append({"x": round(lm.x, 4), "y": round(lm.y, 4)})
    return out[:30]


def _parse_vehicle_ai(text: str) -> dict:
    """Turn Gemma/LLM text into structured dict."""
    brand, model, vtype, confidence = "Unknown", "Unknown", "Car", "Low"
    if not text:
        return {"brand": brand, "model": model, "type": vtype, "confidence": confidence}
    for raw_line in text.splitlines():
        line = raw_line.replace("*", "").replace("-", "").strip()
        lower = line.lower()
        if "brand:" in lower or "make:" in lower or "company:" in lower:
            v = line.split(":", 1)[1].strip() if ":" in line else ""
            if v and v.lower() not in ("unknown", "n/a", "none", "..."):
                brand = v
        elif "model:" in lower:
            v = line.split(":", 1)[1].strip() if ":" in line else ""
            if v and v.lower() not in ("unknown", "n/a", "none", "..."):
                model = v
        elif "type:" in lower:
            v = line.split(":", 1)[1].strip() if ":" in line else ""
            if v and v.lower() not in ("unknown", "n/a", "none", "..."):
                vtype = v
        elif "confidence:" in lower:
            v = line.split(":", 1)[1].strip() if ":" in line else ""
            if v:
                confidence = v
    return {"brand": brand, "model": model, "type": vtype, "confidence": confidence}


def _alertness_state(eyes_state: str, closed_duration: float) -> str:
    """Three tiers instead of a single 'drowsy' flag: a normal blink
    is brief, sustained closure is drowsy, and closure well past that
    is treated as asleep."""
    if eyes_state != "closed":
        return "normal"
    if closed_duration >= config.SLEEPING_DURATION:
        return "sleeping"
    if closed_duration >= config.DROWSY_DURATION:
        return "drowsy"
    return "normal"


def _annotate_person_frame(frame, people, faces, postures):
    out = frame.copy()
    face_map = {f["person_id"]: f for f in (faces or [])}
    for p in people:
        x1, y1, x2, y2 = p["bbox"]
        pid = p["track_id"]
        face = face_map.get(pid, {})
        eye = face.get("eye_state", {})
        alertness = _alertness_state(eye.get("state", "open"), eye.get("closed_duration", 0))
        is_talking = face.get("talking", {}).get("talking", False)
        is_smiling = face.get("smile", {}).get("smiling", False)

        if alertness == "sleeping":
            color = (0, 0, 220)
        elif alertness == "drowsy":
            color = (0, 100, 220)
        elif is_talking:
            color = (0, 140, 255)
        else:
            color = (0, 200, 80)

        cv2.rectangle(out, (x1, y1), (x2, y2), color, 2)

        if alertness == "sleeping":
            tag = f"#{pid} SLEEPING"
        elif alertness == "drowsy":
            tag = f"#{pid} DROWSY"
        elif is_talking:
            tag = f"#{pid} TALKING"
        elif is_smiling:
            tag = f"#{pid} SMILING"
        else:
            tag = f"#{pid} ACTIVE"

        tw, th = cv2.getTextSize(tag, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
        cv2.rectangle(out, (x1, max(0, y1-18)), (x1+tw+6, y1), (0, 0, 0), -1)
        cv2.putText(out, tag, (x1+3, max(14, y1-4)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
    return out


def _annotate_vehicle_frame(frame, cars, catalog: dict):
    out = frame.copy()
    for c in cars:
        x1, y1, x2, y2 = c["bbox"]
        cid = c["track_id"]
        info = catalog.get(cid, {})
        brand = info.get("brand", "")
        model = info.get("model", "")
        label = f"{brand} {model}".strip() if brand not in ("Unknown", "") else f"Car #{cid}"
        cv2.rectangle(out, (x1, y1), (x2, y2), (0, 200, 255), 2)
        tw, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
        cv2.rectangle(out, (x1, max(0, y1-18)), (x1+tw+6, y1), (0, 0, 0), -1)
        cv2.putText(out, label, (x1+3, max(14, y1-4)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)
    return out


def _format_person_telemetry(people, faces, postures) -> list:
    face_map = {f["person_id"]: f for f in (faces or [])}
    posture_state = postures[0].get("state", "unknown") if postures else "unknown"
    result = []
    for p in people:
        pid = p["track_id"]
        x1, y1, x2, y2 = p["bbox"]
        face = face_map.get(pid, {})
        eye = face.get("eye_state", {})
        talk = face.get("talking", {})
        smile = face.get("smile", {})

        is_talking = bool(talk.get("talking", False))
        is_smiling = bool(smile.get("smiling", False))
        eyes_state = eye.get("state", "open")
        closed_dur = eye.get("closed_duration", 0)
        alertness = _alertness_state(eyes_state, closed_dur)

        result.append({
            "id": pid,
            "name": f"Person #{pid}",
            "bbox": [x1, y1, x2 - x1, y2 - y1],
            "raw_bbox": [x1, y1, x2, y2],
            "talking": is_talking,
            "smiling": is_smiling,
            "eyes": eyes_state,
            "blinks": eye.get("blink_count", 0),
            "closed_duration": round(closed_dur, 2),
            "mouth_ratio": round(talk.get("mouth_ratio", 0), 3),
            "posture": posture_state,
            "movement": "moving" if len(p.get("history", [])) > 2 else "stationary",
            "alertness": alertness,          # "normal" | "drowsy" | "sleeping"
            "drowsiness": "possible drowsiness" if alertness in ("drowsy", "sleeping") else "normal",
            "confidence": 0.95,
            "faceLandmarks": _serialize_lm(face.get("landmarks", []))
        })
    return result


def _collect_images(directory: str, limit: int = None) -> list:
    if limit is None:
        limit = config.BATCH_IMAGE_LIMIT
    exts = ["*.jpg", "*.jpeg", "*.png", "*.bmp", "*.webp"]
    files = []
    for ext in exts:
        files += glob.glob(str(Path(directory) / ext))
        files += glob.glob(str(Path(directory) / ext.upper()))
    return sorted(set(files))[:limit]


def _resize_thumb(frame):
    if frame.shape[1] > config.BATCH_THUMBNAIL_MAX_WIDTH:
        w = config.BATCH_THUMBNAIL_MAX_WIDTH
        h = int(frame.shape[0] * w / frame.shape[1])
        return cv2.resize(frame, (w, h))
    return frame


# ──────────────── routes ────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "online", "service": "Persentria AI Backend"})


# Module 1-A — live webcam frame from browser (continuous stream:
# reset_state stays False so tracking/blink/talking history persists
# correctly frame-to-frame).
@app.route("/api/person/process_frame", methods=["POST"])
def api_person_frame():
    try:
        body = request.json or {}
        b64 = body.get("image", "")
        ts = body.get("timestamp_ms", int(time.time() * 1000))
        if not b64:
            return jsonify({"error": "No image provided"}), 400

        frame = _decode_b64(b64)
        if frame is None:
            return jsonify({"error": "Could not decode image"}), 400

        t0 = time.perf_counter()
        res = process_frame(frame, ts)
        latency_ms = round((time.perf_counter() - t0) * 1000)

        people = res.get("people", [])
        faces = res.get("faces", [])
        postures = res.get("postures", [])

        formatted = _format_person_telemetry(people, faces, postures)

        # Emit events only for high-priority alerts (drowsy/sleeping) to
        # prevent log flooding.
        events_out = []
        for p in formatted:
            if p["alertness"] == "sleeping":
                events_out.append({
                    "id": f"sleep-{p['id']}-{int(ts/1000)}",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "type": "PERSON_SLEEPING_ALERT",
                    "message": f"😴 Sleeping alert — Person #{p['id']}"
                })
            elif p["alertness"] == "drowsy":
                events_out.append({
                    "id": f"drowsy-{p['id']}-{int(ts/1000)}",
                    "timestamp": time.strftime("%H:%M:%S"),
                    "type": "PERSON_DROWSY_ALERT",
                    "message": f"⚠️ Drowsiness alert — Person #{p['id']}"
                })

        stats = {
            "talkingCount": sum(1 for p in formatted if p["talking"]),
            "smilingCount": sum(1 for p in formatted if p["smiling"]),
            "drowsyCount": sum(1 for p in formatted if p["alertness"] == "drowsy"),
            "sleepingCount": sum(1 for p in formatted if p["alertness"] == "sleeping"),
            "sittingCount": sum(1 for p in formatted if p["posture"] == "sitting"),
            "standingCount": sum(1 for p in formatted if p["posture"] == "standing"),
        }

        return jsonify({
            "timestamp": ts,
            "latencyMs": latency_ms,
            "fps": max(1, round(1000 / max(latency_ms, 1))),
            "people_count": len(formatted),
            "people": formatted,
            "events": events_out,
            "stats": stats,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Module 1-B — directory batch scan (persons). Each image is
# unrelated to the others, so reset_state=True on every call.
@app.route("/api/person/directory", methods=["POST"])
def api_person_directory():
    try:
        body = request.json or {}
        directory = body.get("directory_path", "").strip()
        if not directory:
            return jsonify({"error": "directory_path is required"}), 400

        d = Path(directory)
        if not d.exists() or not d.is_dir():
            return jsonify({"error": f"Directory not found: {directory}"}), 404

        files = _collect_images(directory)
        if not files:
            return jsonify({"error": "No image files found in that directory"}), 404

        results = []
        total_people = total_talking = total_smiling = total_drowsy = total_sleeping = 0

        for img_path in files:
            frame = cv2.imread(img_path)
            if frame is None:
                continue
            try:
                ts = int(time.time() * 1000)
                res = process_frame(frame, ts, reset_state=True)
                people = res.get("people", [])
                faces = res.get("faces", [])
                postures = res.get("postures", [])
                fmt = _format_person_telemetry(people, faces, postures)

                total_people += len(fmt)
                total_talking += sum(1 for p in fmt if p["talking"])
                total_smiling += sum(1 for p in fmt if p["smiling"])
                total_drowsy += sum(1 for p in fmt if p["alertness"] == "drowsy")
                total_sleeping += sum(1 for p in fmt if p["alertness"] == "sleeping")

                ann = _annotate_person_frame(frame, people, faces, postures)
                ann = _resize_thumb(ann)
                thumb = _encode_b64(ann, 60)

                results.append({
                    "filename": Path(img_path).name,
                    "people_count": len(fmt),
                    "people": fmt,
                    "thumbnail": f"data:image/jpeg;base64,{thumb}" if thumb else None,
                })
            except Exception as ex:
                print(f"[person-dir] Error on {img_path}: {ex}")

        return jsonify({
            "directory": directory,
            "total_images": len(results),
            "total_people_detected": total_people,
            "total_talking": total_talking,
            "total_smiling": total_smiling,
            "total_drowsy": total_drowsy,
            "total_sleeping": total_sleeping,
            "results": results,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Module 1-C — batch upload from gallery / browser files (persons).
# Same isolation as the directory route: reset_state=True per image.
@app.route("/api/person/batch_upload", methods=["POST"])
@app.route("/api/person/upload", methods=["POST"])
def api_person_batch_upload():
    try:
        uploaded_files = request.files.getlist("files")
        if not uploaded_files or len(uploaded_files) == 0:
            if "file" in request.files:
                uploaded_files = [request.files["file"]]
            else:
                return jsonify({"error": "No files uploaded"}), 400

        results = []
        total_people = total_talking = total_smiling = total_drowsy = total_sleeping = 0
        all_people = []

        for f in uploaded_files:
            file_bytes = f.read()
            frame = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                continue

            ts = int(time.time() * 1000)
            res = process_frame(frame, ts, reset_state=True)
            people = res.get("people", [])
            faces = res.get("faces", [])
            postures = res.get("postures", [])
            fmt = _format_person_telemetry(people, faces, postures)

            total_people += len(fmt)
            total_talking += sum(1 for p in fmt if p["talking"])
            total_smiling += sum(1 for p in fmt if p["smiling"])
            total_drowsy += sum(1 for p in fmt if p["alertness"] == "drowsy")
            total_sleeping += sum(1 for p in fmt if p["alertness"] == "sleeping")
            all_people.extend(fmt)

            ann = _annotate_person_frame(frame, people, faces, postures)
            ann = _resize_thumb(ann)
            thumb = _encode_b64(ann, 65)

            results.append({
                "filename": f.filename or "uploaded_image.jpg",
                "people_count": len(fmt),
                "people": fmt,
                "thumbnail": f"data:image/jpeg;base64,{thumb}" if thumb else None,
            })

        return jsonify({
            "source": "gallery_upload",
            "total_images": len(results),
            "total_people_detected": total_people,
            "total_talking": total_talking,
            "total_smiling": total_smiling,
            "total_drowsy": total_drowsy,
            "total_sleeping": total_sleeping,
            "people": all_people,
            "results": results,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Module 2-A — directory batch scan (vehicles). persist=False so
# ByteTrack doesn't try to carry car identities between unrelated
# photos.
@app.route("/api/vehicle/directory", methods=["POST"])
def api_vehicle_directory():
    try:
        body = request.json or {}
        directory = body.get("directory_path", "").strip()
        use_ai = body.get("ai_recognition", True)

        if not directory:
            return jsonify({"error": "directory_path is required"}), 400

        d = Path(directory)
        if not d.exists() or not d.is_dir():
            return jsonify({"error": f"Directory not found: {directory}"}), 404

        files = _collect_images(directory)
        if not files:
            return jsonify({"error": "No image files found in that directory"}), 404

        results = []
        all_vehicles = []

        for img_path in files:
            frame = cv2.imread(img_path)
            if frame is None:
                continue
            try:
                cars = track_cars(_YOLO_MODEL, frame, persist=False)
                catalog = {}

                for car in cars:
                    cid = car["track_id"]
                    x1, y1, x2, y2 = car["bbox"]
                    h, w = frame.shape[:2]
                    crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                    crop_b64 = _encode_b64(crop, 85) if crop.size > 0 else None

                    ai_info = {"brand": "Unknown", "model": "Unknown", "type": "Car", "confidence": "Low"}
                    ai_raw = None
                    if use_ai and crop_b64:
                        try:
                            ai_raw = recognize_vehicle(crop_b64)
                            ai_info = _parse_vehicle_ai(ai_raw)
                        except Exception as ai_ex:
                            print(f"[vehicle-ai] {ai_ex}")

                    entry = {
                        "id": cid,
                        "image_name": Path(img_path).name,
                        "bbox": [x1, y1, x2 - x1, y2 - y1],
                        "raw_bbox": [x1, y1, x2, y2],
                        "brand": ai_info["brand"],
                        "model": ai_info["model"],
                        "type": ai_info["type"],
                        "brand_model": f"{ai_info['brand']} {ai_info['model']}".strip(),
                        "confidence": ai_info["confidence"],
                        "ai_raw": ai_raw,
                        "crop": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None,
                    }
                    catalog[cid] = entry
                    all_vehicles.append(entry)

                ann = _annotate_vehicle_frame(frame, cars, catalog)
                ann = _resize_thumb(ann)
                thumb = _encode_b64(ann, 60)

                results.append({
                    "filename": Path(img_path).name,
                    "vehicle_count": len(cars),
                    "vehicles": list(catalog.values()),
                    "thumbnail": f"data:image/jpeg;base64,{thumb}" if thumb else None,
                })
            except Exception as ex:
                print(f"[vehicle-dir] Error on {img_path}: {ex}")

        return jsonify({
            "directory": directory,
            "total_images": len(results),
            "total_vehicles_detected": len(all_vehicles),
            "vehicles": all_vehicles,
            "results": results,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# Module 2-B — batch upload from gallery / browser files (vehicles).
# Same persist=False isolation as the directory route.
@app.route("/api/vehicle/batch_upload", methods=["POST"])
@app.route("/api/vehicle/upload", methods=["POST"])
def api_vehicle_batch_upload():
    try:
        uploaded_files = request.files.getlist("files")
        if not uploaded_files or len(uploaded_files) == 0:
            if "file" in request.files:
                uploaded_files = [request.files["file"]]
            else:
                return jsonify({"error": "No files uploaded"}), 400

        use_ai = request.form.get("ai_recognition", "true").lower() == "true"

        results = []
        all_vehicles = []

        for f in uploaded_files:
            file_bytes = f.read()
            frame = cv2.imdecode(np.frombuffer(file_bytes, np.uint8), cv2.IMREAD_COLOR)
            if frame is None:
                continue

            cars = track_cars(_YOLO_MODEL, frame, persist=False)
            catalog = {}

            for car in cars:
                cid = car["track_id"]
                x1, y1, x2, y2 = car["bbox"]
                h, w = frame.shape[:2]
                crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                crop_b64 = _encode_b64(crop, 85) if crop.size > 0 else None

                ai_info = {"brand": "Unknown", "model": "Unknown", "type": "Car", "confidence": "Low"}
                ai_raw = None
                if use_ai and crop_b64:
                    try:
                        ai_raw = recognize_vehicle(crop_b64)
                        ai_info = _parse_vehicle_ai(ai_raw)
                    except Exception as ai_ex:
                        print(f"[batch-upload-ai] {ai_ex}")

                entry = {
                    "id": cid,
                    "image_name": f.filename or "uploaded_image.jpg",
                    "bbox": [x1, y1, x2 - x1, y2 - y1],
                    "raw_bbox": [x1, y1, x2, y2],
                    "brand": ai_info["brand"],
                    "model": ai_info["model"],
                    "type": ai_info["type"],
                    "brand_model": f"{ai_info['brand']} {ai_info['model']}".strip(),
                    "confidence": ai_info["confidence"],
                    "ai_raw": ai_raw,
                    "crop": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None,
                }
                catalog[cid] = entry
                all_vehicles.append(entry)

            ann = _annotate_vehicle_frame(frame, cars, catalog)
            ann = _resize_thumb(ann)
            thumb = _encode_b64(ann, 65)

            results.append({
                "filename": f.filename or "uploaded_image.jpg",
                "vehicle_count": len(cars),
                "vehicles": list(catalog.values()),
                "thumbnail": f"data:image/jpeg;base64,{thumb}" if thumb else None,
            })

        return jsonify({
            "source": "gallery_upload",
            "total_images": len(results),
            "total_vehicles_detected": len(all_vehicles),
            "vehicles": all_vehicles,
            "results": results,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    print(f"[server] Persentria listening on http://0.0.0.0:{config.FLASK_PORT}")
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=config.FLASK_DEBUG, threaded=True)
