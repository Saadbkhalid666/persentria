import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  UploadCloud,
  Image as ImageIcon,
  Search,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Car,
  Users,
  Sparkles,
  Layers
} from 'lucide-react';
import { PROJECT_MODES } from '../lib/types';
import {
  scanPersonDirectory,
  scanVehicleDirectory,
  uploadPersonFiles,
  uploadVehicleFiles
} from '../lib/api';

export default function DirectoryScanner({ mode, onScanResults, isScanning, setIsScanning }) {
  const [sourceType, setSourceType] = useState('gallery'); // 'gallery' | 'path'
  const [dirPath, setDirPath] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [useAI, setUseAI] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [progress, setProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const isTraffic = mode === PROJECT_MODES.TRAFFIC;

  const handleFilesChosen = (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (valid.length === 0) {
      setError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }
    setError(null);
    setSelectedFiles(valid);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  const handleRunProcessing = async () => {
    setError(null);
    setResults(null);
    setIsScanning(true);

    try {
      let data;
      if (sourceType === 'gallery') {
        if (selectedFiles.length === 0) {
          setError('Please select at least one image file from your gallery/computer.');
          setIsScanning(false);
          return;
        }
        setProgress(`Processing ${selectedFiles.length} image(s)...`);
        data = isTraffic
          ? await uploadVehicleFiles(selectedFiles, useAI)
          : await uploadPersonFiles(selectedFiles);
      } else {
        if (!dirPath.trim()) {
          setError('Please enter a directory path or select a folder.');
          setIsScanning(false);
          return;
        }
        setProgress(`Scanning directory "${dirPath}"...`);
        data = isTraffic
          ? await scanVehicleDirectory(dirPath.trim(), useAI)
          : await scanPersonDirectory(dirPath.trim());
      }

      setResults(data);
      onScanResults(data);
      setProgress('');
    } catch (err) {
      setError(err.message || 'Processing failed. Please check backend connection.');
      setProgress('');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-4 h-full shadow-2xl overflow-y-auto">
      {/* Header & Source Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-xs font-bold text-white font-mono tracking-wide flex items-center gap-1.5">
            {isTraffic ? <Car className="w-4 h-4 text-cyan-400" /> : <Users className="w-4 h-4 text-violet-400" />}
            {isTraffic ? 'VEHICLE RECOGNITION (IMAGE & DIRECTORY)' : 'PERSON DETECTION (IMAGE & DIRECTORY)'}
          </span>
        </div>

        {/* Source Toggle Tabs */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => { setSourceType('gallery'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              sourceType === 'gallery'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Gallery / File Picker
          </button>
          <button
            onClick={() => { setSourceType('path'); setError(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              sourceType === 'path'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Folder / Path Scan
          </button>
        </div>
      </div>

      {/* Input Sections */}
      {sourceType === 'gallery' ? (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesChosen(e.target.files)}
          />

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-500/10'
                : selectedFiles.length > 0
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            {selectedFiles.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-emerald-400 font-mono">
                  ✓ {selectedFiles.length} image(s) selected
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Click to replace or add more files
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Select images from gallery or drop files here
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Supports JPG, PNG, WebP (Single or Multi-select)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesChosen(e.target.files);
                setSourceType('gallery');
              }
            }}
          />

          <div className="flex gap-2">
            <input
              type="text"
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isScanning && handleRunProcessing()}
              placeholder={isTraffic ? 'e.g. C:\\Users\\Name\\Pictures\\cars' : 'e.g. C:\\Users\\Name\\Pictures\\people'}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none transition"
              disabled={isScanning}
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
              title="Browse Folder"
            >
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              Browse
            </button>
          </div>
        </div>
      )}

      {/* AI Option for Traffic */}
      {isTraffic && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white font-mono">Gemma AI Multimodal Make & Model Recognition</div>
              <div className="text-[10px] text-slate-400">Identifies exact car manufacturer, model name, and vehicle type</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={useAI}
            onChange={(e) => setUseAI(e.target.checked)}
            className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            disabled={isScanning}
          />
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleRunProcessing}
        disabled={isScanning || (sourceType === 'gallery' ? selectedFiles.length === 0 : !dirPath.trim())}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition
          bg-linear-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 font-mono"
      >
        {isScanning ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Analyzing with AI Models...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {sourceType === 'gallery' ? `Analyze ${selectedFiles.length} Image(s)` : 'Run Directory Scan'}
          </>
        )}
      </button>

      {/* Progress / Status */}
      {progress && (
        <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl">
          <Loader className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{progress}</span>
        </div>
      )}

      {/* Error Notice */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {results && (
        <div className="space-y-3 mt-1">
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>
              Analyzed <b>{results.total_images}</b> image(s) ·{' '}
              {isTraffic ? (
                <><b>{results.total_vehicles_detected}</b> vehicle(s) recognized</>
              ) : (
                <><b>{results.total_people_detected}</b> person(s) · <b>{results.total_talking}</b> talking · <b>{results.total_drowsy}</b> drowsy alert(s)</>
              )}
            </span>
          </div>

          {/* Results Accordion List */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 custom-scroll">
            {results.results?.map((r, idx) => (
              <div key={`${r.filename}-${idx}`} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-slate-300 hover:bg-slate-800/50 transition text-left"
                  onClick={() => setExpanded(expanded === r.filename ? null : r.filename)}
                >
                  <div className="flex items-center gap-2 font-mono min-w-0">
                    {isTraffic ? <Car className="w-4 h-4 text-cyan-400 shrink-0" /> : <Users className="w-4 h-4 text-violet-400 shrink-0" />}
                    <span className="text-slate-300 font-bold truncate max-w-[200px]">{r.filename}</span>
                    <span className="text-slate-500 text-[11px] shrink-0">
                      ({isTraffic ? `${r.vehicle_count || 0} vehicle(s)` : `${r.people_count || 0} person(s)`})
                    </span>
                  </div>
                  {expanded === r.filename ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {/* Expanded Details */}
                {expanded === r.filename && (
                  <div className="px-3.5 pb-3.5 space-y-3 border-t border-slate-800/80 pt-2.5">
                    {r.thumbnail && (
                      <div className="rounded-lg overflow-hidden border border-slate-700/80">
                        <img src={r.thumbnail} alt={r.filename} className="w-full max-h-56 object-contain bg-black/50" />
                      </div>
                    )}

                    {isTraffic ? (
                      r.vehicles && r.vehicles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {r.vehicles.map((v, vIdx) => (
                            <div key={vIdx} className="flex items-start gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
                              {v.crop && (
                                <img src={v.crop} alt="crop" className="w-16 h-14 object-cover rounded-lg border border-slate-700 shrink-0" />
                              )}
                              <div className="text-[11px] font-mono space-y-1 min-w-0">
                                <div className="text-cyan-300 font-black text-xs truncate">
                                  {v.brand && v.brand !== 'Unknown' ? v.brand : 'Vehicle'} {v.model && v.model !== 'Unknown' ? v.model : ''}
                                </div>
                                <div className="text-slate-400 flex items-center gap-2">
                                  <span>Type: <b className="text-slate-200">{v.type || 'Car'}</b></span>
                                  <span>•</span>
                                  <span>Conf: <b className="text-emerald-400">{v.confidence || 'High'}</b></span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-mono py-1">No vehicles detected in this image.</div>
                      )
                    ) : (
                      r.people && r.people.length > 0 ? (
                        <div className="space-y-1.5">
                          {r.people.map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 text-xs font-mono">
                              <div className="flex items-center gap-2 font-bold text-white">
                                <Users className="w-3.5 h-3.5 text-violet-400" />
                                Person #{p.id}
                              </div>
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className={p.talking ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
                                  {p.talking ? '🗣 Talking' : '🔇 Silent'}
                                </span>
                                <span>•</span>
                                <span className={p.eyes === 'closed' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                                  {p.eyes === 'closed' ? '👁 Closed' : '👁 Open'}
                                </span>
                                <span>•</span>
                                <span className={p.drowsiness !== 'normal' ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                  {p.drowsiness !== 'normal' ? '⚠️ Drowsy' : 'Posture: ' + (p.posture || 'Normal')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 font-mono py-1">No persons detected in this image.</div>
                      )
                    )}
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
