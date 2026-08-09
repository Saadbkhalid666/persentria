import React, { useState } from 'react';
import { Eye, Wifi, WifiOff, Volume2, VolumeX, Maximize, Cpu, ShieldCheck } from 'lucide-react';
import ModeSelector from './ModeSelector';

export default function Header({ isConnected, mode, onModeChange }) {
  const [audioEnabled, setAudioEnabled] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <header className="glass-panel rounded-2xl p-4 mb-4 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Title & Brand logo */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm text-white">
          <Eye className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            VisionX
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 font-mono font-medium">
              v1.0 REAL-TIME
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-Time AI Scene Intelligence Platform
          </p>
        </div>
      </div>

      {/* Center: Mode Selector */}
      <ModeSelector currentMode={mode} onModeChange={onModeChange} />

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Connection Status Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${isConnected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isConnected ? 'FastAPI Live' : 'Simulated Stream'}
        </div>

        {/* Audio Alert Toggle */}
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 rounded-xl border transition ${audioEnabled ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
          title="Toggle Sound Alerts"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
