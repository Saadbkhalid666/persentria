import React from 'react';
import { Users, MessageSquare, Smile, Activity, AlertTriangle, Cpu, Gauge } from 'lucide-react';
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
          color: 'cyan'
        },
        {
          title: 'Average Speed',
          value: `${stats.avgSpeed || 50} km/h`,
          sub: 'Calibrated Highway Model',
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
          value: `${data?.fps || 30} FPS`,
          sub: `${data?.latencyMs || 14}ms Neural Latency`,
          icon: Cpu,
          color: 'purple'
        }
      ]
    : [
        {
          title: 'People Count',
          value: data?.people_count || 0,
          sub: 'YOLOv8 Detection',
          icon: Users,
          color: 'cyan'
        },
        {
          title: 'Active Talking',
          value: stats.talkingCount || 0,
          sub: 'Temporal Mouth Analysis',
          icon: MessageSquare,
          color: 'purple'
        },
        {
          title: 'Smiling Detected',
          value: stats.smilingCount || 0,
          sub: 'Facial Geometry Model',
          icon: Smile,
          color: 'emerald'
        },
        {
          title: 'Drowsiness Risk',
          value: stats.drowsyCount || 0,
          sub: 'Eye Closure Model',
          icon: AlertTriangle,
          color: stats.drowsyCount > 0 ? 'red' : 'amber'
        }
      ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'cyan':
        return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
      case 'purple':
        return { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' };
      case 'emerald':
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
      case 'red':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
      case 'amber':
        return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' };
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
            className={`bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md`}
          >
            <div>
              <p className="text-xs text-slate-500 font-medium">{card.title}</p>
              <h3 className={`text-2xl font-bold font-mono my-0.5 ${colorStyle.text}`}>
                {card.value}
              </h3>
              <p className="text-[10px] text-slate-400">{card.sub}</p>
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
