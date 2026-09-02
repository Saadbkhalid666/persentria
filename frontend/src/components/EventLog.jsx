import React, { useRef, useEffect } from 'react';
import { Terminal, Info } from 'lucide-react';

const TYPE_STYLES = {
  PERSON_ENTERED:          { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  PERSON_LEFT:             { dot: 'bg-rose-400',    text: 'text-rose-400'    },
  PERSON_DROWSY_ALERT:     { dot: 'bg-red-400 animate-pulse', text: 'text-red-400' },
  DIRECTORY_SCAN_COMPLETED:{ dot: 'bg-violet-400',  text: 'text-violet-400'  },
  default:                 { dot: 'bg-cyan-400',    text: 'text-cyan-400'    },
};

export default function EventLog({ events = [] }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full shadow-xl">
      {/* header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800 mb-2">
        <Terminal className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-bold text-white font-mono tracking-wide uppercase">Event Log</span>
        <span className="ml-auto text-[9px] text-slate-600 font-mono">{events.length} events</span>
      </div>

      {/* log entries */}
      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] custom-scroll pr-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-700">
            <Info className="w-5 h-5" />
            <p className="text-center">No events yet.<br/>Start a webcam stream or directory scan.</p>
          </div>
        ) : (
          events.map((ev) => {
            const style = TYPE_STYLES[ev.type] || TYPE_STYLES.default;
            return (
              <div key={ev.id} className="flex items-start gap-2 py-0.5">
                <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${style.dot}`} />
                <span className="text-slate-600 shrink-0">{ev.timestamp}</span>
                <span className={`${style.text} leading-tight`}>{ev.message}</span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
