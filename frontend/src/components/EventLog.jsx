import React, { useState } from 'react';
import { Terminal, Download, Trash2, ShieldAlert, Info, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EventLog({ events = [] }) {
  const [logList, setLogList] = useState(events);
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  // Sync incoming events
  React.useEffect(() => {
    if (events && events.length > 0) {
      setLogList((prev) => {
        const combined = [...events, ...prev];
        // Keep last 50 events
        return combined.slice(0, 50);
      });
    }
  }, [events]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `visionx-event-log-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = logList.filter((log) => {
    if (filterSeverity === 'ALERTS') return log.type?.includes('DROWSY') || log.type?.includes('WARNING') || log.type?.includes('SLEEPING');
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200 text-sm tracking-wide">REAL-TIME EVENT ENGINE LOG</h3>
            <p className="text-xs text-slate-400">Chronological Event Stream</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterSeverity(filterSeverity === 'ALL' ? 'ALERTS' : 'ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${filterSeverity === 'ALERTS' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            {filterSeverity === 'ALERTS' ? 'Alerts Only' : 'All Events'}
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400 transition"
            title="Export Event JSON Log"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setLogList([])}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 transition"
            title="Clear Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-1">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isAlert = log.type?.includes('DROWSY') || log.type?.includes('WARNING') || log.type?.includes('SLEEPING');
            const isSuccess = log.type?.includes('SMILING') || log.type?.includes('ENTERED');

            return (
              <div
                key={log.id || Math.random()}
                className={`p-2 rounded-lg border flex items-start gap-2.5 transition ${isAlert ? 'bg-red-950/20 border-red-500/30 text-red-300' : isSuccess ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-300'}`}
              >
                <div className="mt-0.5">
                  {isAlert ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                  ) : isSuccess ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
                    <span className="text-cyan-400/80 font-bold">{log.type}</span>
                    <span>{log.timestamp || new Date().toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200">{log.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2 font-sans">
            <Terminal className="w-8 h-8 opacity-30 text-cyan-400" />
            Waiting for AI Event Engine observations...
          </div>
        )}
      </div>
    </div>
  );
}
