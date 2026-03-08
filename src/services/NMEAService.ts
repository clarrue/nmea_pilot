import UdpSockets from 'react-native-udp';
import {
  validateChecksum,
  getSentenceType,
  parseDBx,
  parseVHW,
  parseMWV,
  parseRMC,
  parseMDA,
  parseXDR,
} from './NMEAParsers';
import {useBoatStore} from '../store/useBoatStore';

class NMEAServiceClass {
  private socket: InstanceType<typeof UdpSockets.Socket> | null = null;
  private lineBuffer: string = '';
  private stopped: boolean = false;
  private currentPort: number = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  connect(_host: string, port: number): void {
    this.stopped = false;
    this.currentPort = port;
    this.clearRetry();
    this.doConnect(port);
  }

  disconnect(): void {
    this.stopped = true;
    this.clearRetry();
    this.closeSocket();
    useBoatStore.getState().setNmeaStatus('disconnected');
  }

  reconnect(host: string, port: number): void {
    this.disconnect();
    setTimeout(() => this.connect(host, port), 200);
  }

  private doConnect(port: number): void {
    useBoatStore.getState().setNmeaStatus('connecting');

    const socket = UdpSockets.createSocket({type: 'udp4', reusePort: true});
    this.socket = socket;

    socket.on('error', (err: Error) => {
      useBoatStore.getState().setNmeaStatus('error', err.message);
      this.closeSocket();
      this.scheduleRetry();
    });

    socket.on('close', () => {
      this.socket = null;
      if (!this.stopped) {
        useBoatStore.getState().setNmeaStatus('disconnected');
        this.scheduleRetry();
      }
    });

    socket.bind(port, () => {
      socket.setBroadcast(true);
      useBoatStore.getState().setNmeaStatus('connected');
    });

    socket.on('message', (data: Buffer) => {
      const chunk = data.toString('utf8');
      this.lineBuffer += chunk;
      this.processBuffer();
    });
  }

  private closeSocket(): void {
    if (this.socket) {
      try { this.socket.close(); } catch {}
      this.socket = null;
    }
    this.lineBuffer = '';
  }

  private scheduleRetry(): void {
    if (this.stopped) {return;}
    this.retryTimer = setTimeout(() => {
      if (!this.stopped) {
        this.doConnect(this.currentPort);
      }
    }, 5000);
  }

  private clearRetry(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private processBuffer(): void {
    let nlIdx: number;
    while ((nlIdx = this.lineBuffer.indexOf('\n')) !== -1) {
      const line = this.lineBuffer.slice(0, nlIdx).trim();
      this.lineBuffer = this.lineBuffer.slice(nlIdx + 1);
      if (line.length > 0) {
        this.dispatchSentence(line);
      }
    }
    if (this.lineBuffer.length > 4096) {
      this.lineBuffer = '';
    }
  }

  private dispatchSentence(sentence: string): void {
    if (!validateChecksum(sentence)) {
      return;
    }

    const store = useBoatStore.getState();
    const type = getSentenceType(sentence);

    switch (type) {
      case 'DBT':
      case 'DBS':
      case 'DBK': {
        const depth = parseDBx(sentence);
        if (depth !== null) {
          store.setDepth(depth);
        }
        break;
      }
      case 'VHW': {
        const vhw = parseVHW(sentence);
        if (vhw) {
          if (vhw.headingTrue !== null) {store.setHeadingTrue(vhw.headingTrue);}
          if (vhw.headingMag !== null) {store.setHeadingMag(vhw.headingMag);}
          if (vhw.waterSpeedKnots !== null) {store.setWaterSpeed(vhw.waterSpeedKnots);}
        }
        break;
      }
      case 'MWV': {
        const mwv = parseMWV(sentence);
        if (mwv) {
          if (mwv.type === 'apparent') {
            store.setWindApparent(mwv.wind);
          } else {
            store.setWindTrue(mwv.wind);
          }
        }
        break;
      }
      case 'RMC': {
        const rmc = parseRMC(sentence);
        if (rmc) {
          store.setGps(rmc);
        }
        break;
      }
      case 'MDA': {
        const hPa = parseMDA(sentence);
        if (hPa !== null) {
          store.setPressure(hPa);
        }
        break;
      }
      case 'XDR': {
        const hPa = parseXDR(sentence);
        if (hPa !== null) {
          store.setPressure(hPa);
        }
        break;
      }
      default:
        break;
    }
  }
}

export const NMEAService = new NMEAServiceClass();
