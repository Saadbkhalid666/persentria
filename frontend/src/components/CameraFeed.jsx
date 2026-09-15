import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Layers, Sparkles, Cpu, AlertCircle, Car } from 'lucide-react';
import { processVehicleFrame } from '../lib/api';

export default function CameraFeed({ data, isBackendOnline, onTelemetryUpdate }) {
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const [webcamError, setWebcamError] = useState(null);
  const [liveLatency, setLiveLatency] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureRef = useRef(null);

  useEffect(() => {
    let stream = null;
    if (webcamEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setWebcamActive(true);
          setWebcamError(null);
        })
        .catch(() => {
          setWebcamError('Camera access denied or unavailable.');
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [webcamEnabled]);

  useEffect(() => {
    if (!webcamActive || !isBackendOnline) return;
    let busy = false;

    const loop = async () => {
      if (busy) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      busy = true;
      try {
        let cap = captureRef.current;
        if (!cap) {
          cap = document.createElement('canvas');
          cap.width = 640;
          cap.height = 360;
          captureRef.current = cap;
        }
        cap.getContext('2d').drawImage(video, 0, 0, 640, 360);
        const b64 = cap.toDataURL('image/jpeg', 0.65);

        const t0 = performance.now();
        const res = await processVehicleFrame(b64);
        setLiveLatency(Math.round(performance.now() - t0));

        if (onTelemetryUpdate && res && !res.error) {
          onTelemetryUpdate({
            ...res,
            fps: res.fps ?? Math.round(1000 / Math.max(res.latencyMs || 100, 1)),
          });
        }
      } catch {
        /* ignore transient frame capture errors */
      } finally {
        busy = false;
      }
    };

    const id = setInterval(loop, 250);
    return () => clearInterval(id);
  }, [webcamActive, isBackendOnline, onTelemetryUpdate]);

  // Canvas drawing for vehicle overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!webcamActive) {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, '#08101e');
      g.addColorStop(1, '#050811');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(6,182,212,0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    if (!showBoxes || !data?.vehicles) return;

    data.vehicles.forEach((v) => {
      let x, y, w, h;
      if (v.raw_bbox) {
        const sx = canvas.width / 640;
        const sy = canvas.height / 360;
        x = v.raw_bbox[0] * sx;
        y = v.raw_bbox[1] * sy;
        w = (v.raw_bbox[2] - v.raw_bbox[0]) * sx;
        h = (v.raw_bbox[3] - v.raw_bbox[1]) * sy;
      } else if (v.bbox) {
        const sx = canvas.width / 640;
        const sy = canvas.height / 360;
        x = v.bbox[0] * sx;
        y = v.bbox[1] * sy;
        w = v.bbox[2] * sx;
        h = v.bbox[3] * sy;
      } else {
        return;
      }

      const color = '#06b6d4'; // cyan for vehicles

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      // Corner brackets
      const cl = Math.min(16, w / 4, h / 4);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      // top-left
      ctx.beginPath(); ctx.moveTo(x, y + cl); ctx.lineTo(x, y); ctx.lineTo(x + cl, y); ctx.stroke();
      // top-right
      ctx.beginPath(); ctx.moveTo(x + w - cl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + cl); ctx.stroke();
      // bottom-left
      ctx.beginPath(); ctx.moveTo(x, y + h - cl); ctx.lineTo(x, y + h); ctx.lineTo(x + cl, y + h); ctx.stroke();
      // bottom-right
      ctx.beginPath(); ctx.moveTo(x + w - cl, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y + h - cl); ctx.stroke();

      // Top label badge
      const hasBrand = v.brand && v.brand !== 'Unknown' && v.brand !== 'Vehicle' && v.brand !== 'Recognizing...';
      const label = hasBrand ? `${v.brand} ${v.model || ''}`.trim() : `Vehicle #${v.id}`;
      ctx.font = 'bold 11px monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
      ctx.fillRect(x, Math.max(0, y - 22), tw + 14, 20);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, Math.max(0, y - 22), tw + 14, 20);

      ctx.fillStyle = color;
      ctx.fillText(label, x + 7, Math.max(14, y - 8));
    });
  }, [data, showBoxes, webcamActive]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Video & canvas container */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${webcamActive ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Inactive overlay */}
        {!webcamActive && (
          <div className="relative z-10 flex flex-col items-center gap-3 text-slate-500 text-center px-4">
            {webcamError ? (
              <>
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-xs font-mono text-red-400 max-w-xs">{webcamError}</p>
                <button
                  onClick={() => setWebcamEnabled(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition"
                >
                  Retry Camera Access
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Car className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300 font-mono">Webcam Feed Inactive</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Enable the camera or scan vehicle images from gallery</p>
                </div>
                <button
                  onClick={() => setWebcamEnabled(true)}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-semibold text-white font-mono shadow-md shadow-cyan-500/20 transition"
                >
                  Enable Camera
                </button>
              </>
            )}
          </div>
        )}

        {/* Live HUD telemetry tag */}
        {webcamActive && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-white">LIVE VEHICLE TRACKER</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-bold">{data?.vehicles_count ?? 0} in frame</span>
            {liveLatency != null && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{liveLatency}ms</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWebcamEnabled((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              webcamEnabled
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            {webcamEnabled ? 'Camera On' : 'Camera Off'}
          </button>

          <button
            onClick={() => setShowBoxes((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              showBoxes
                ? 'bg-slate-800 border-cyan-500/30 text-cyan-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Bounding Boxes
          </button>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-3">
          <span>YOLOv11 Car/Bus/Truck Detector</span>
          <span>•</span>
          <span>ByteTrack Trajectory Engine</span>
        </div>
      </div>
    </div>
  );
}