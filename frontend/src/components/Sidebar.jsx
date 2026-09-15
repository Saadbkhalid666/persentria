import React from 'react';
import { Car, Gauge, Info, Layers } from 'lucide-react';

const COLORS = {
  cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  slate: 'bg-slate-800 border-slate-700 text-slate-400',
};

function Badge({ label, color = 'slate', Icon }) {
  const cls = COLORS[color] || COLORS.slate;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border ${cls}`}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {label}
    </span>
  );
}

function VehicleCard({ vehicle }) {
  const hasMake = vehicle.brand && vehicle.brand !== 'Unknown';
  const hasModel = vehicle.model && vehicle.model !== 'Unknown';
  const label = hasMake ? vehicle.brand : 'Vehicle';
  const sub = hasModel ? vehicle.model : (vehicle.type || 'Car');

  return (
    <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl p-3 space-y-2 hover:border-cyan-500/50 transition">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-white font-mono">{label}</div>
          <div className="text-[10px] text-cyan-400 font-mono font-semibold">{sub}</div>
        </div>
        <div className="text-[9px] text-slate-500 font-mono shrink-0">#{vehicle.id}</div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge label={vehicle.type || 'Car'} color="cyan" Icon={Car} />
        <Badge label={vehicle.confidence || 'Detected'} color="emerald" Icon={Gauge} />
        {vehicle.movement && (
          <Badge label={vehicle.movement} color="violet" />
        )}
      </div>

      {vehicle.image_name && (
        <div className="text-[9px] text-slate-500 font-mono truncate">📁 {vehicle.image_name}</div>
      )}

      {vehicle.crop && (
        <img
          src={vehicle.crop}
          alt={`${label} crop`}
          className="w-full h-20 object-cover rounded-lg border border-slate-700/80"
        />
      )}
    </div>
  );
}

export default function Sidebar({ data }) {
  const vehicles = data?.vehicles || [];
  const isEmpty = vehicles.length === 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <Car className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-white font-mono tracking-wide">
          TRACKED VEHICLES
        </span>
        <span className="ml-auto text-[10px] text-cyan-400 font-mono font-bold bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded-full">
          {vehicles.length}
        </span>
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scroll">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <Info className="w-8 h-8" />
            <p className="text-xs font-mono text-center leading-relaxed">
              No vehicles detected yet.<br />Enable camera feed or run a scan.
            </p>
          </div>
        ) : (
          vehicles.map((v, i) => <VehicleCard key={`${v.id}-${i}`} vehicle={v} />)
        )}
      </div>

      {/* Footer count */}
      {!isEmpty && (
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-right">
          {vehicles.length} vehicle(s) tracked
        </div>
      )}
    </div>
  );
}
