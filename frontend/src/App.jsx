import React, { useState, useEffect } from 'react';
import ThreeBackground from './components/ThreeBackground';
import Header from './components/Header';
import Statistics from './components/Statistics';
import CameraFeed from './components/CameraFeed';
import PeoplePanel from './components/PeoplePanel';
import EventLog from './components/EventLog';
import ActivityChart from './components/ActivityChart';
import { visionWS } from './lib/websocket';
import { PROJECT_MODES } from './lib/types';

export default function App() {
  const [mode, setMode] = useState(PROJECT_MODES.ROOM);
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [events, setEvents] = useState([]);

  // Connect & listen to AI stream WebSocket
  useEffect(() => {
    visionWS.connect();

    const unsubscribe = visionWS.subscribe((msg) => {
      if (msg.type === 'STATUS') {
        setIsConnected(msg.connected);
      } else if (msg.type === 'DATA') {
        setTelemetry(msg.payload);
        if (msg.payload.events && msg.payload.events.length > 0) {
          setEvents(msg.payload.events);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    visionWS.setMode(newMode);
  };

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 p-4 md:p-6 overflow-hidden">
      {/* Interactive 3D Three.js Particle Grid Background */}
      <ThreeBackground />

      {/* Main Glassmorphic Layout Container */}
      <div className="relative z-10 max-w-[1700px] mx-auto space-y-4">
        {/* Top AI Header */}
        <Header
          isConnected={isConnected}
          mode={mode}
          onModeChange={handleModeChange}
        />

        {/* 3D KPI Statistics Cards */}
        <Statistics data={telemetry} mode={mode} />

        {/* Main Grid: Camera Feed & Tracked People Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[480px]">
          {/* Left: Camera Feed Overlay (7 cols) */}
          <div className="lg:col-span-7 h-full">
            <CameraFeed
              data={telemetry}
              mode={mode}
              isWebsocketConnected={isConnected}
            />
          </div>

          {/* Right: Tracked People / Vehicles Panel (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <PeoplePanel data={telemetry} mode={mode} />
          </div>
        </div>

        {/* Bottom Grid: Real-time Event Engine Log & Analytics Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[300px]">
          {/* Left: Event Engine Log (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <EventLog events={events} />
          </div>

          {/* Right: Time-Series Activity Chart (6 cols) */}
          <div className="lg:col-span-6 h-full">
            <ActivityChart data={telemetry} mode={mode} />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-2 text-xs text-slate-500 font-mono">
          VisionX AI Scene Intelligence Platform • Python (OpenCV, YOLO, MediaPipe, ByteTrack, FastAPI) + React Dashboard
        </footer>
      </div>
    </div>
  );
}
