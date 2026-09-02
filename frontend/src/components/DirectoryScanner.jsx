import React, { useState } from 'react';
import { FolderOpen, Search, CheckCircle, AlertCircle, Loader, ChevronDown, ChevronUp, Car, Users, Eye } from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';
import { scanPersonDirectory, scanVehicleDirectory } from '../lib/api';

export default function DirectoryScanner({ mode, onScanResults, isScanning, setIsScanning }) {
  const [dirPath, setDirPath]       = useState('');
  const [error, setError]           = useState(null);
  const [results, setResults]       = useState(null);
  const [expanded, setExpanded]     = useState(null); // image name
  const [useAI, setUseAI]           = useState(true);
  const [progress, setProgress]     = useState('');

  const isTraffic = mode === PROJECT_MODES.TRAFFIC;

  const handleScan = async () => {
    if (!dirPath.trim()) { setError('Please enter a directory path.'); return; }
    setError(null);
    setResults(null);
    setIsScanning(true);
    setProgress('Sending scan request…');

    try {
      const data = isTraffic
        ? await scanVehicleDirectory(dirPath.trim(), useAI)
        : await scanPersonDirectory(dirPath.trim());

      setResults(data);
      onScanResults(data);
      setProgress('');
    } catch (err) {
      setError(err.message || 'Scan failed. Check directory path and backend.');
      setProgress('');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-4 h-full shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <div className="w-2 h-2 rounded-full bg-violet-400" />
        <FolderOpen className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold text-white font-mono tracking-wide">
          {isTraffic ? 'VEHICLE DIRECTORY SCAN' : 'PERSON DIRECTORY SCAN'}
        </span>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          Directory Path
        </label>
        <input
          type="text"
          value={dirPath}
          onChange={(e) => setDirPath(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleScan()}
          placeholder={isTraffic ? 'C:\\images\\vehicles' : 'C:\\images\\people'}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition"
          disabled={isScanning}
        />

        {isTraffic && (
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="accent-cyan-500"
              disabled={isScanning}
            />
            Enable Gemma AI Vehicle Recognition (brand + model)
          </label>
        )}

        <button
          onClick={handleScan}
          disabled={isScanning || !dirPath.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition
            bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
        >
          {isScanning
            ? <><Loader className="w-4 h-4 animate-spin" /> Scanning…</>
            : <><Search className="w-4 h-4" /> Start Scan</>
          }
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
          <Loader className="w-3 h-3 animate-spin" /> {progress}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results summary */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              Scanned <b>{results.total_images}</b> images ·{' '}
              {isTraffic
                ? <><b>{results.total_vehicles_detected}</b> vehicles detected</>
                : <><b>{results.total_people_detected}</b> persons · <b>{results.total_talking}</b> talking · <b>{results.total_drowsy}</b> drowsy</>
              }
            </span>
          </div>

          {/* Per-image accordion */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scroll">
            {results.results?.map((r) => (
              <div key={r.filename} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                {/* row header */}
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/50 transition"
                  onClick={() => setExpanded(expanded === r.filename ? null : r.filename)}
                >
                  <div className="flex items-center gap-2 font-mono">
                    {isTraffic ? <Car className="w-3.5 h-3.5 text-cyan-400" /> : <Users className="w-3.5 h-3.5 text-violet-400" />}
                    <span className="text-slate-400 truncate max-w-[140px]">{r.filename}</span>
                    <span className="text-slate-600">
                      {isTraffic ? `${r.vehicle_count} vehicle(s)` : `${r.people_count} person(s)`}
                    </span>
                  </div>
                  {expanded === r.filename ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* expanded detail */}
                {expanded === r.filename && (
                  <div className="px-3 pb-3 space-y-2">
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt={r.filename} className="w-full rounded-lg object-cover border border-slate-700 max-h-36" />
                    )}

                    {isTraffic
                      ? r.vehicles?.map((v, i) => (
                          <div key={i} className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-2">
                            {v.crop && (
                              <img src={v.crop} alt="crop" className="w-14 h-12 object-cover rounded border border-slate-700 shrink-0" />
                            )}
                            <div className="text-[10px] font-mono space-y-0.5">
                              <div className="text-cyan-300 font-bold">{v.brand || 'Unknown'} {v.model || ''}</div>
                              <div className="text-slate-500">Type: {v.type || 'Car'}</div>
                              <div className="text-slate-500">Confidence: {v.confidence || '–'}</div>
                            </div>
                          </div>
                        ))
                      : r.people?.map((p, i) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-2 text-[10px] font-mono">
                            <Users className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <div className="space-y-0.5">
                              <div className="text-white font-bold">Person #{p.id}</div>
                              <div className="text-slate-400">
                                {p.talking ? '🗣 Talking' : '🔇 Silent'} ·{' '}
                                {p.eyes === 'closed' ? '👁 Closed' : '👁 Open'} ·{' '}
                                {p.drowsiness !== 'normal' ? '⚠ Drowsy' : '✅ Normal'}
                              </div>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
