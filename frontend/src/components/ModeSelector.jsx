import React from 'react';
import { Video, FolderOpen, Car } from 'lucide-react';
import { VIEW_TABS } from '../lib/types';

export default function ModeSelector({ activeSubTab, onSubTabChange }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          onClick={() => onSubTabChange(VIEW_TABS.WEBCAM)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === VIEW_TABS.WEBCAM
              ? 'bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Live Camera Feed
        </button>

        <button
          onClick={() => onSubTabChange(VIEW_TABS.DIRECTORY)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubTab === VIEW_TABS.DIRECTORY
              ? 'bg-linear-to-r from-cyan-600 to-blue-600 text-white shadow-sm shadow-cyan-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Directory & Gallery Scan
        </button>
      </div>
    </div>
  );
}
