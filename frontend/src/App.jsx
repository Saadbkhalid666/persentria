import React, { useState, useEffect, useCallback } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Header from './components/Header';
import Statistics from './components/Statistics';
import CameraFeed from './components/CameraFeed';
import DirectoryScanner from './components/DirectoryScanner';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import ActivityChart from './components/ActivityChart';
import { checkBackendHealth } from './lib/api';
import { PROJECT_MODES } from './lib/types';

export default function App() {
  const [mode, setMode] = useState(PROJECT_MODES.ROOM);
  const [activeSubTab, setActiveSubTab] = useState('webcam'); // 'webcam' | 'directory'
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [backendLoading, setBackendLoading] = useState(true);
  const [telemetry, setTelemetry] = useState(null);
  const [events, setEvents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // ── health ping ──────────────────────────────────────
  const pingBackend = useCallback(async () => {
    const health = await checkBackendHealth();
    setIsBackendOnline(health.online);
    setBackendLoading(false);
  }, []);

  useEffect(() => {
    pingBackend();
    const id = setInterval(pingBackend, 4000);
    return () => clearInterval(id);
  }, [pingBackend]);

  // ── mode switch → clear data ─────────────────────────
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setTelemetry(null);
    if (newMode === PROJECT_MODES.TRAFFIC && activeSubTab === 'webcam') {
      setActiveSubTab('directory');
    }
  };

  // ── live webcam telemetry from CameraFeed ────────────
  const handleLiveTelemetry = (t) => {
    setTelemetry(t);
    if (t.events?.length) {
      setEvents((prev) => [...t.events, ...prev].slice(0, 50));
    }
  };

  // ── directory scan results → telemetry ──────────────
  const handleScanResults = (scanData) => {
    if (mode === PROJECT_MODES.ROOM) {
      const allPeople = [];
      scanData.results?.forEach((r) => { if (r.people) allPeople.push(...r.people); });
      setTelemetry({
        people_count: scanData.total_people_detected || 0,
        people: allPeople,
        stats: {
          talkingCount:  scanData.total_talking || 0,
          drowsyCount:   scanData.total_drowsy  || 0,
          sittingCount:  allPeople.filter((p) => p.posture === 'sitting').length,
          standingCount: allPeople.filter((p) => p.posture === 'standing').length,
        },
      });
    } else {
      setTelemetry({
        vehicles_count: scanData.total_vehicles_detected || 0,
        vehicles:       scanData.vehicles || [],
        stats: {
          totalVehicles: scanData.total_vehicles_detected || 0,
          avgSpeed: 0,
          speedWarnings: 0,
        },
      });
    }
    const scanLabel = scanData.directory
      ? `directory "${scanData.directory}"`
      : `${scanData.total_images} image(s) from gallery`;

    setEvents((prev) => [
      {
        id:        `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type:      'DIRECTORY_SCAN_COMPLETED',
        message:   `Processed ${scanLabel} — completed successfully`,
      },
      ...prev,
    ].slice(0, 50));
  };

  // ── loading screen ───────────────────────────────────
  if (backendLoading) {
    return (
      <div className="fixed inset-0 bg-[#070913] flex flex-col items-center justify-center gap-6 z-50">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 border-2 border-[#070913] animate-ping" />
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center gap-3 text-sm font-mono text-slate-300">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            Loading AI Models…
          </div>
          <p className="text-xs text-slate-500 font-mono">YOLOv11 · MediaPipe · ByteTrack · Gemma Vision</p>
        </div>

        <div className="text-xs text-slate-600 font-mono">
          Waiting for Flask backend on :5000
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 overflow-hidden">
      <ThreeBackground />

      <div className="relative z-10 flex flex-col h-screen max-w-[1800px] mx-auto px-4 md:px-6 py-4 gap-4">
        {/* Header */}
        <Header
          isBackendOnline={isBackendOnline}
          mode={mode}
          onModeChange={handleModeChange}
          activeSubTab={activeSubTab}
          onSubTabChange={(tab) => { setActiveSubTab(tab); setTelemetry(null); }}
        />

        {/* Stats Bar */}
        <Statistics data={telemetry} mode={mode} />

        {/* Main 3-column layout */}
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Left — Camera / Directory (grows) */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="flex-1 min-h-0">
              {activeSubTab === 'webcam' ? (
                <CameraFeed
                  data={telemetry}
                  mode={mode}
                  isBackendOnline={isBackendOnline}
                  onTelemetryUpdate={handleLiveTelemetry}
                />
              ) : (
                <DirectoryScanner
                  mode={mode}
                  onScanResults={handleScanResults}
                  isScanning={isScanning}
                  setIsScanning={setIsScanning}
                />
              )}
            </div>

            {/* Bottom row: event log + chart */}
            <div className="grid grid-cols-2 gap-4" style={{ height: 240 }}>
              <EventLog events={events} />
              <ActivityChart data={telemetry} mode={mode} />
            </div>
          </div>

          {/* Right sidebar — tracked entities */}
          <div className="w-72 flex-shrink-0 min-h-0">
            <Sidebar data={telemetry} mode={mode} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-slate-600 font-mono">
          Persentria AI · YOLOv11 + MediaPipe + ByteTrack + Gemma Vision · React + Flask
        </footer>
      </div>
    </div>
  );
}
