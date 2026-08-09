import React, { useState } from 'react';
import { Users, Filter, Search, LayoutGrid, ListFilter } from 'lucide-react';
import PersonCard from './PersonCard';
import { PROJECT_MODES } from '../lib/types';

export default function PeoplePanel({ data, mode }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const entities = mode === PROJECT_MODES.TRAFFIC ? (data?.vehicles || []) : (data?.people || []);

  const filteredEntities = entities.filter((item) => {
    if (search && !JSON.stringify(item).toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === 'TALKING') return item.talking;
    if (filter === 'SMILING') return item.smiling;
    if (filter === 'DROWSY') return item.drowsiness !== 'normal' || item.eyes === 'closed';
    if (filter === 'MOVING') return item.movement === 'moving';
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">
              {mode === PROJECT_MODES.TRAFFIC ? 'TRACKED VEHICLES' : 'TRACKED PEOPLE'}
            </h3>
            <p className="text-xs text-slate-400">
              Active Tracks: <span className="text-cyan-400 font-bold">{entities.length}</span>
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
            placeholder="Filter ID, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {mode === PROJECT_MODES.ROOM && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
            {['ALL', 'TALKING', 'SMILING', 'DROWSY', 'MOVING'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition flex-shrink-0 ${filter === f ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'}`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards List Grid */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {filteredEntities.length > 0 ? (
          filteredEntities.map((item) => (
            <PersonCard key={item.id} entity={item} mode={mode} />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <ListFilter className="w-8 h-8 opacity-30 text-cyan-400" />
            No tracked entities matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
