import React from 'react';
import { MessageSquare, Smile, Eye, Activity, User, AlertTriangle, Zap, Gauge } from 'lucide-react';

export default function StatusBadge({ type, value, label, size = 'sm' }) {
  const isSm = size === 'sm';
  const paddingClass = isSm ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  const renderBadge = () => {
    switch (type) {
      case 'talking':
        return value ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-medium ${paddingClass} shadow-[0_0_10px_rgba(6,182,212,0.2)] animate-pulse`}>
            <MessageSquare className="w-3.5 h-3.5" />
            {label || 'Talking'}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 ${paddingClass}`}>
            <MessageSquare className="w-3.5 h-3.5 opacity-50" />
            Quiet
          </span>
        );

      case 'smiling':
        return value ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium ${paddingClass} shadow-[0_0_10px_rgba(16,185,129,0.2)]`}>
            <Smile className="w-3.5 h-3.5" />
            {label || 'Smiling'}
          </span>
        ) : null;

      case 'eyes':
        return value === 'closed' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium ${paddingClass}`}>
            <Eye className="w-3.5 h-3.5" />
            Eyes Closed
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 ${paddingClass}`}>
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            Eyes Open
          </span>
        );

      case 'drowsiness':
        return value !== 'normal' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-semibold ${paddingClass} animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.4)]`}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            {label || 'Possible Drowsiness'}
          </span>
        ) : null;

      case 'movement':
        return value === 'moving' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-medium ${paddingClass}`}>
            <Activity className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            Moving
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400 ${paddingClass}`}>
            <Activity className="w-3.5 h-3.5 opacity-40" />
            Stationary
          </span>
        );

      case 'posture':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 ${paddingClass}`}>
            <User className="w-3.5 h-3.5" />
            {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'}
          </span>
        );

      case 'speed':
        const isSpeeding = value > 70;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full ${isSpeeding ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'} ${paddingClass}`}>
            <Gauge className="w-3.5 h-3.5" />
            {value} km/h
          </span>
        );

      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-slate-300 ${paddingClass}`}>
            <Zap className="w-3.5 h-3.5" />
            {label || value}
          </span>
        );
    }
  };

  return renderBadge();
}
