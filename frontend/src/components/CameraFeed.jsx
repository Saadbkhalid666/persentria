import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Layers, Sparkles, Cpu, AlertCircle, RefreshCw, Eye, Flame, ShieldAlert } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';
import { processPersonFrame } from '../lib/api';

export default function CameraFeed({ data, mode, isBackendOnline, onTelemetryUpdate }) {
  const [streamSource, setStreamSource] = useState('webcam'); // 'webcam' | 'simulated'
  const [webcamActive, setWebcamActive] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [webcamError, setWebcamError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fps, setFps] = useState(30);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const loopRef = useRef(null);

  // Initialize browser webcam stream
  useEffect(() => {
    let mediaStream = null;

    if (streamSource === 'webcam') {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((stream) => {
          mediaStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setWebcamActive(true);
          setWebcamError(null);
        })
        .catch((err) => {
          console.warn('Webcam not accessible:', err);
          setWebcamError('Webcam unavailable or permission denied. Running in Simulated Scene mode.');
          setStreamSource('simulated');
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamSource]);

  // Live Backend Frame Processing Loop
  useEffect(() => {
    if (!webcamActive || !isBackendOnline || streamSource !== 'webcam') {
      return;
    }

    let lastTime = performance.now();
    let isRequestInProgress = false;

    const processLoop = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || isRequestInProgress) return;

      try {
        isRequestInProgress = true;
        let captureCanvas = captureCanvasRef.current;
        if (!captureCanvas) {
          captureCanvas = document.createElement('canvas');
          captureCanvas.width = 640;
          captureCanvas.height = 360;
          captureCanvasRef.current = captureCanvas;
        }

        const ctx = captureCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        const imageB64 = captureCanvas.toDataURL('image/jpeg', 0.65);

        const startTime = performance.now();
        const res = await processPersonFrame(imageB64);
        const elapsed = performance.now() - startTime;

        if (onTelemetryUpdate && res) {
          onTelemetryUpdate({
            ...res,
            latencyMs: Math.round(elapsed),
            fps: Math.round(1000 / Math.max(elapsed, 30))
          });
        }

        setFps(Math.round(1000 / Math.max(elapsed, 30)));
      } catch (err) {
        console.warn('Live frame process error:', err);
      } finally {
        isRequestInProgress = false;
      }
    };

    const interval = setInterval(processLoop, 200); // 5 FPS network inference rate
    return () => clearInterval(interval);
  }, [webcamActive, isBackendOnline, streamSource, onTelemetryUpdate]);

  // Render Canvas Overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If webcam is off, render futuristic dark grid
    if (!webcamActive) {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0d1527');
      grad.addColorStop(1, '#050811');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }
    }

    if (!showBoxes || !data) return;

    // Render People Bounding Boxes & Reticles
    if (mode === PROJECT_MODES.ROOM && data.people) {
      data.people.forEach((person) => {
        let [x, y, w, h] = person.bbox;
        // Scale coordinates to canvas resolution (800x450)
        const scaleX = canvas.width / (person.raw_bbox ? 640 : 800);
        const scaleY = canvas.height / (person.raw_bbox ? 360 : 450);

        if (person.raw_bbox) {
          x = person.raw_bbox[0] * (canvas.width / 640);
          y = person.raw_bbox[1] * (canvas.height / 360);
          w = (person.raw_bbox[2] - person.raw_bbox[0]) * (canvas.width / 640);
          h = (person.raw_bbox[3] - person.raw_bbox[1]) * (canvas.height / 360);
        }

        const isDrowsy = person.drowsiness !== 'normal' || person.eyes === 'closed';
        const isTalking = person.talking;
        const mainColor = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : '#10b981';

        // 1. High-Tech Corner Reticles
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        const cornerLen = 14;

        // Top-Left
        ctx.beginPath();
        ctx.moveTo(x, y + cornerLen);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerLen, y);
        ctx.stroke();

        // Top-Right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + cornerLen);
        ctx.stroke();

        // Bottom-Left
        ctx.beginPath();
        ctx.moveTo(x, y + h - cornerLen);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + cornerLen, y + h);
        ctx.stroke();

        // Bottom-Right
        ctx.beginPath();
        ctx.moveTo(x + w - cornerLen, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y + h - cornerLen);
        ctx.stroke();

        // Subtle box tint
        ctx.fillStyle = `${mainColor}15`;
        ctx.fillRect(x, y, w, h);

        // 2. ID & Confidence Tag Banner
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1;
        ctx.fillRect(x, y - 24, 150, 22);
        ctx.strokeRect(x, y - 24, 150, 22);

        ctx.fillStyle = mainColor;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`ID #${person.id} | ${person.posture || 'Detected'}`, x + 6, y - 9);

        // 3. Status Tag below bounding box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(x, y + h + 2, 160, 20);
        ctx.strokeRect(x, y + h + 2, 160, 20);

        ctx.fillStyle = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : '#94a3b8';
        ctx.font = 'bold 10px sans-serif';
        const labelText = isDrowsy
          ? '⚠️ Drowsiness Alert'
          : isTalking
          ? '🗣️ Talking Active'
          : `👁️ Eyes: ${person.eyes || 'Open'}`;
        ctx.fillText(labelText, x + 6, y + h + 15);

        // 4. Face Mesh Landmark Dots
        if (showLandmarks && person.faceLandmarks) {
          ctx.fillStyle = '#06b6d4';
          person.faceLandmarks.forEach((pt) => {
            const px = pt.x * (pt.x <= 1 ? canvas.width : 1);
            const py = pt.y * (pt.y <= 1 ? canvas.height : 1);
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      });
    }

    // Render Vehicles for Traffic Mode
    if (mode === PROJECT_MODES.TRAFFIC && data.vehicles) {
      data.vehicles.forEach((vehicle) => {
        const [x, y, w, h] = vehicle.bbox;
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(x, y - 24, 170, 22);
        ctx.strokeStyle = '#06b6d4';
        ctx.strokeRect(x, y - 24, 170, 22);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${vehicle.type || 'Car'} #${vehicle.id}`, x + 6, y - 9);
      });
    }
  }, [data, showBoxes, showLandmarks, mode, webcamActive]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex flex-col justify-between h-full">
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-white tracking-wider text-xs font-mono flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-cyan-400" />
            LIVE AI VISION FEED
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            {mode === PROJECT_MODES.ROOM ? 'Person & Face Engine' : 'Traffic Engine'}
          </span>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreamSource(streamSource === 'simulated' ? 'webcam' : 'simulated')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              streamSource === 'webcam'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {streamSource === 'webcam' ? 'Live Webcam Active' : 'Enable Webcam'}
          </button>

          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`p-1.5 rounded-xl text-xs transition border ${
              showBoxes
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Toggle Bounding Reticles"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`p-1.5 rounded-xl text-xs transition border ${
              showLandmarks
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title="Toggle Facial Mesh"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {webcamError}
        </div>
      )}

      {/* Main View Area */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex items-center justify-center">
        {/* Hidden video element for live webcam */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`}
          muted
          playsInline
        />

        {/* Canvas Overlay for Bounding Boxes & AI Mesh */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* HUD Scanner Corner Lines */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/10 z-20">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
        </div>

        {/* Top Info HUD Bar */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 z-30 flex items-center gap-3 text-xs text-slate-400 shadow-lg">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono">
            <Cpu className="w-3.5 h-3.5" />
            YOLOv11 + MediaPipe
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div>
            FPS: <span className="text-emerald-400 font-bold font-mono">{data?.fps || fps}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div>
            Latency: <span className="text-cyan-400 font-bold font-mono">{data?.latencyMs || 15}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
