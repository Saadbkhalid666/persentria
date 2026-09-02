import React from 'react';
import { Activity, ShieldCheck, Video, Cpu, Sparkles } from 'lucide-react';
import ModeSelector from './ModeSelector';

export default function Header({ isConnected, isBackendOnline, mode, onModeChange, activeSubTab, onSubTabChange }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-wider text-white font-mono uppercase bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              PERSENTRIA AI
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-semibold">
              v2.0 PRO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-Time Scene Intelligence • YOLOv11 + MediaPipe + Gemma Multimodal
          </p>
        </div>
      </div>

      {/* Mode & Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <ModeSelector
          currentMode={mode}
          onModeChange={onModeChange}
          activeSubTab={activeSubTab}
          onSubTabChange={onSubTabChange}
        />
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
          <div className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400'}`} />
          <span className="text-slate-300">
            {isBackendOnline ? 'Flask Backend: Connected' : 'Flask Backend: Offline'}
          </span>
        </div>
      </div>
    </header>
  );
}
