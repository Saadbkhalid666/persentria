import React from 'react';
import { Home, Car, Box, Sparkles } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function ModeSelector({ currentMode, onModeChange }) {
  const modes = [
    {
      id: PROJECT_MODES.ROOM,
      name: 'Room Intelligence',
      desc: 'People, Face, Smile, Eyes, Talking, Drowsiness, Posture',
      icon: Home,
      color: 'cyan'
    },
    {
      id: PROJECT_MODES.TRAFFIC,
      name: 'Traffic Intelligence',
      desc: 'Vehicles, Speed Estimation, Make/Model, Direction',
      icon: Car,
      color: 'purple'
    },
    {
      id: PROJECT_MODES.OBJECT,
      name: 'General Object Mode',
      desc: 'Object detection, spatial tracking, movement vectors',
      icon: Box,
      color: 'emerald'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {modes.map((m) => {
        const IconComponent = m.icon;
        const isActive = currentMode === m.id;

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
            <div className="text-left">
              <div className="font-semibold">{m.name}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
