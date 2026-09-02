import React from 'react';
import { Users, MessageSquare, AlertTriangle, Cpu, Gauge, Activity } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function Statistics({ data, mode }) {
  const stats = data?.stats || {};
  const isTraffic = mode === PROJECT_MODES.TRAFFIC;

  const cards = isTraffic
    ? [
        {
          title: 'Total Vehicles',
          value: data?.vehicles_count || data?.vehicles?.length || 0,
          sub: 'Live Detection Count',
          icon: Gauge,
          color: 'cyan'
        },
        {
          title: 'Average Speed',
          value: stats.avgSpeed ? `${stats.avgSpeed} km/h` : '0 km/h',
          sub: 'Spatial Vector Model',
          icon: Activity,
          color: 'emerald'
        },
        {
          title: 'Speed Alerts',
          value: stats.speedWarnings || 0,
          sub: '> 70 km/h Threshold',
          icon: AlertTriangle,
          color: 'amber'
        },
        {
          title: 'AI Processing FPS',
          value: data ? `${data.fps || 0} FPS` : '0 FPS',
          sub: data ? `${data.latencyMs || 0}ms Latency` : 'Waiting for input',
          icon: Cpu,
          color: 'violet'
        }
      ]
    : [
        {
          title: 'People Detected',
          value: data?.people_count || data?.people?.length || 0,
          sub: 'YOLOv11 Person Class',
          icon: Users,
          color: 'cyan'
        },
        {
          title: 'Talking Active',
          value: stats.talkingCount || 0,
          sub: 'Mouth Aspect Ratio (MAR)',
          icon: MessageSquare,
          color: 'violet'
        },
        {
          title: 'Drowsiness Risk',
          value: stats.drowsyCount || 0,
          sub: 'Eye Aspect Ratio (EAR)',
          icon: AlertTriangle,
          color: stats.drowsyCount > 0 ? 'red' : 'amber'
        },
        {
          title: 'Sitting / Standing',
          value: `${stats.sittingCount || 0} / ${stats.standingCount || 0}`,
          sub: 'MediaPipe Knee Angle Model',
          icon: Activity,
          color: 'emerald'
        }
      ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'cyan':
        return {
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/20'
        };
      case 'violet':
        return {
          bg: 'bg-violet-500/10',
          text: 'text-violet-400',
          border: 'border-violet-500/20'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20'
        };
      case 'red':
        return {
          bg: 'bg-red-500/10',
          text: 'text-red-400',
          border: 'border-red-500/20'
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20'
        };
      default:
        return {
          bg: 'bg-slate-800/40',
          text: 'text-slate-300',
          border: 'border-slate-800'
        };
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
            className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl flex items-center justify-between transition-all hover:border-slate-700"
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{card.title}</p>
              <h3 className={`text-2xl font-black font-mono my-0.5 tracking-tight ${colorStyle.text}`}>
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-500 font-mono">{card.sub}</p>
            </div>
            <div className={`p-3 rounded-2xl ${colorStyle.bg} ${colorStyle.text} border ${colorStyle.border}`}>
              <IconComponent className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
