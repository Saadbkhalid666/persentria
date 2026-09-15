import React, { useState, useEffect, useCallback } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Header from './components/Header';
import Statistics from './components/Statistics';
import DirectoryScanner from './components/DirectoryScanner';
import Sidebar from './components/Sidebar';
import EventLog from './components/EventLog';
import ActivityChart from './components/ActivityChart';
import { checkBackendHealth } from './lib/api';
import { VIEW_TABS, EVENT_TYPES } from './lib/types';

export default function App() {
  const [activeSubTab, setActiveSubTab] = useState(VIEW_TABS.WEBCAM);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [backendLoading, setBackendLoading] = useState(true);
  const [telemetry, setTelemetry] = useState(null);
  const [events, setEvents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Health ping
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

  // Live webcam vehicle telemetry from CameraFeed
  const handleLiveTelemetry = (t) => {
    setTelemetry(t);
    if (t.events?.length) {
      setEvents((prev) => [...t.events, ...prev].slice(0, 50));
    }
  };

  // Directory / Batch scan results
  const handleScanResults = (scanData) => {
    setTelemetry({
      vehicles_count: scanData.total_vehicles_detected || 0,
      vehicles: scanData.vehicles || [],
      stats: {
        totalVehicles: scanData.total_vehicles_detected || 0,
        activeTracks: scanData.total_vehicles_detected || 0,
        avgSpeed: 0,
        speedWarnings: 0,
      },
    });

    const scanLabel = scanData.directory
      ? `directory "${scanData.directory}"`
      : `${scanData.total_images} image(s) from gallery`;

    setEvents((prev) => [
      {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: EVENT_TYPES.DIRECTORY_SCAN_COMPLETED,
        message: `Processed ${scanLabel} — ${scanData.total_vehicles_detected || 0} vehicle(s) recognized`,
      },
      ...prev,
    ].slice(0, 50));
  };

  // Loading screen
  if (backendLoading) {
    return (
      <div className="fixed inset-0 bg-[#070913] flex flex-col items-center justify-center gap-6 z-50">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-cyan-500/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 border-2 border-[#070913] animate-ping" />
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center gap-3 text-sm font-mono text-slate-300">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            Loading Vehicle AI Models…
          </div>
          <p className="text-xs text-slate-500 font-mono">YOLOv11 · ByteTrack · Multimodal Vision AI</p>
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
          activeSubTab={activeSubTab}
          onSubTabChange={(tab) => {
            setActiveSubTab(tab);
            setTelemetry(null);
          }}
        />

        {/* Stats Bar */}
        <Statistics data={telemetry} />

        {/* Main 3-column layout */}
        <div className="flex flex-1 gap-4 min-h-0">
          {/* Left / Center — Camera or Directory Scanner */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            <div className="flex-1 min-h-0">
               
              <DirectoryScanner
                onScanResults={handleScanResults}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
              />

            </div>

            {/* Bottom row: event log + chart */}
            <div className="grid grid-cols-2 gap-4" style={{ height: 240 }}>
              <EventLog events={events} />
              <ActivityChart data={telemetry} />
            </div>
          </div>

          {/* Right sidebar — tracked vehicles */}
          <div className="w-72 shrink-0 min-h-0">
            <Sidebar data={telemetry} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-[10px] text-slate-600 font-mono">
          Persentria AI · Real-Time Vehicle Intelligence Platform · YOLOv11 + ByteTrack + Gemma Multimodal AI
        </footer>
      </div>
    </div>
  );
}
