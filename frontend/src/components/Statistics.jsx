import React from 'react';
import { Car, Sparkles, Activity, Gauge, Zap } from 'lucide-react';

const Stat = ({ label, value, icon: Icon, color = 'cyan', sub }) => (
  <div className="flex-1 min-w-[140px] bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center shrink-0`}>
      <Icon className={`w-4.5 h-4.5 text-${color}-400`} />
    </div>
    <div className="min-w-0">
      <div className={`text-xl font-black text-${color}-400 font-mono leading-none`}>{value}</div>
      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate uppercase">{label}</div>
      {sub != null && <div className="text-[9px] text-slate-500 font-mono">{sub}</div>}
    </div>
  </div>
);

export default function Statistics({ data }) {
  const vehicles = data?.vehicles || [];
  const vcount = data?.vehicles_count ?? vehicles.length;

  const identifiedMakes = vehicles.filter(
    (v) => v.brand && v.brand !== 'Unknown'
  ).length;

  const activeTracks = vehicles.length;
  const fps = data?.fps ? `${data.fps} FPS` : (vcount > 0 ? 'Active' : '–');
  const latency = data?.latencyMs != null ? `${data.latencyMs} ms` : '–';

  return (
    <div className="flex flex-wrap gap-3">
      <Stat label="Vehicles Detected" value={vcount} icon={Car} color="cyan" />
      <Stat label="AI Makes Identified" value={identifiedMakes} icon={Sparkles} color="emerald" sub="Gemma Vision" />
      <Stat label="Active Tracks" value={activeTracks} icon={Gauge} color="blue" sub="ByteTrack" />
    </div>
  );
}
