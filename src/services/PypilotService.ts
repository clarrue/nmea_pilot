import TcpSocket from 'react-native-tcp-socket';
import {ConnectionManager} from './ConnectionManager';
import {useBoatStore} from '../store/useBoatStore';
import {PYPILOT_WATCH_KEYS} from '../store/slices/pypilot.slice';
import {normalizeHeading} from '../utils/headingMath';

// Watch interval in seconds for each key
const WATCH_INTERVALS: Record<string, number> = {
  'ap.heading': 0.2,
  'ap.heading_command': 0.5,
  'ap.enabled': 1,
  'ap.mode': 1,
  'rudder.angle': 0.2,
  'imu.pitch': 0.5,
  'imu.roll': 0.5,
  'imu.heel': 0.5,
  'imu.rate': 0.2,
  'servo.engaged': 1,
  'servo.amps': 1,
  'ap.tack.state': 1,
  'ap.tack.direction': 1,
  'wind.angle': 0.5,
  'ap.target': 0.5,
  'ap.pilot': 1,
};

const HEARTBEAT_INTERVAL_MS = 2500;

class PypilotServiceClass extends ConnectionManager {
  private socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
  private lineBuffer: string = '';
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastSendTime: number = 0;

  doConnect(host: string, port: number): void {
    const store = useBoatStore.getState();
    store.setPypilotStatus('connecting');

    this.socket = TcpSocket.createConnection(
      {host, port, tls: false},
      () => {
        this.onConnected();
        useBoatStore.getState().setPypilotStatus('connected');
        this.sendWatchCommands();
        this.startHeartbeat();
      },
    );

    this.socket.on('data', (data: Buffer | string) => {
      const chunk =
        typeof data === 'string' ? data : data.toString('utf8');
      this.lineBuffer += chunk;
      this.processBuffer();
    });

    this.socket.on('error', (err: Error) => {
      useBoatStore.getState().setPypilotStatus('error', err.message);
    });

    this.socket.on('close', () => {
      useBoatStore.getState().setPypilotStatus('disconnected');
      this.socket = null;
      this.stopHeartbeat();
      this.onDisconnected();
    });
  }

  doDisconnect(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.lineBuffer = '';
  }

  private sendWatchCommands(): void {
    for (const key of PYPILOT_WATCH_KEYS) {
      const interval = WATCH_INTERVALS[key] ?? 1;
      this.sendRaw(`watch={"${key}":${interval}}\n`);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      if (now - this.lastSendTime >= HEARTBEAT_INTERVAL_MS) {
        this.sendRaw('\n');
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private processBuffer(): void {
    let nlIdx: number;
    while ((nlIdx = this.lineBuffer.indexOf('\n')) !== -1) {
      const line = this.lineBuffer.slice(0, nlIdx).trim();
      this.lineBuffer = this.lineBuffer.slice(nlIdx + 1);
      if (line.length > 0) {
        this.parseLine(line);
      }
    }

    if (this.lineBuffer.length > 4096) {
      this.lineBuffer = '';
    }
  }

  private parseLine(line: string): void {
    // Format: key=value (value is JSON)
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) {
      return;
    }
    const key = line.slice(0, eqIdx).trim();
    const valueStr = line.slice(eqIdx + 1).trim();
    try {
      const value = JSON.parse(valueStr);
      useBoatStore.getState().setPypilotValue(key, value);
    } catch {
      // Ignore malformed lines
    }
  }

  private sendRaw(msg: string): void {
    if (this.socket) {
      this.socket.write(msg);
      this.lastSendTime = Date.now();
    }
  }

  // ── Public command API ──────────────────────────────────────────────────────

  setEnabled(enabled: boolean): void {
    this.sendRaw(`ap.enabled=${JSON.stringify(enabled)}\n`);
  }

  setMode(mode: string): void {
    this.sendRaw(`ap.mode=${JSON.stringify(mode)}\n`);
  }

  setHeadingCommand(heading: number): void {
    const normalized = normalizeHeading(heading);
    // Pypilot expects the raw number, not JSON-stringified
    this.sendRaw(`ap.heading_command=${normalized}\n`);
    useBoatStore.getState().setApHeadingCmd(normalized);
  }

  adjustHeading(delta: number): void {
    const store = useBoatStore.getState();
    const current = store.apHeadingCmd ?? store.apHeading ?? 0;
    const newHeading = normalizeHeading(current + delta);
    this.setHeadingCommand(newHeading);
  }

  setTackDirection(direction: 'port' | 'starboard'): void {
    this.sendRaw(`ap.tack.direction=${JSON.stringify(direction)}\n`);
  }

  beginTack(): void {
    this.sendRaw(`ap.tack.state=${JSON.stringify('begin')}\n`);
  }
}

export const PypilotService = new PypilotServiceClass();
