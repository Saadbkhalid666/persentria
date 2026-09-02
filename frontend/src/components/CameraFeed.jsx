import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Layers, Sparkles, Cpu, AlertCircle } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';
import { processPersonFrame } from '../lib/api';

export default function CameraFeed({ data, mode, isBackendOnline, onTelemetryUpdate }) {
  const [webcamActive, setWebcamActive]   = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [showBoxes, setShowBoxes]         = useState(true);
  const [showMesh, setShowMesh]           = useState(true);
  const [webcamError, setWebcamError]     = useState(null);
  const [liveLatency, setLiveLatency]     = useState(null);

  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const captureRef       = useRef(null);

  // ── open / close webcam ──────────────────────────────
  useEffect(() => {
    let stream = null;
    if (webcamEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play();
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
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [webcamEnabled]);

  // ── live inference loop ──────────────────────────────
  useEffect(() => {
    if (!webcamActive || !isBackendOnline) return;
    let busy = false;

    const loop = async () => {
      if (busy) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      busy = true;
      try {
        // capture at 640×360 for speed
        let cap = captureRef.current;
        if (!cap) {
          cap = document.createElement('canvas');
          cap.width = 640; cap.height = 360;
          captureRef.current = cap;
        }
        cap.getContext('2d').drawImage(video, 0, 0, 640, 360);
        const b64 = cap.toDataURL('image/jpeg', 0.6);

        const t0  = performance.now();
        const res = await processPersonFrame(b64);
        setLiveLatency(Math.round(performance.now() - t0));

        if (onTelemetryUpdate && res && !res.error) {
          onTelemetryUpdate({
            ...res,
            fps: res.fps ?? Math.round(1000 / Math.max(res.latencyMs || 100, 1)),
          });
        }
      } catch { /* ignore transient network errors */ } finally {
        busy = false;
      }
    };

    const id = setInterval(loop, 300); // ~3 fps inference
    return () => clearInterval(id);
  }, [webcamActive, isBackendOnline, onTelemetryUpdate]);

  // ── canvas overlay ───────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // dark grid when webcam is off
    if (!webcamActive) {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, '#08101e');
      g.addColorStop(1, '#050811');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(6,182,212,0.07)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    if (!showBoxes || !data?.people) return;

    // person bounding boxes
    data.people.forEach((p) => {
      let x, y, w, h;
      if (p.raw_bbox) {
        // coords from 640×360 capture — scale to 800×450 canvas
        const sx = canvas.width / 640;
        const sy = canvas.height / 360;
        x = p.raw_bbox[0] * sx;
        y = p.raw_bbox[1] * sy;
        w = (p.raw_bbox[2] - p.raw_bbox[0]) * sx;
        h = (p.raw_bbox[3] - p.raw_bbox[1]) * sy;
      } else {
        [x, y, w, h] = p.bbox;
      }

      const isDrowsy  = p.drowsiness !== 'normal';
      const isTalking = p.talking;
      const color     = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : '#10b981';
      const cLen      = 14;

      // corner reticles
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([cx,cy,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * cLen, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * cLen);
        ctx.stroke();
      });
      ctx.fillStyle = `${color}12`;
      ctx.fillRect(x, y, w, h);

      // id tag
      ctx.fillStyle = 'rgba(5,10,25,0.88)';
      ctx.fillRect(x, y - 22, 140, 20);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y - 22, 140, 20);
      ctx.fillStyle = color;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`#${p.id}  ${p.posture || ''}`, x + 5, y - 8);

      // status strip
      ctx.fillStyle = 'rgba(5,10,25,0.88)';
      ctx.fillRect(x, y + h + 2, 155, 18);
      ctx.strokeRect(x, y + h + 2, 155, 18);
      ctx.fillStyle = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : '#64748b';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(
        isDrowsy ? '⚠ Drowsy' : isTalking ? '🗣 Talking' : `👁 Eyes: ${p.eyes || 'open'}`,
        x + 5, y + h + 14
      );

      // face mesh
      if (showMesh && p.faceLandmarks?.length) {
        ctx.fillStyle = '#06b6d4';
        p.faceLandmarks.forEach(({ x: fx, y: fy }) => {
          // landmarks are normalised 0-1 (from mediapipe)
          const px = fx <= 1 ? fx * canvas.width  : fx;
          const py = fy <= 1 ? fy * canvas.height : fy;
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });
  }, [data, showBoxes, showMesh, webcamActive]);

  const backendReady = isBackendOnline;

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 shadow-2xl flex flex-col h-full">
      {/* toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <Camera className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white font-mono tracking-wide">LIVE VISION FEED</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            Person & Face Engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWebcamEnabled((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              webcamEnabled && webcamActive
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            {webcamEnabled && webcamActive ? 'Webcam ON' : 'Enable Webcam'}
          </button>
          <button
            onClick={() => setShowBoxes((v) => !v)}
            title="Toggle Bounding Boxes"
            className={`p-1.5 rounded-xl border transition ${showBoxes ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMesh((v) => !v)}
            title="Toggle Face Mesh"
            className={`p-1.5 rounded-xl border transition ${showMesh ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {webcamError}
        </div>
      )}

      {/* video + canvas */}
      <div className="relative flex-1 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`}
          muted playsInline
        />
        <canvas
          ref={canvasRef}
          width={800} height={450}
          className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        />

        {/* corner HUD marks */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500 opacity-60" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500 opacity-60" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500 opacity-60" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500 opacity-60" />
        </div>

        {/* top info bar */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/50 z-30 flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Cpu className="w-3 h-3" /> YOLOv11 + MediaPipe
          </span>
          <span>|</span>
          <span>FPS: <b className="text-emerald-400">{data?.fps || '–'}</b></span>
          <span>|</span>
          <span>Latency: <b className="text-cyan-400">{liveLatency != null ? `${liveLatency}ms` : '–'}</b></span>
        </div>

        {/* offline / backend warning */}
        {!backendReady && webcamEnabled && (
          <div className="absolute inset-0 z-40 flex items-center justify-center">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl px-6 py-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Backend Offline</p>
              <p className="text-xs text-slate-400">Start Flask: <code className="text-cyan-400">python api/server.py</code></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
