import React from 'react';
import { BarChart2, Info, Car } from 'lucide-react';

export default function ActivityChart({ data }) {
  const vehicles = data?.vehicles || [];

  // Group vehicles by body style / type
  const typeCounts = {};
  vehicles.forEach((v) => {
    const t = v.type || 'Car';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const palette = [
    'bg-cyan-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
  ];

  const segments = Object.keys(typeCounts).map((key, i) => ({
    label: key,
    value: typeCounts[key],
    color: palette[i % palette.length],
  }));

  const total = segments.reduce((s, g) => s + g.value, 0);
  const hasData = total > 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-3">
        <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-bold text-white font-mono tracking-wide uppercase">
          Vehicle Classification Breakdown
        </span>
        {hasData && (
          <span className="ml-auto text-[9px] text-slate-500 font-mono">
            {total} total
          </span>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-700">
            <Info className="w-5 h-5" />
            <p className="text-[10px] font-mono text-center">No vehicle data yet</p>
          </div>
        ) : (
          <>
            {/* Horizontal stacked bar */}
            <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-800">
              {segments
                .filter((s) => s.value > 0)
                .map((s) => (
                  <div
                    key={s.label}
                    className={`h-full ${s.color} transition-all duration-500`}
                    style={{ width: `${(s.value / total) * 100}%` }}
                    title={`${s.label}: ${s.value}`}
                  />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2.5">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <div className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                  <span>{s.label}</span>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Individual bars */}
            <div className="space-y-1 mt-1 max-h-20 overflow-y-auto custom-scroll pr-1">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-20 text-slate-400 truncate">{s.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-700`}
                      style={{ width: `${(s.value / total) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right text-slate-300 font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
