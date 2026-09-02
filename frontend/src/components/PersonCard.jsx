import React from 'react';
import { User, Activity, AlertTriangle, Eye, MessageSquare, Car, ShieldCheck, Sparkles } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { PROJECT_MODES } from '../lib/types';

export default function PersonCard({ entity, mode }) {
  if (mode === PROJECT_MODES.TRAFFIC) {
    return (
      <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-100 text-xs tracking-wide">
                {entity.make && entity.make !== 'Vehicle' ? `${entity.make} ${entity.model}` : `Track #${entity.id}`}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: #{entity.id} • {entity.type || 'Vehicle'}
              </p>
            </div>
          </div>
          {entity.crop && (
            <img src={entity.crop} alt="Vehicle crop" className="w-10 h-10 rounded-lg object-cover border border-slate-800" />
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          {entity.speedKmh && (
            <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 text-[11px]">Est. Speed:</span>
              <StatusBadge type="speed" value={entity.speedKmh} />
            </div>
          )}
          <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">AI Confidence:</span>
            <span className="text-emerald-400 font-mono font-bold text-xs">
              {entity.confidence ? (entity.confidence * 100).toFixed(0) : 95}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Room Mode Person Card
  const isDrowsy = entity.drowsiness !== 'normal' || entity.eyes === 'closed';

  return (
    <div
      className={`bg-slate-950/80 rounded-xl p-3.5 border transition-all ${
        isDrowsy
          ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-500/10'
          : 'border-slate-800 hover:border-cyan-500/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
              isDrowsy
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}
          >
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
              {entity.name || `Person #${entity.id}`}
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              <span>Track ID: #{entity.id}</span>
              {entity.blinks !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-cyan-400">{entity.blinks} Blinks</span>
                </>
              )}
            </div>
          </div>
        </div>

        {isDrowsy && (
          <div className="p-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Primary Badges */}
      <div className="flex flex-wrap gap-1 mb-2.5">
        <StatusBadge type="talking" value={entity.talking} />
        <StatusBadge type="eyes" value={entity.eyes} />
        <StatusBadge type="movement" value={entity.movement} />
        <StatusBadge type="posture" value={entity.posture} />
        {isDrowsy && <StatusBadge type="drowsiness" value={entity.drowsiness} />}
      </div>

      {/* Mouth & Metrics Bar if available */}
      {entity.mouth_ratio !== undefined && (
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">
          <span>Mouth Aspect Ratio:</span>
          <span className="text-cyan-400 font-bold">{entity.mouth_ratio}</span>
        </div>
      )}
    </div>
  );
}
