import { EVENT_TYPES, PROJECT_MODES } from './types';

class VisionWebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.mode = PROJECT_MODES.ROOM;
    this.simulationInterval = null;
    this.simulatedPeople = [
      {
        id: 1,
        name: 'Track #101',
        bbox: [120, 80, 260, 380], // x1, y1, width, height
        talking: true,
        smiling: false,
        eyes: 'open',
        movement: 'moving',
        posture: 'standing',
        confidence: 0.96,
        drowsiness: 'normal',
        activityScore: 84,
        faceLandmarks: Array.from({ length: 10 }, (_, i) => ({ x: 190 + Math.sin(i) * 35, y: 140 + Math.cos(i) * 30 }))
      },
      {
        id: 2,
        name: 'Track #102',
        bbox: [320, 110, 240, 360],
        talking: false,
        smiling: true,
        eyes: 'open',
        movement: 'stationary',
        posture: 'sitting',
        confidence: 0.92,
        drowsiness: 'normal',
        activityScore: 45,
        faceLandmarks: Array.from({ length: 10 }, (_, i) => ({ x: 390 + Math.sin(i) * 30, y: 160 + Math.cos(i) * 25 }))
      },
      {
        id: 3,
        name: 'Track #103',
        bbox: [540, 140, 220, 320],
        talking: false,
        smiling: false,
        eyes: 'closed',
        movement: 'stationary',
        posture: 'sitting',
        confidence: 0.89,
        drowsiness: 'possible drowsiness',
        activityScore: 12,
        faceLandmarks: Array.from({ length: 10 }, (_, i) => ({ x: 610 + Math.sin(i) * 25, y: 190 + Math.cos(i) * 20 }))
      }
    ];

    this.simulatedVehicles = [
      {
        id: 101,
        type: 'Car',
        make: 'Tesla',
        model: 'Model 3',
        bbox: [140, 200, 220, 140],
        speedKmh: 58,
        direction: 'Northbound',
        confidence: 0.98,
        color: 'Cyan'
      },
      {
        id: 102,
        type: 'Truck',
        make: 'Volvo',
        model: 'FH16',
        bbox: [410, 180, 280, 180],
        speedKmh: 42,
        direction: 'Southbound',
        confidence: 0.94,
        color: 'Silver'
      }
    ];
  }

  connect(url = 'ws://localhost:8000/ws') {
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.stopSimulation();
        this.notify({ type: 'STATUS', connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notify({ type: 'DATA', payload: data });
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.socket.onerror = () => {
        this.handleConnectionFallback();
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.handleConnectionFallback();
      };
    } catch {
      this.handleConnectionFallback();
    }
  }

  handleConnectionFallback() {
    this.isConnected = false;
    this.notify({ type: 'STATUS', connected: false, mode: 'SIMULATION' });
    this.startSimulation();
  }

  setMode(newMode) {
    this.mode = newMode;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(data) {
    this.listeners.forEach((listener) => listener(data));
  }

  startSimulation() {
    if (this.simulationInterval) return;

    let frameCount = 0;
    this.simulationInterval = setInterval(() => {
      frameCount++;

      if (this.mode === PROJECT_MODES.ROOM) {
        // Animate simulation coordinates for Room mode
        this.simulatedPeople = this.simulatedPeople.map((person) => {
          const dx = Math.sin(frameCount * 0.1 + person.id) * 3;
          const dy = Math.cos(frameCount * 0.08 + person.id) * 2;
          const newBbox = [
            Math.max(40, Math.min(600, person.bbox[0] + dx)),
            Math.max(40, Math.min(300, person.bbox[1] + dy)),
            person.bbox[2],
            person.bbox[3]
          ];

          // Dynamic state changes every few frames
          const isTalking = person.id === 1 ? Math.sin(frameCount * 0.2) > -0.2 : Math.sin(frameCount * 0.15 + person.id) > 0.6;
          const isSmiling = person.id === 2 ? Math.cos(frameCount * 0.1) > -0.5 : Math.sin(frameCount * 0.25) > 0.7;
          const isDrowsy = person.id === 3 && (frameCount % 40 > 20);

          return {
            ...person,
            bbox: newBbox,
            talking: isTalking,
            smiling: isSmiling,
            eyes: isDrowsy ? 'closed' : 'open',
            drowsiness: isDrowsy ? 'possible drowsiness' : 'normal',
            movement: Math.abs(dx) > 1.5 ? 'moving' : 'stationary',
            faceLandmarks: person.faceLandmarks.map((pt, i) => ({
              x: newBbox[0] + 70 + Math.sin(frameCount * 0.2 + i) * 15,
              y: newBbox[1] + 60 + Math.cos(frameCount * 0.2 + i) * 12
            }))
          };
        });

        // Generate synthetic event occasionally
        let events = [];
        if (frameCount % 15 === 0) {
          const randomPerson = this.simulatedPeople[Math.floor(Math.random() * this.simulatedPeople.length)];
          const sampleEvents = [
            { type: EVENT_TYPES.PERSON_TALKING_START, message: `Person #${randomPerson.id} started talking`, person_id: randomPerson.id },
            { type: EVENT_TYPES.PERSON_SMILING, message: `Person #${randomPerson.id} detected smiling`, person_id: randomPerson.id },
            { type: EVENT_TYPES.POSTURE_CHANGE, message: `Person #${randomPerson.id} changed posture to ${randomPerson.posture}`, person_id: randomPerson.id }
          ];

          if (randomPerson.drowsiness !== 'normal') {
            sampleEvents.push({ type: EVENT_TYPES.PERSON_DROWSY_ALERT, message: `⚠️ Possible drowsiness detected for Person #${randomPerson.id}`, person_id: randomPerson.id });
          }

          const evt = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
          events.push({
            id: `evt-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            ...evt
          });
        }

        const payload = {
          timestamp: Date.now(),
          fps: 28 + Math.floor(Math.sin(frameCount) * 3),
          latencyMs: 14 + Math.floor(Math.random() * 6),
          people_count: this.simulatedPeople.length,
          people: this.simulatedPeople,
          events: events,
          stats: {
            talkingCount: this.simulatedPeople.filter((p) => p.talking).length,
            smilingCount: this.simulatedPeople.filter((p) => p.smiling).length,
            drowsyCount: this.simulatedPeople.filter((p) => p.drowsiness !== 'normal').length,
            movingCount: this.simulatedPeople.filter((p) => p.movement === 'moving').length
          }
        };

        this.notify({ type: 'DATA', payload });

      } else if (this.mode === PROJECT_MODES.TRAFFIC) {
        // Animate traffic simulation
        this.simulatedVehicles = this.simulatedVehicles.map((vehicle) => {
          let newX = vehicle.bbox[0] + (vehicle.direction === 'Northbound' ? 4 : -4);
          if (newX > 650) newX = 40;
          if (newX < 40) newX = 650;

          return {
            ...vehicle,
            bbox: [newX, vehicle.bbox[1], vehicle.bbox[2], vehicle.bbox[3]],
            speedKmh: Math.max(30, Math.min(95, vehicle.speedKmh + Math.floor(Math.sin(frameCount * 0.3) * 4)))
          };
        });

        const payload = {
          timestamp: Date.now(),
          fps: 30,
          latencyMs: 12,
          vehicles_count: this.simulatedVehicles.length,
          vehicles: this.simulatedVehicles,
          events: frameCount % 20 === 0 ? [{
            id: `veh-evt-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            type: EVENT_TYPES.VEHICLE_SPEED_WARNING,
            message: `⚡ ${this.simulatedVehicles[0].make} ${this.simulatedVehicles[0].model} estimated speed: ${this.simulatedVehicles[0].speedKmh} km/h`
          }] : [],
          stats: {
            totalVehicles: this.simulatedVehicles.length,
            avgSpeed: Math.round(this.simulatedVehicles.reduce((acc, v) => acc + v.speedKmh, 0) / this.simulatedVehicles.length),
            speedWarnings: this.simulatedVehicles.filter(v => v.speedKmh > 70).length
          }
        };

        this.notify({ type: 'DATA', payload });
      }
    }, 150);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

export const visionWS = new VisionWebSocketClient();
