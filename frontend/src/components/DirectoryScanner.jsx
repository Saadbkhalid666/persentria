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
  Sparkles,
  Layers
} from 'lucide-react';
import { scanVehicleDirectory, uploadVehicleFiles } from '../lib/api';

export default function DirectoryScanner({ onScanResults, isScanning, setIsScanning }) {
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
          setError('Please select at least one vehicle image from your files.');
          setIsScanning(false);
          return;
        }
        setProgress(`Processing ${selectedFiles.length} image(s) for vehicle recognition...`);
        data = await uploadVehicleFiles(selectedFiles, useAI);
      } else {
        if (!dirPath.trim()) {
          setError('Please enter a directory path or select a folder.');
          setIsScanning(false);
          return;
        }
        setProgress(`Scanning directory "${dirPath}" for vehicles...`);
        data = await scanVehicleDirectory(dirPath.trim(), useAI);
      }

      setResults(data);
      onScanResults(data);
      setProgress('');
    } catch (err) {
      setError(err.message || 'Vehicle processing failed. Please check backend connection.');
      setProgress('');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-4 h-full shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Vehicle Directory & Batch Scanner
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              Batch YOLOv11 Vehicle Detection + Multimodal Vision Make & Model Identification
            </p>
          </div>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => { setSourceType('gallery'); setError(null); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              sourceType === 'gallery'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gallery Upload
          </button>
          <button
            onClick={() => { setSourceType('path'); setError(null); }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              sourceType === 'path'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Local Directory Path
          </button>
        </div>
      </div>

      {/* Input Area */}
      {sourceType === 'gallery' ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : selectedFiles.length > 0
              ? 'border-cyan-500/50 bg-slate-950/60'
              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleFilesChosen(e.target.files)}
          />

          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            {selectedFiles.length > 0 ? <ImageIcon className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
          </div>

          <div>
            <div className="text-xs font-bold text-slate-200 font-mono">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} vehicle image(s) selected`
                : 'Click or drop vehicle images here'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Supports JPG, PNG, WebP · Max 40 images per batch
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
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
              placeholder="e.g. D:\persentria\car_photos or C:\Pictures\vehicles"
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

      {/* Multimodal AI Option */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-xs font-bold text-white font-mono">Multimodal AI Make & Model Recognition</div>
            <div className="text-[10px] text-slate-400">Identifies exact vehicle brand, model name, and body style via OpenRouter Vision</div>
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
            Analyzing with Vehicle AI Models...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            {sourceType === 'gallery' ? `Analyze ${selectedFiles.length} Vehicle Image(s)` : 'Run Directory Scan'}
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
              <b>{results.total_vehicles_detected}</b> vehicle(s) recognized
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
                    <Car className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-slate-300 font-bold truncate max-w-[240px]">{r.filename}</span>
                    <span className="text-slate-500 text-[11px] shrink-0">
                      ({r.vehicle_count || 0} vehicle(s))
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

                    {r.vehicles && r.vehicles.length > 0 ? (
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
