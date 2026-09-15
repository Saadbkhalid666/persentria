import os
import sys
import glob
import time
import base64
import threading
import cv2
import numpy as np
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

 
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

 
print("[server] Loading Vehicle AI models …")
import config
from detection.car_detector import load_car_model
from tracking.object_tracker import track_cars, detect_cars_image
from analysis.vehicle_recognition import recognize_vehicle
print("[server] Vehicle models loaded ✓")

_YOLO_MODEL = load_car_model()

_live_catalog = {}
_recognition_lock = threading.Lock()
_pending_recognitions = set()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})



def _encode_b64(frame: np.ndarray, quality: int = 78) -> str | None:
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return base64.b64encode(buf).decode() if ok else None


def _decode_b64(b64_str: str) -> np.ndarray | None:
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    arr = np.frombuffer(base64.b64decode(b64_str), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _parse_vehicle_ai(text: str) -> dict:
    """Parse vision LLM response into structured vehicle fields."""
    brand, model, vtype, confidence = "Unknown", "Unknown", "Car", "Low"
    if not text:
        return {"brand": brand, "model": model, "type": vtype, "confidence": confidence}

    for raw_line in text.splitlines():
        line = raw_line.replace("*", "").replace("-", "").replace("`", "").strip()
        lower = line.lower()
        if any(lower.startswith(k) for k in ["brand:", "make:", "company:", "manufacturer:"]):
            v = line.split(":", 1)[1].strip()
            if v and v.lower() not in ("unknown", "n/a", "none", "...", "unspecified"):
                brand = v
        elif lower.startswith("model:"):
            v = line.split(":", 1)[1].strip()
            if v and v.lower() not in ("unknown", "n/a", "none", "...", "unspecified"):
                model = v
        elif any(lower.startswith(k) for k in ["type:", "body style:", "class:", "vehicle type:"]):
            v = line.split(":", 1)[1].strip()
            if v and v.lower() not in ("unknown", "n/a", "none", "...", "unspecified"):
                vtype = v
        elif lower.startswith("confidence:"):
            v = line.split(":", 1)[1].strip()
            if v:
                confidence = v

    if brand == "Unknown" and model == "Unknown" and len(text.splitlines()) <= 3:
        for word in ["Honda", "Toyota", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi", "Tesla", "Nissan", "Hyundai", "Kia", "Volkswagen", "Lada", "GAZ", "UAZ"]:
            if word.lower() in text.lower():
                brand = word
                break

    return {"brand": brand, "model": model, "type": vtype, "confidence": confidence}


def _async_recognize_vehicle(cid, crop_b64):
    """Background recognition worker so live camera streaming does not lag."""
    try:
        raw = recognize_vehicle(crop_b64)
        info = _parse_vehicle_ai(raw)
        with _recognition_lock:
            if cid in _live_catalog:
                _live_catalog[cid].update({
                    "brand": info["brand"],
                    "model": info["model"],
                    "type": info["type"],
                    "brand_model": f"{info['brand']} {info['model']}".strip(),
                    "confidence": info["confidence"],
                    "ai_raw": raw
                })
    except Exception as ex:
        print(f"[live-ai] Car #{cid} error: {ex}")
    finally:
        with _recognition_lock:
            _pending_recognitions.discard(cid)


def _annotate_vehicle_frame(frame, cars, catalog: dict):
    out = frame.copy()
    for c in cars:
        x1, y1, x2, y2 = c["bbox"]
        cid = c["track_id"]
        info = catalog.get(cid, {})
        brand = info.get("brand", "")
        model = info.get("model", "")
        vtype = info.get("type", "Car")

        if brand and brand not in ("Unknown", "Recognizing..."):
            label = f"{brand} {model}".strip()
        else:
            label = f"{vtype} #{cid}"

        cv2.rectangle(out, (x1, y1), (x2, y2), (0, 200, 255), 2)
        tw, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)[0]
        cv2.rectangle(out, (x1, max(0, y1 - 20)), (x1 + tw + 8, y1), (0, 0, 0), -1)
        cv2.putText(out, label, (x1 + 4, max(14, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)
    return out


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



@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Persentria Vehicle Intelligence Platform",
        "models": ["YOLOv11", "ByteTrack", "Multimodal Vision AI"]
    })


@app.route("/api/vehicle/process_frame", methods=["POST"])
def api_vehicle_process_frame():
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
        cars = track_cars(_YOLO_MODEL, frame, persist=True)
        latency_ms = round((time.perf_counter() - t0) * 1000)

        vehicles_out = []
        h, w = frame.shape[:2]

        for c in cars:
            x1, y1, x2, y2 = c["bbox"]
            cid = c["track_id"]

            with _recognition_lock:
                if cid not in _live_catalog:
                    crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                    crop_b64 = _encode_b64(crop, 85) if crop.size > 0 else None
                    _live_catalog[cid] = {
                        "id": cid,
                        "brand": "Recognizing...",
                        "model": "",
                        "type": "Vehicle",
                        "brand_model": "Recognizing...",
                        "confidence": "Medium",
                        "crop": f"data:image/jpeg;base64,{crop_b64}" if crop_b64 else None,
                    }
                    if crop_b64 and cid not in _pending_recognitions:
                        _pending_recognitions.add(cid)
                        threading.Thread(
                            target=_async_recognize_vehicle,
                            args=(cid, crop_b64),
                            daemon=True
                        ).start()

                v_info = _live_catalog[cid]

            vehicles_out.append({
                "id": cid,
                "bbox": [x1, y1, x2 - x1, y2 - y1],
                "raw_bbox": [x1, y1, x2, y2],
                "center": c.get("center", [(x1 + x2) // 2, (y1 + y2) // 2]),
                "brand": v_info.get("brand", "Vehicle"),
                "model": v_info.get("model", ""),
                "type": v_info.get("type", "Car"),
                "brand_model": v_info.get("brand_model", f"Vehicle #{cid}"),
                "crop": v_info.get("crop"),
                "movement": "moving" if len(c.get("history", [])) > 2 else "stationary",
                "confidence": v_info.get("confidence", "High")
            })

        events_out = []
        if len(vehicles_out) > 0:
            events_out.append({
                "id": f"veh-{int(ts/1000)}",
                "timestamp": time.strftime("%H:%M:%S"),
                "type": "VEHICLE_DETECTED",
                "message": f"🚗 {len(vehicles_out)} vehicle(s) tracked in frame"
            })

        return jsonify({
            "timestamp": ts,
            "latencyMs": latency_ms,
            "fps": max(1, round(1000 / max(latency_ms, 1))),
            "vehicles_count": len(vehicles_out),
            "vehicles": vehicles_out,
            "events": events_out,
            "stats": {
                "totalVehicles": len(vehicles_out),
                "activeTracks": len(vehicles_out),
                "avgSpeed": 0,
                "speedWarnings": 0
            }
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


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
    print(f"[server] Persentria Vehicle AI listening on http://0.0.0.0:{config.FLASK_PORT}")
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=config.FLASK_DEBUG, threaded=True)
