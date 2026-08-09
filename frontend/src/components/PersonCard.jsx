import React from 'react';
import { User, Activity, AlertTriangle, Eye, Smile, MessageSquare, Car, ShieldCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { PROJECT_MODES } from '../lib/types';

export default function PersonCard({ entity, mode }) {
  if (mode === PROJECT_MODES.TRAFFIC) {
    return (
      <div className="glass-panel glass-card-3d rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">
                {entity.make} {entity.model}
              </h4>
              <p className="text-xs text-slate-400 font-mono">ID: #{entity.id} • {entity.type}</p>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
            {entity.direction}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Est. Speed:</span>
            <StatusBadge type="speed" value={entity.speedKmh} />
          </div>
          <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">Confidence:</span>
            <span className="text-emerald-400 font-mono font-bold">{(entity.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Room Mode Person Card
  const isDrowsy = entity.drowsiness !== 'normal';

  return (
    <div className={`glass-panel glass-card-3d rounded-xl p-4 border transition-all ${isDrowsy ? 'border-red-500/40 bg-red-950/20' : 'border-slate-700/50 hover:border-cyan-500/40'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border ${isDrowsy ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
              {entity.name || `Person #${entity.id}`}
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>ByteTrack ID: #{entity.id}</span>
              <span>•</span>
              <span className="text-emerald-400">{(entity.confidence * 100).toFixed(0)}% Match</span>
            </div>
          </div>
        </div>

        {isDrowsy && (
          <div className="animate-bounce p-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
            <AlertTriangle className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Primary Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatusBadge type="talking" value={entity.talking} />
        <StatusBadge type="smiling" value={entity.smiling} />
        <StatusBadge type="eyes" value={entity.eyes} />
        <StatusBadge type="movement" value={entity.movement} />
        <StatusBadge type="posture" value={entity.posture} />
        {isDrowsy && <StatusBadge type="drowsiness" value={entity.drowsiness} />}
      </div>

      {/* Activity Engagement Meter */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Behavior Score</span>
          <span className="font-mono text-cyan-400 font-semibold">{entity.activityScore || 75}/100</span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isDrowsy ? 'bg-red-500' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
            style={{ width: `${entity.activityScore || 75}%` }}
          />
        </div>
      </div>
    </div>
  );
}
