import React from 'react';
import { Car, Wifi, WifiOff } from 'lucide-react';
import ModeSelector from './ModeSelector';

export default function Header({ isBackendOnline, activeSubTab, onSubTabChange }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-xl">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-xl bg-linear-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Car className="w-5 h-5 text-white" />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isBackendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-widest text-white font-mono uppercase">PERSENTRIA VEHICLE AI</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">YOLOv11 · ByteTrack · Multimodal Vision AI</p>
        </div>
      </div>

       
      {/* Backend status */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono border ${
        isBackendOnline
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}>
        {isBackendOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
        {isBackendOnline ? 'Backend Online :5000' : 'Backend Offline'}
      </div>
    </header>
  );
}
