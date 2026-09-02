import React from 'react';
import { BarChart2, Info } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

/**
 * Simple bar chart built with pure CSS — shows the last N telemetry snapshots.
 * Since we can't maintain a rolling history inside a stateless component,
 * we just do a visual breakdown of the current snapshot.
 */
export default function ActivityChart({ data, mode }) {
  const isRoom = mode === PROJECT_MODES.ROOM;

  const segments = isRoom
    ? [
        { label: 'Active',   value: (data?.people_count ?? 0) - (data?.stats?.talkingCount ?? 0) - (data?.stats?.drowsyCount ?? 0), color: 'bg-emerald-500' },
        { label: 'Talking',  value: data?.stats?.talkingCount ?? 0, color: 'bg-cyan-500'   },
        { label: 'Drowsy',   value: data?.stats?.drowsyCount  ?? 0, color: 'bg-red-500'    },
      ]
    : [
        { label: 'Vehicles', value: data?.vehicles_count ?? 0, color: 'bg-cyan-500' },
        { label: 'Warnings', value: data?.stats?.speedWarnings ?? 0, color: 'bg-red-500' },
      ];

  const total = segments.reduce((s, g) => s + Math.max(0, g.value), 0);
  const hasData = total > 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-3">
        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-[10px] font-bold text-white font-mono tracking-wide uppercase">
          {isRoom ? 'Person Status Breakdown' : 'Vehicle Activity'}
        </span>
      </div>

      {/* chart area */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-700">
            <Info className="w-5 h-5" />
            <p className="text-[10px] font-mono text-center">No data yet</p>
          </div>
        ) : (
          <>
            {/* horizontal stacked bar */}
            <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-800">
              {segments.filter((s) => s.value > 0).map((s) => (
                <div
                  key={s.label}
                  className={`h-full ${s.color} transition-all duration-500`}
                  style={{ width: `${(Math.max(0, s.value) / total) * 100}%` }}
                />
              ))}
            </div>

            {/* legend */}
            <div className="flex flex-wrap gap-3">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <div className={`w-2.5 h-2.5 rounded-sm ${s.color}`} />
                  <span>{s.label}</span>
                  <span className="text-white font-bold">{Math.max(0, s.value)}</span>
                </div>
              ))}
            </div>

            {/* individual bars */}
            <div className="space-y-1.5 mt-1">
              {segments.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-14 text-slate-500 truncate">{s.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all duration-700`}
                      style={{ width: total ? `${(Math.max(0, s.value) / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="w-4 text-right text-slate-400">{Math.max(0, s.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
