import React, { useState, useEffect, useCallback } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Header from './components/Header';
import Statistics from './components/Statistics';
import CameraFeed from './components/CameraFeed';
import DirectoryScanner from './components/DirectoryScanner';
import PeoplePanel from './components/PeoplePanel';
import EventLog from './components/EventLog';
import ActivityChart from './components/ActivityChart';
import { visionWS } from './lib/websocket';
import { checkBackendHealth } from './lib/api';
import { PROJECT_MODES } from './lib/types';

export default function App() {
  const [mode, setMode] = useState(PROJECT_MODES.ROOM);
  const [activeSubTab, setActiveSubTab] = useState('webcam'); // 'webcam' | 'directory'
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [events, setEvents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  // Check Flask Backend Health
  const pingBackend = useCallback(async () => {
    const health = await checkBackendHealth();
    setIsBackendOnline(health.online);
  }, []);

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 5000);
    return () => clearInterval(interval);
  }, [pingBackend]);

  // Connect & listen to WebSocket / Fallback Simulation
  useEffect(() => {
    visionWS.connect();

    const unsubscribe = visionWS.subscribe((msg) => {
      if (msg.type === 'DATA') {
        // If not using live webcam backend inference, update telemetry from simulated data
        if (!isBackendOnline || activeSubTab !== 'webcam') {
          setTelemetry((prev) => (isScanning ? prev : msg.payload));
          if (msg.payload.events && msg.payload.events.length > 0) {
            setEvents((prev) => [...msg.payload.events, ...prev].slice(0, 50));
          }
        }
      }
    });

    return () => unsubscribe();
  }, [isBackendOnline, activeSubTab, isScanning]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    visionWS.setMode(newMode);
    if (newMode === PROJECT_MODES.TRAFFIC && activeSubTab === 'webcam') {
      setActiveSubTab('directory');
    }
  };

  const handleLiveTelemetryUpdate = (newTelemetry) => {
    setTelemetry(newTelemetry);
    if (newTelemetry.events && newTelemetry.events.length > 0) {
      setEvents((prev) => [...newTelemetry.events, ...prev].slice(0, 50));
    }
  };

  const handleDirectoryScanResults = (scanData) => {
    if (mode === PROJECT_MODES.ROOM) {
      const allFoundPeople = [];
      scanData.results?.forEach((r) => {
        if (r.people) allFoundPeople.push(...r.people);
      });

      setTelemetry({
        people_count: scanData.total_people_detected,
        people: allFoundPeople,
        stats: {
          talkingCount: scanData.total_talking,
          drowsyCount: scanData.total_drowsy,
          sittingCount: allFoundPeople.filter((p) => p.posture === 'sitting').length,
          standingCount: allFoundPeople.filter((p) => p.posture === 'standing').length
        }
      });
    } else {
      setTelemetry({
        vehicles_count: scanData.total_vehicles_detected,
        vehicles: scanData.vehicles || [],
        stats: {
          totalVehicles: scanData.total_vehicles_detected,
          avgSpeed: 54,
          speedWarnings: 0
        }
      });
    }

    setEvents((prev) => [
      {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'DIRECTORY_SCAN_COMPLETED',
        message: `Successfully scanned directory: ${scanData.directory} (${scanData.total_images} images)`
      },
      ...prev
    ]);
  };

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 p-4 md:p-6 overflow-hidden">
      {/* 3D Particle Grid Background */}
      <ThreeBackground />

      {/* Main Glass Layout */}
      <div className="relative z-10 max-w-[1700px] mx-auto space-y-4">
        {/* Top Header */}
        <Header
          isBackendOnline={isBackendOnline}
          mode={mode}
          onModeChange={handleModeChange}
          activeSubTab={activeSubTab}
          onSubTabChange={setActiveSubTab}
        />

        {/* KPI Statistics */}
        <Statistics data={telemetry} mode={mode} />

        {/* Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[480px]">
          {/* Left Column (7 cols): Camera Feed OR Directory Scanner */}
          <div className="lg:col-span-7 h-full">
            {activeSubTab === 'webcam' ? (
              <CameraFeed
                data={telemetry}
                mode={mode}
                isBackendOnline={isBackendOnline}
                onTelemetryUpdate={handleLiveTelemetryUpdate}
              />
            ) : (
              <DirectoryScanner
                mode={mode}
                onScanResults={handleDirectoryScanResults}
                isScanning={isScanning}
                setIsScanning={setIsScanning}
              />
            )}
          </div>

          {/* Right Column (5 cols): Tracked Entities Panel */}
          <div className="lg:col-span-5 h-full">
            <PeoplePanel data={telemetry} mode={mode} />
          </div>
        </div>

        {/* Bottom Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[280px]">
          {/* Event Engine Terminal (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <EventLog events={events} />
          </div>

          {/* Time-Series Analytics Chart (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <ActivityChart data={telemetry} mode={mode} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-2 text-xs text-slate-500 font-mono flex items-center justify-center gap-4">
          <span>Persentria AI Scene Intelligence</span>
          <span>•</span>
          <span>Flask Backend (YOLOv11 + MediaPipe + ByteTrack + Gemma Multimodal)</span>
          <span>•</span>
          <span>React Dashboard</span>
        </footer>
      </div>
    </div>
  );
}
