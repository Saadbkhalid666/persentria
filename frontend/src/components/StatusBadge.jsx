import React from 'react';
import { MessageSquare, Smile, Eye, Activity, User, AlertTriangle, Zap, Gauge } from 'lucide-react';

export default function StatusBadge({ type, value, label, size = 'sm' }) {
  const isSm = size === 'sm';
  const paddingClass = isSm ? 'px-2 py-0.5 text-[11px] font-semibold' : 'px-2.5 py-1 text-xs font-semibold';

  switch (type) {
    case 'talking':
      return value ? (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 ${paddingClass} animate-pulse`}>
          <MessageSquare className="w-3 h-3 text-cyan-400" />
          {label || 'Talking'}
        </span>
      ) : (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 ${paddingClass}`}>
          <MessageSquare className="w-3 h-3 opacity-50" />
          Quiet
        </span>
      );

    case 'smiling':
      return value ? (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 ${paddingClass}`}>
          <Smile className="w-3 h-3 text-emerald-400" />
          {label || 'Smiling'}
        </span>
      ) : null;

    case 'eyes':
      return value === 'closed' ? (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 ${paddingClass}`}>
          <Eye className="w-3 h-3 text-amber-400" />
          Eyes Closed
        </span>
      ) : (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 ${paddingClass}`}>
          <Eye className="w-3 h-3 text-cyan-400" />
          Eyes Open
        </span>
      );

    case 'drowsiness':
      return value !== 'normal' ? (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 ${paddingClass} animate-pulse`}>
          <AlertTriangle className="w-3 h-3 text-red-400" />
          {label || 'Drowsiness Risk'}
        </span>
      ) : null;

    case 'movement':
      return value === 'moving' ? (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 ${paddingClass}`}>
          <Activity className="w-3 h-3 text-violet-400" />
          Moving
        </span>
      ) : (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 ${paddingClass}`}>
          <Activity className="w-3 h-3 opacity-50" />
          Stationary
        </span>
      );

    case 'posture':
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 ${paddingClass}`}>
          <User className="w-3 h-3 text-indigo-400" />
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'}
        </span>
      );

    case 'speed':
      const isSpeeding = value > 70;
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg ${isSpeeding ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'} ${paddingClass}`}>
          <Gauge className="w-3 h-3" />
          {value} km/h
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 ${paddingClass}`}>
          <Zap className="w-3 h-3 text-cyan-400" />
          {label || value}
        </span>
      );
  }
}
