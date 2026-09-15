"""
Central configuration for the Persentria Vehicle Recognition backend.

All tunable thresholds, paths, and constants for vehicle detection,
tracking, and multimodal AI recognition live here.
"""

import os
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
MODELS_DIR = BACKEND_DIR / "models"

# Absolute path so YOLO loads correctly regardless of launch directory
YOLO_MODEL_PATH = str(BACKEND_DIR / "yolo11n.pt")

# ── Flask ──────────────────────────────────────────────────────
FLASK_PORT = int(os.getenv("PORT", 5000))
FLASK_DEBUG = False

# ── Vehicle Detection & Tracking ──────────────────────────────
CAR_CONFIDENCE = 0.5
# COCO class IDs: 2: car, 3: motorcycle, 5: bus, 7: truck
CAR_CLASS_IDS = [2, 3, 5, 7]

# ── Vehicle Recognition (OpenRouter Multimodal Vision) ────────
# Active vision models verified on OpenRouter
VEHICLE_AI_MODELS = [
    "inclusionai/ling-3.0-flash-vl:free",
    "dots-studio/dots-3-note-preview:free",
    "openrouter/free",
]
VEHICLE_AI_TIMEOUT = 12

# ── Gallery / Directory Batch Scanning ────────────────────────
BATCH_IMAGE_LIMIT = 40
BATCH_THUMBNAIL_MAX_WIDTH = 640
