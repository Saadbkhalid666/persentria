import React, { useState } from 'react';
import { Folder, UploadCloud, Search, Eye, Sparkles, CheckCircle2, AlertTriangle, Users, Car, RefreshCw, X } from 'lucide-react';
import { scanPersonDirectory, scanVehicleDirectory, uploadPersonImage, uploadVehicleImage } from '../lib/api';
import { PROJECT_MODES } from '../lib/types';

export default function DirectoryScanner({ mode, onScanResults, isScanning, setIsScanning }) {
  const [dirPath, setDirPath] = useState('d:\\persentria\\backend');
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [uploadMode, setUploadMode] = useState(false);
  const [aiRecognition, setAiRecognition] = useState(true);

  const handleScan = async () => {
    if (!dirPath.trim()) return;
    setIsScanning(true);
    setError(null);

    try {
      let data;
      if (mode === PROJECT_MODES.ROOM) {
        data = await scanPersonDirectory(dirPath);
      } else {
        data = await scanVehicleDirectory(dirPath, aiRecognition);
      }
      setResultsData(data);
      if (onScanResults) onScanResults(data);
    } catch (err) {
      setError(err.message || 'Failed to scan directory');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError(null);

    try {
      let data;
      if (mode === PROJECT_MODES.ROOM) {
        data = await uploadPersonImage(file);
      } else {
        data = await uploadVehicleImage(file);
      }
      setSelectedItem(data);
    } catch (err) {
      setError(err.message || 'Failed to process uploaded file');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            {mode === PROJECT_MODES.ROOM ? <Users className="w-5 h-5" /> : <Car className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {mode === PROJECT_MODES.ROOM ? 'Person Batch Directory Scanner' : 'Vehicle Recognition Directory Scanner'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === PROJECT_MODES.ROOM
                ? 'Scan local images for people tracking, eye state, talking & posture'
                : 'Scan vehicle images with YOLO tracking and Gemma Multimodal AI Make/Model recognition'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploadMode(!uploadMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              uploadMode
                ? 'bg-violet-600 text-white border-violet-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            {uploadMode ? 'Switch to Directory' : 'Upload Single Image'}
          </button>
        </div>
      </div>

      {/* Directory Path Input or File Upload */}
      {!uploadMode ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Folder className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
              placeholder="e.g. d:\persentria\backend or C:\images"
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 font-mono focus:outline-none transition"
            />
          </div>

          {mode === PROJECT_MODES.TRAFFIC && (
            <label className="flex items-center gap-2 text-xs text-slate-300 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={aiRecognition}
                onChange={(e) => setAiRecognition(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Make/Model Recognition
            </label>
          )}

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scan Directory
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-6 text-center bg-slate-950/40 transition flex flex-col items-center justify-center">
          <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
          <p className="text-xs text-slate-300 font-medium mb-1">Drag and drop or select an image to inspect</p>
          <p className="text-[10px] text-slate-500 mb-3">Supports JPG, PNG, WEBP</p>
          <label className="cursor-pointer px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-cyan-400 font-semibold transition">
            Choose File
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Summary Bar */}
      {resultsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Images Processed</div>
            <div className="text-lg font-bold text-white font-mono">{resultsData.total_images || 0}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">
              {mode === PROJECT_MODES.ROOM ? 'People Detected' : 'Vehicles Detected'}
            </div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {mode === PROJECT_MODES.ROOM ? resultsData.total_people_detected : resultsData.total_vehicles_detected}
            </div>
          </div>
          {mode === PROJECT_MODES.ROOM ? (
            <>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Talking Active</div>
                <div className="text-lg font-bold text-violet-400 font-mono">{resultsData.total_talking || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Drowsiness Risks</div>
                <div className="text-lg font-bold text-red-400 font-mono">{resultsData.total_drowsy || 0}</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">AI Recognized</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">
                  {resultsData.vehicles?.filter((v) => v.make && v.make !== 'Vehicle').length || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Recognition Engine</div>
                <div className="text-xs font-bold text-amber-400 font-mono mt-1">Gemma-4 Multimodal</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {resultsData && resultsData.results && resultsData.results.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Detection Gallery ({resultsData.results.length} items)</span>
            <span className="text-[10px] text-slate-500">Click any card to inspect full resolution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
            {resultsData.results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedItem(item)}
                className="group relative bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 rounded-xl overflow-hidden cursor-pointer transition shadow-sm hover:shadow-cyan-500/10"
              >
                <div className="aspect-video w-full bg-black/40 overflow-hidden relative">
                  <img
                    src={item.thumbnail}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                    {mode === PROJECT_MODES.ROOM
                      ? `${item.people_count || 0} People`
                      : `${item.vehicle_count || 0} Vehicles`}
                  </div>
                </div>

                <div className="p-2.5">
                  <div className="text-xs font-semibold text-slate-200 truncate">{item.filename}</div>
                  {mode === PROJECT_MODES.TRAFFIC && item.vehicles && item.vehicles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.vehicles.map((v, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800"
                        >
                          {v.brand_model || `Car #${v.id}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspector Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">{selectedItem.filename || 'Processed Image Preview'}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                <img
                  src={selectedItem.thumbnail || selectedItem.annotated_image}
                  alt="Detection preview"
                  className="max-h-[450px] w-auto object-contain"
                />
              </div>

              {/* Vehicle AI detail if present */}
              {selectedItem.vehicles && selectedItem.vehicles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Detected Vehicles & AI Classification
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedItem.vehicles.map((v, i) => (
                      <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start gap-3">
                        {v.crop && (
                          <img src={v.crop} alt="Vehicle crop" className="w-16 h-16 rounded-lg object-cover border border-slate-700" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-cyan-400">{v.brand_model || `Vehicle #${v.id}`}</div>
                          <div className="text-[11px] text-slate-400">Type: {v.type}</div>
                          {v.ai_raw_output && (
                            <div className="mt-1 text-[10px] text-slate-500 font-mono whitespace-pre-line line-clamp-3 bg-slate-900 p-1.5 rounded">
                              {v.ai_raw_output}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
