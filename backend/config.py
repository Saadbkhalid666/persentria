"""
Central configuration for the Persentria backend.

All tunable thresholds, paths, and constants live here so behaviour can
be adjusted in one place instead of hunting through every module. Every
module below now imports from here instead of hardcoding its own copy
of these numbers.
"""

import os
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
MODELS_DIR = BACKEND_DIR / "models"

# Absolute path so YOLO loads correctly no matter what directory the
# process was launched from (previously "yolo11n.pt" was a bare
# relative path, which only worked if you ran from backend/).
YOLO_MODEL_PATH = str(BACKEND_DIR / "yolo11n.pt")
FACE_LANDMARKER_MODEL_PATH = str(MODELS_DIR / "face_landmarker.task")
POSE_LANDMARKER_MODEL_PATH = str(MODELS_DIR / "pose_landmarker_full.task")

# ── Flask ──────────────────────────────────────────────────────
FLASK_PORT = int(os.getenv("PORT", 5000))
FLASK_DEBUG = False

# ── Detection ────────────────────────────────────────────────────
PERSON_CONFIDENCE = 0.5
CAR_CONFIDENCE = 0.5
PERSON_CLASS_ID = 0
CAR_CLASS_IDS = [2, 3, 5, 7]  # COCO: car, motorcycle, bus, truck

# ── Eyes / blinking / drowsiness / sleeping ───────────────────
EYE_CLOSED_THRESHOLD = 0.20      # EAR below this = eyes closed
BLINK_MIN_DURATION = 0.05        # seconds - shorter closures are noise
BLINK_MAX_DURATION = 0.5         # seconds - longer closures aren't blinks
DROWSY_DURATION = 1.5            # seconds closed -> "drowsy"
SLEEPING_DURATION = 3.0          # seconds closed -> "sleeping"

# ── Talking ──────────────────────────────────────────────────────
TALKING_MOUTH_MOVEMENT_THRESHOLD = 0.08
TALKING_MIN_MOVEMENT_COUNT = 3
TALKING_MOVEMENT_WINDOW = 0.8    # seconds

# ── Smiling (heuristic - tune against real footage) ─────────────
SMILE_WIDTH_RATIO_THRESHOLD = 0.42    # mouth_width / face_width
SMILE_CORNER_LIFT_THRESHOLD = 0.006   # normalized corner lift

# ── Posture ────────────────────────────────────────────────────
STANDING_KNEE_ANGLE = 155
SITTING_KNEE_ANGLE = 145

# ── Vehicle recognition (OpenRouter) ──────────────────────────
# Trimmed to models that actually exist on OpenRouter. "openrouter/free"
# and "google/gemma-4-26b-a4b-it:free" (previous list) are not real
# model slugs and would only ever fail before falling through.
VEHICLE_AI_MODELS = [
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.2-11b-vision-instruct:free",
    "openai/gpt-4o-mini",
]
VEHICLE_AI_TIMEOUT = 15

# ── Gallery / directory batch scanning ────────────────────────
BATCH_IMAGE_LIMIT = 40
BATCH_THUMBNAIL_MAX_WIDTH = 640
