import React from 'react';
import { Users, Car, Video, FolderOpen } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function ModeSelector({ currentMode, onModeChange, activeSubTab, onSubTabChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary module toggle */}
      <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
        {[
          { id: PROJECT_MODES.ROOM,    label: 'Person Detection', Icon: Users },
          { id: PROJECT_MODES.TRAFFIC, label: 'Vehicle Recognition', Icon: Car },
        ].map(({ id, label, Icon }) => {
          const active = currentMode === id;
          return (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                active
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Sub-tab toggle */}
      <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
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
