import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function ActivityChart({ data, mode }) {
  const [history, setHistory] = useState([]);

  // Collect history points
  useEffect(() => {
    if (!data) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newPoint = {
      time: timeStr,
      count: mode === PROJECT_MODES.TRAFFIC ? (data.vehicles_count || 0) : (data.people_count || 0),
      talking: data.stats?.talkingCount || 0,
      smiling: data.stats?.smilingCount || 0,
      drowsy: data.stats?.drowsyCount || 0,
      speed: data.stats?.avgSpeed || 0
    };

    setHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-15); // keep last 15 ticks
    });
  }, [data, mode]);

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
              {mode === PROJECT_MODES.TRAFFIC ? 'TRAFFIC FLOW TELEMETRY' : 'BEHAVIORAL TIME-SERIES'}
            </h3>
            <p className="text-xs text-slate-400">Live AI Analytics over time</p>
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="flex-1 w-full min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="cyanGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 18, 36, 0.95)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f3f4f6'
              }}
            />

            <Area
              type="monotone"
              dataKey="count"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyanGlow)"
              name={mode === PROJECT_MODES.TRAFFIC ? "Vehicles" : "People Count"}
            />
            {mode === PROJECT_MODES.ROOM && (
              <Area
                type="monotone"
                dataKey="talking"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#purpleGlow)"
                name="Talking"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
