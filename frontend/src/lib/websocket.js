import { PROJECT_MODES } from './types';

class VisionWebSocketClient {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.mode = PROJECT_MODES.ROOM;
  }

  connect(url = 'ws://localhost:5000/ws') {
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.isConnected = true;
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
        this.isConnected = false;
        this.notify({ type: 'STATUS', connected: false });
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notify({ type: 'STATUS', connected: false });
      };
    } catch {
      this.isConnected = false;
      this.notify({ type: 'STATUS', connected: false });
    }
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
}

export const visionWS = new VisionWebSocketClient();
