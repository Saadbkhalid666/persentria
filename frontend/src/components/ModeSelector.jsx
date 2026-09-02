import React from 'react';
import { UserCheck, Car, Video, FolderOpen } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function ModeSelector({ currentMode, onModeChange, activeSubTab, onSubTabChange }) {
  const modes = [
    {
      id: PROJECT_MODES.ROOM,
      name: 'Person Intelligence',
      icon: UserCheck,
      color: 'cyan'
    },
    {
      id: PROJECT_MODES.TRAFFIC,
      name: 'Vehicle Intelligence',
      icon: Car,
      color: 'purple'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary Mode Buttons */}
      <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab: Webcam vs Directory */}
      <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800">
        {currentMode === PROJECT_MODES.ROOM && (
          <button
            onClick={() => onSubTabChange('webcam')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'webcam'
                ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Live Webcam
          </button>
        )}

        <button
          onClick={() => onSubTabChange('directory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === 'directory'
              ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Directory Scan
        </button>
      </div>
    </div>
  );
}
