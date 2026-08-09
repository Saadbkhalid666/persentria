import React from 'react';
import { Users, MessageSquare, Smile, Activity, AlertTriangle, Cpu, Gauge, Zap } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function Statistics({ data, mode }) {
  const stats = data?.stats || {};
  const isTraffic = mode === PROJECT_MODES.TRAFFIC;

  const cards = isTraffic
    ? [
        {
          title: 'Total Vehicles',
          value: data?.vehicles_count || 0,
          sub: 'Live ByteTrack Feed',
          icon: Gauge,
          color: 'cyan',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]'
        },
        {
          title: 'Average Speed',
          value: `${stats.avgSpeed || 50} km/h`,
          sub: 'Calibrated Highway Model',
          icon: Activity,
          color: 'emerald',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        },
        {
          title: 'Speed Alerts',
          value: stats.speedWarnings || 0,
          sub: '> 70 km/h Threshold',
          icon: AlertTriangle,
          color: 'amber',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]'
        },
        {
          title: 'AI Processing FPS',
          value: `${data?.fps || 30} FPS`,
          sub: `${data?.latencyMs || 14}ms Neural Latency`,
          icon: Cpu,
          color: 'purple',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]'
        }
      ]
    : [
        {
          title: 'People Count',
          value: data?.people_count || 0,
          sub: 'YOLOv8 Detection',
          icon: Users,
          color: 'cyan',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]'
        },
        {
          title: 'Active Talking',
          value: stats.talkingCount || 0,
          sub: 'Temporal Mouth Analysis',
          icon: MessageSquare,
          color: 'purple',
          glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]'
        },
        {
          title: 'Smiling Detected',
          value: stats.smilingCount || 0,
          sub: 'Facial Landmark Geometry',
          icon: Smile,
          color: 'emerald',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]'
        },
        {
          title: 'Drowsiness Risk',
          value: stats.drowsyCount || 0,
          sub: 'Eye Closure & Pose Model',
          icon: AlertTriangle,
          color: stats.drowsyCount > 0 ? 'red' : 'amber',
          glow: stats.drowsyCount > 0 ? 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''
        }
      ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'cyan':
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
      case 'purple':
        return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' };
      case 'emerald':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'red':
        return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
      case 'amber':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
      default:
        return { bg: 'bg-slate-800', text: 'text-slate-200', border: 'border-slate-700' };
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const colorStyle = getColorClasses(card.color);

        return (
          <div
            key={idx}
            className={`glass-panel glass-card-3d rounded-xl p-3.5 border ${colorStyle.border} ${card.glow} flex items-center justify-between transition-all`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <h3 className={`text-2xl font-bold font-mono my-0.5 ${colorStyle.text}`}>
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-500 font-sans">{card.sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl ${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
