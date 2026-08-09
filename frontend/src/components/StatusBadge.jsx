import React from 'react';
import { MessageSquare, Smile, Eye, Activity, User, AlertTriangle, Zap, Gauge } from 'lucide-react';

export default function StatusBadge({ type, value, label, size = 'sm' }) {
  const isSm = size === 'sm';
  const paddingClass = isSm ? 'px-2.5 py-1 text-xs font-semibold' : 'px-3 py-1.5 text-sm font-semibold';

  const renderBadge = () => {
    switch (type) {
      case 'talking':
        return value ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 ${paddingClass} shadow-sm animate-pulse`}>
            <MessageSquare className="w-3.5 h-3.5" />
            {label || 'Talking'}
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 ${paddingClass}`}>
            <MessageSquare className="w-3.5 h-3.5 opacity-65" />
            Quiet
          </span>
        );

      case 'smiling':
        return value ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 ${paddingClass} shadow-sm`}>
            <Smile className="w-3.5 h-3.5" />
            {label || 'Smiling'}
          </span>
        ) : null;

      case 'eyes':
        return value === 'closed' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 ${paddingClass}`}>
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            Eyes Closed
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 ${paddingClass}`}>
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            Eyes Open
          </span>
        );

      case 'drowsiness':
        return value !== 'normal' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 ${paddingClass} animate-bounce shadow-sm`}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            {label || 'Possible Drowsiness'}
          </span>
        ) : null;

      case 'movement':
        return value === 'moving' ? (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 ${paddingClass}`}>
            <Activity className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            Moving
          </span>
        ) : (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 ${paddingClass}`}>
            <Activity className="w-3.5 h-3.5 opacity-65" />
            Stationary
          </span>
        );

      case 'posture':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 ${paddingClass}`}>
            <User className="w-3.5 h-3.5" />
            {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'}
          </span>
        );

      case 'speed':
        const isSpeeding = value > 70;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full ${isSpeeding ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-blue-50 border border-blue-200 text-blue-700'} ${paddingClass}`}>
            <Gauge className="w-3.5 h-3.5" />
            {value} km/h
          </span>
        );

      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 ${paddingClass}`}>
            <Zap className="w-3.5 h-3.5" />
            {label || value}
          </span>
        );
    }
  };

  return renderBadge();
}
