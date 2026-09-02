import React from 'react';
import { Users, Car, MessageSquare, Eye, AlertTriangle, UserCheck, UserX, Activity } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';

const Stat = ({ label, value, icon: Icon, color = 'cyan', sub }) => (
  <div className="flex-1 min-w-[120px] bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4.5 h-4.5 text-${color}-400`} />
    </div>
    <div className="min-w-0">
      <div className={`text-xl font-black text-${color}-400 font-mono leading-none`}>{value}</div>
      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{label}</div>
      {sub != null && <div className="text-[9px] text-slate-600 font-mono">{sub}</div>}
    </div>
  </div>
);

export default function Statistics({ data, mode }) {
  if (mode === PROJECT_MODES.ROOM) {
    const count    = data?.people_count ?? 0;
    const talking  = data?.stats?.talkingCount  ?? 0;
    const drowsy   = data?.stats?.drowsyCount   ?? 0;
    const sitting  = data?.stats?.sittingCount  ?? 0;
    const standing = data?.stats?.standingCount ?? 0;

    return (
      <div className="flex flex-wrap gap-3">
        <Stat label="PEOPLE DETECTED" value={count}    icon={Users}         color="cyan"    />
        <Stat label="TALKING"          value={talking}  icon={MessageSquare} color="blue"    />
        <Stat label="DROWSY ALERTS"    value={drowsy}   icon={AlertTriangle} color="red"     />
        <Stat label="SITTING"          value={sitting}  icon={UserCheck}     color="emerald" />
        <Stat label="STANDING"         value={standing} icon={UserX}         color="violet"  />
      </div>
    );
  }

  // Traffic mode
  const vcount  = data?.vehicles_count ?? data?.stats?.totalVehicles ?? 0;
  const avgSpd  = data?.stats?.avgSpeed       ?? 0;
  const warns   = data?.stats?.speedWarnings  ?? 0;

  return (
    <div className="flex flex-wrap gap-3">
      <Stat label="VEHICLES DETECTED" value={vcount} icon={Car}           color="cyan"   />
      <Stat label="AVG SPEED"          value={avgSpd ? `${avgSpd} km/h` : '–'} icon={Activity}      color="blue"   />
      <Stat label="SPEED WARNINGS"     value={warns}  icon={AlertTriangle} color="red"    />
    </div>
  );
}
