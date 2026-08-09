import React, { useState, useEffect, useRef } from 'react';
import { Camera, Video, Eye, Shield, Activity, Maximize2, RefreshCw, Layers, Cpu, Sparkles, AlertCircle } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function CameraFeed({ data, mode, isWebsocketConnected }) {
  const [streamSource, setStreamSource] = useState('simulated'); // 'simulated' | 'webcam'
  const [webcamActive, setWebcamActive] = useState(false);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [webcamError, setWebcamError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle Real Webcam Stream
  useEffect(() => {
    let mediaStream = null;

    if (streamSource === 'webcam') {
      navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
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
          console.error('Error accessing camera:', err);
          setWebcamError('Camera access denied or unavailable. Fallback to Simulated AI Stream.');
          setStreamSource('simulated');
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [streamSource]);

  // Render Overlays & AI Bounding Boxes on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Simulated Background Video Graphic if webcam is off
    if (!webcamActive) {
      // Futuristic Dark Room Gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0a0f1d');
      grad.addColorStop(0.5, '#070913');
      grad.addColorStop(1, '#0d1326');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw perspective room grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }
    }

    if (!showBoxes || !data) return;

    // Render Bounding Boxes & AI Annotations for Room Mode
    if (mode === PROJECT_MODES.ROOM && data.people) {
      data.people.forEach((person) => {
        const [x, y, w, h] = person.bbox;
        const isDrowsy = person.drowsiness !== 'normal';
        const isTalking = person.talking;
        const isSmiling = person.smiling;

        const mainColor = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : isSmiling ? '#10b981' : '#a855f7';

        // 1. Draw Corner Reticle Bounding Box
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;

        const cornerLen = 16;
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

        // Semi-transparent box fill
        ctx.fillStyle = `${mainColor}15`;
        ctx.fillRect(x, y, w, h);

        // 2. Draw ID & Status Tag Banner
        ctx.fillStyle = 'rgba(7, 9, 19, 0.85)';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1;
        const tagHeight = 26;
        ctx.fillRect(x, y - tagHeight - 4, 180, tagHeight);
        ctx.strokeRect(x, y - tagHeight - 4, 180, tagHeight);

        ctx.fillStyle = mainColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`ID #${person.id} | ${person.confidence ? (person.confidence * 100).toFixed(0) : 95}%`, x + 8, y - 12);

        // Behavior badges below box
        ctx.fillStyle = 'rgba(13, 18, 36, 0.9)';
        ctx.fillRect(x, y + h + 4, 160, 22);
        ctx.fillStyle = isDrowsy ? '#ef4444' : isTalking ? '#06b6d4' : '#e2e8f0';
        ctx.font = '11px sans-serif';
        const labelText = isDrowsy ? '⚠️ Drowsiness' : isTalking ? '🗣️ Talking' : isSmiling ? '😊 Smiling' : '👤 Stationary';
        ctx.fillText(labelText, x + 6, y + h + 18);

        // 3. Draw Face Landmark Points if enabled
        if (showLandmarks && person.faceLandmarks) {
          ctx.fillStyle = '#06b6d4';
          person.faceLandmarks.forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
      });
    }

    // Render Vehicles for Traffic Mode
    if (mode === PROJECT_MODES.TRAFFIC && data.vehicles) {
      data.vehicles.forEach((vehicle) => {
        const [x, y, w, h] = vehicle.bbox;
        const isSpeeding = vehicle.speedKmh > 70;
        const mainColor = isSpeeding ? '#f59e0b' : '#06b6d4';

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = `${mainColor}20`;
        ctx.fillRect(x, y, w, h);

        // Tag
        ctx.fillStyle = 'rgba(7, 9, 19, 0.9)';
        ctx.fillRect(x, y - 28, 200, 24);
        ctx.strokeStyle = mainColor;
        ctx.strokeRect(x, y - 28, 200, 24);

        ctx.fillStyle = mainColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`${vehicle.type} #${vehicle.id} | ${vehicle.speedKmh} km/h`, x + 8, y - 12);
      });
    }

  }, [data, showBoxes, showLandmarks, mode, webcamActive]);

  return (
    <div className="glass-panel-glow rounded-2xl p-4 relative overflow-hidden flex flex-col justify-between h-full shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-semibold text-slate-200 tracking-wider text-sm flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            AI CAMERA FEED OVERLAY
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {mode} INTELLIGENCE
          </span>
        </div>

        {/* Controls toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreamSource(streamSource === 'simulated' ? 'webcam' : 'simulated')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${streamSource === 'webcam' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Video className="w-3.5 h-3.5" />
            {streamSource === 'webcam' ? 'Live Webcam' : 'Use Webcam'}
          </button>

          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`p-1.5 rounded-lg text-xs transition ${showBoxes ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-500'}`}
            title="Toggle Bounding Boxes"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`p-1.5 rounded-lg text-xs transition ${showLandmarks ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-800 text-slate-500'}`}
            title="Toggle Facial Landmarks"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {webcamError && (
        <div className="mb-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {webcamError}
        </div>
      )}

      {/* Main View Area */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/20 shadow-inner flex items-center justify-center">
        {/* Hidden video element for real webcam */}
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

        {/* HUD Scanner Frame lines */}
        <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 z-20">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
        </div>

        {/* Top Info HUD Bar */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/50 z-30 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
            <Cpu className="w-3.5 h-3.5" />
            YOLOv8 + MediaPipe
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="text-slate-300 font-mono">
            FPS: <span className="text-emerald-400 font-bold">{data?.fps || 30}</span>
          </div>
          <div className="w-px h-3 bg-slate-700" />
          <div className="text-slate-300 font-mono">
            Latency: <span className="text-cyan-300 font-bold">{data?.latencyMs || 14}ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
