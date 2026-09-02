import React, { useState } from 'react';
import { Users, Search, ListFilter, Car } from 'lucide-react';
import PersonCard from './PersonCard';
import { PROJECT_MODES } from '../lib/types';

export default function PeoplePanel({ data, mode }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const entities = mode === PROJECT_MODES.TRAFFIC ? data?.vehicles || [] : data?.people || [];

  const filteredEntities = entities.filter((item) => {
    if (search && !JSON.stringify(item).toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === 'TALKING') return item.talking;
    if (filter === 'DROWSY') return item.drowsiness !== 'normal' || item.eyes === 'closed';
    if (filter === 'MOVING') return item.movement === 'moving';
    if (filter === 'SITTING') return item.posture === 'sitting';
    if (filter === 'STANDING') return item.posture === 'standing';
    return true;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {mode === PROJECT_MODES.TRAFFIC ? <Car className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-xs tracking-wider font-mono">
              {mode === PROJECT_MODES.TRAFFIC ? 'TRACKED VEHICLES' : 'TRACKED ENTITIES'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Active Tracks: <span className="text-cyan-400 font-bold font-mono">{entities.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search ID, state, posture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition font-mono"
          />
        </div>

        {mode === PROJECT_MODES.ROOM && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['ALL', 'TALKING', 'DROWSY', 'MOVING', 'SITTING', 'STANDING'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition flex-shrink-0 border ${
                  filter === f
                    ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards List Grid */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredEntities.length > 0 ? (
          filteredEntities.map((item, idx) => (
            <PersonCard key={item.id || idx} entity={item} mode={mode} />
          ))
        ) : (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <ListFilter className="w-8 h-8 opacity-20 text-cyan-400" />
            No tracked entities matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
