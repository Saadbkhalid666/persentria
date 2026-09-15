# Persentria AI — Real-Time Vehicle Recognition & Intelligence Platform

Persentria is a high-performance computer vision and multimodal AI platform tailored specifically for **real-time vehicle detection, tracking, and make & model recognition**. 

By combining **YOLOv11** edge object detection with **OpenRouter Multimodal Vision AI**, Persentria identifies vehicle bounding boxes, crops detected vehicles, and determines manufacturer, model, body style, and confidence score.

---

## Key Features

- **High-Precision Vehicle Detection**: Powered by Ultralytics YOLOv11 to detect cars, buses, trucks, and motorcycles (`COCO classes: 2, 3, 5, 7`).
- **Multimodal AI Make & Model Recognition**: Leverages OpenRouter Vision LLMs (`inclusionai/ling-3.0-flash-vl:free`, `dots-studio/dots-3-note-preview:free`, `openrouter/free`) to recognize exact brand, model, and vehicle classification (Sedan, SUV, Truck, Coupe, Hatchback, etc.).
- **Batch Directory & Gallery Scanner**:
  - Drag-and-drop image uploads directly from your computer.
  - Scan entire local image folders via directory path.
  - Generates annotated vehicle thumbnails and cropped inspection previews.
- **Real-Time Interactive Dashboard**:
  - Built with React, Vite, and Tailwind CSS.
  - Dynamic 3D Three.js particle background.
  - Live statistics: Vehicles Detected, AI Makes Identified, Active Tracks.
  - Visual breakdown chart for vehicle classification distribution.
  - Comprehensive event and telemetry log.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Three.js, Lucide Icons |
| **Backend API** | Python 3.10+, Flask, Flask-CORS |
| **Object Detection & Tracking** | YOLOv11 (`yolo11n.pt`), ByteTrack, OpenCV |
| **Multimodal Vision AI** | OpenRouter API (OpenAI Python SDK) |

---

## Project Structure

```
persentria/
├── backend/
│   ├── analysis/
│   │   └── vehicle_recognition.py  # OpenRouter multimodal vision recognition
│   ├── api/
│   │   └── server.py               # Flask REST API server
│   ├── detection/
│   │   └── car_detector.py         # YOLOv11 vehicle detector
│   ├── inputs/                     # Camera & image input handlers
│   ├── processing/
│   │   └── process_frame.py        # Frame detection & tracking pipeline
│   ├── tracking/
│   │   └── object_tracker.py       # ByteTrack tracking & image detection
│   ├── config.py                   # Central configuration & thresholds
│   ├── requirements.txt            # Python dependencies
│   ├── yolo11n.pt                  # YOLOv11 neural network weights
│   └── .env                        # OpenRouter API credentials
│
└── frontend/
    ├── src/
    │   ├── components/             # React dashboard components
    │   │   ├── ActivityChart.jsx   # Vehicle type breakdown chart
    │   │   ├── DirectoryScanner.jsx# Gallery & folder batch scanner
    │   │   ├── EventLog.jsx        # Telemetry event logger
    │   │   ├── Header.jsx          # Top navigation bar
    │   │   ├── Sidebar.jsx         # Tracked vehicle cards list
    │   │   ├── Statistics.jsx      # Top stats metric bar
    │   │   └── ThreeBackground.jsx # 3D background animation
    │   ├── lib/
    │   │   ├── api.js              # REST client calls
    │   │   └── types.js            # Enums & constants
    │   ├── App.jsx                 # Main application dashboard
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm
- An OpenRouter API Key (for Multimodal AI Make & Model Recognition)

---

### 2. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux / macOS:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your `.env` file in `backend/`:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   PORT=5000
   ```

5. Start the Flask backend server:
   ```bash
   python api/server.py
   ```
   The backend will be available at `http://127.0.0.1:5000`.

---

### 3. Frontend Setup

1. Open another terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173` to access the Persentria dashboard.

---

## API Endpoints

### `GET /api/health`
Check backend server status and loaded models.

### `POST /api/vehicle/directory`
Scan a local folder on the server filesystem.
- **Request Body (JSON)**:
  ```json
  {
    "directory_path": "D:\\persentria\\car_photos",
    "ai_recognition": true
  }
  ```

### `POST /api/vehicle/batch_upload`
Upload multiple vehicle photos from the browser.
- **Request (Multipart Form Data)**:
  - `files`: File array (JPG, PNG, WebP)
  - `ai_recognition`: `"true"` or `"false"`

### `POST /api/vehicle/process_frame`
Process continuous video or camera stream frames.
- **Request Body (JSON)**:
  ```json
  {
    "image": "base64_encoded_jpeg_string",
    "timestamp_ms": 1718000000000
  }
  ```

---

## Configuration (`backend/config.py`)

Tune parameters in `backend/config.py`:
- `CAR_CONFIDENCE`: Confidence threshold for YOLO vehicle detection (default: `0.5`).
- `CAR_CLASS_IDS`: Classes to detect: `[2, 3, 5, 7]` (car, motorcycle, bus, truck).
- `VEHICLE_AI_MODELS`: Fallback list of vision models on OpenRouter.
- `VEHICLE_AI_TIMEOUT`: Timeout per AI recognition request (default: `12` seconds).
- `BATCH_IMAGE_LIMIT`: Maximum number of photos processed per directory scan (default: `40`).

---

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file.
