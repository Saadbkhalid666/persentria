import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

export default function ActivityChart({ data, mode }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!data) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newPoint = {
      time: timeStr,
      count: mode === PROJECT_MODES.TRAFFIC ? data.vehicles_count || data.vehicles?.length || 0 : data.people_count || data.people?.length || 0,
      talking: data.stats?.talkingCount || 0,
      drowsy: data.stats?.drowsyCount || 0
    };

    setHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-15);
    });
  }, [data, mode]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs tracking-wider font-mono">
              {mode === PROJECT_MODES.TRAFFIC ? 'TRAFFIC FLOW TELEMETRY' : 'BEHAVIORAL TIME-SERIES'}
            </h3>
            <p className="text-[11px] text-slate-400">Live AI Metrics stream</p>
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
              <linearGradient id="violetGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
              }}
            />

            <Area
              type="monotone"
              dataKey="count"
              stroke="#06b6d4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#cyanGlow)"
              name={mode === PROJECT_MODES.TRAFFIC ? 'Vehicles' : 'People Count'}
            />
            {mode === PROJECT_MODES.ROOM && (
              <Area
                type="monotone"
                dataKey="talking"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#violetGlow)"
                name="Talking Active"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
