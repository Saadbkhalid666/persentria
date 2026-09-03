import React from 'react';
import { Users, Car, MessageSquare, Eye, AlertTriangle, Activity, Gauge, Info } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

function PersonCard({ person }) {
  const isDrowsy  = person.drowsiness !== 'normal';
  const isTalking = person.talking;
  const eyeOpen   = person.eyes !== 'closed';

  const borderColor = isDrowsy  ? 'border-red-500/50'
                    : isTalking ? 'border-cyan-500/40'
                    :              'border-slate-700/50';
  const dotColor    = isDrowsy  ? 'bg-red-400 animate-pulse'
                    : isTalking ? 'bg-cyan-400 animate-pulse'
                    :              'bg-emerald-500';

  return (
    <div className={`bg-slate-900/70 border ${borderColor} rounded-xl p-3 space-y-2`}>
      {/* header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className="text-xs font-bold text-white font-mono">Person #{person.id}</span>
        </div>
        {isDrowsy && (
          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-mono">
            <AlertTriangle className="w-2.5 h-2.5" /> DROWSY
          </span>
        )}
      </div>

      {/* status pills */}
      <div className="flex flex-wrap gap-1">
        <Badge
          label={isTalking ? 'Talking' : 'Silent'}
          color={isTalking ? 'blue' : 'slate'}
          Icon={MessageSquare}
        />
        <Badge
          label={eyeOpen ? 'Eyes Open' : 'Eyes Closed'}
          color={eyeOpen ? 'emerald' : 'red'}
          Icon={Eye}
        />
        {person.posture && (
          <Badge label={person.posture} color="violet" Icon={Activity} />
        )}
      </div>

      {/* micro metrics */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-500">
        {person.blinks != null && <MiniStat k="Blinks" v={person.blinks} />}
        {person.closed_duration != null && person.closed_duration > 0 && (
          <MiniStat k="Eyes closed" v={`${person.closed_duration}s`} />
        )}
        {person.mouth_ratio != null && person.mouth_ratio > 0 && (
          <MiniStat k="Mouth open" v={`${Math.round(person.mouth_ratio * 100)}%`} />
        )}
        {person.movement && <MiniStat k="Motion" v={person.movement} />}
      </div>
    </div>
  );
}

// ── Vehicle card ─────────────────────────────────────
function VehicleCard({ vehicle }) {
  const hasMake  = vehicle.brand  && vehicle.brand  !== 'Unknown';
  const hasModel = vehicle.model  && vehicle.model  !== 'Unknown';
  const label    = hasMake  ? vehicle.brand  : 'Vehicle';
  const sub      = hasModel ? vehicle.model  : (vehicle.type || 'Car');

  return (
    <div className="bg-slate-900/70 border border-cyan-500/20 rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-bold text-white font-mono">{label}</div>
          <div className="text-[10px] text-cyan-400 font-mono">{sub}</div>
        </div>
        <div className="text-[9px] text-slate-500 font-mono shrink-0">#{vehicle.id}</div>
      </div>

      <div className="flex flex-wrap gap-1">
        <Badge label={vehicle.type  || 'Car'}  color="cyan"    Icon={Car}   />
        <Badge label={vehicle.confidence || '–'} color="violet" Icon={Gauge} />
      </div>

      {vehicle.image_name && (
        <div className="text-[9px] text-slate-600 font-mono truncate">📁 {vehicle.image_name}</div>
      )}

      {vehicle.crop && (
        <img
          src={vehicle.crop}
          alt={`${label} crop`}
          className="w-full h-16 object-cover rounded-lg border border-slate-700"
        />
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────
const COLORS = {
  cyan:    'bg-cyan-500/10    border-cyan-500/20    text-cyan-400',
  blue:    'bg-blue-500/10    border-blue-500/20    text-blue-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  violet:  'bg-violet-500/10  border-violet-500/20  text-violet-400',
  red:     'bg-red-500/10     border-red-500/20     text-red-400',
  slate:   'bg-slate-700/40   border-slate-700      text-slate-400',
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

function MiniStat({ k, v }) {
  return (
    <div>
      <span className="text-slate-600">{k}: </span>
      <span className="text-slate-400">{v}</span>
    </div>
  );
}

// ── Main sidebar ─────────────────────────────────────
export default function Sidebar({ data, mode }) {
  const isEmpty = !data;

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-3">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
        {mode === PROJECT_MODES.ROOM
          ? <Users className="w-4 h-4 text-violet-400" />
          : <Car   className="w-4 h-4 text-cyan-400"   />
        }
        <span className="text-xs font-bold text-white font-mono tracking-wide">
          {mode === PROJECT_MODES.ROOM ? 'TRACKED PERSONS' : 'DETECTED VEHICLES'}
        </span>
      </div>

      {/* entity list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scroll">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
            <Info className="w-8 h-8" />
            <p className="text-xs font-mono text-center">
              {mode === PROJECT_MODES.ROOM
                ? 'No persons detected yet.\nEnable webcam or run a directory scan.'
                : 'No vehicles detected yet.\nRun a directory scan.'}
            </p>
          </div>
        ) : mode === PROJECT_MODES.ROOM ? (
          (data.people?.length ? (
            data.people.map((p) => <PersonCard key={p.id} person={p} />)
          ) : (
            <div className="text-center text-xs text-slate-600 font-mono mt-6">
              No persons in frame
            </div>
          ))
        ) : (
          (data.vehicles?.length ? (
            data.vehicles.map((v, i) => <VehicleCard key={`${v.id}-${i}`} vehicle={v} />)
          ) : (
            <div className="text-center text-xs text-slate-600 font-mono mt-6">
              No vehicles found
            </div>
          ))
        )}
      </div>

      {/* footer count */}
      {!isEmpty && (
        <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-right">
          {mode === PROJECT_MODES.ROOM
            ? `${data.people?.length ?? 0} person(s) tracked`
            : `${data.vehicles?.length ?? 0} vehicle(s) detected`}
        </div>
      )}
    </div>
  );
}
