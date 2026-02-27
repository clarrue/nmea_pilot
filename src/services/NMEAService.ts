import TcpSocket from 'react-native-tcp-socket';
import {ConnectionManager} from './ConnectionManager';
import {
  validateChecksum,
  getSentenceType,
  parseDBx,
  parseVHW,
  parseMWV,
  parseRMC,
} from './NMEAParsers';
import {useBoatStore} from '../store/useBoatStore';

class NMEAServiceClass extends ConnectionManager {
  private socket: ReturnType<typeof TcpSocket.createConnection> | null = null;
  private lineBuffer: string = '';

  doConnect(host: string, port: number): void {
    const store = useBoatStore.getState();
    store.setNmeaStatus('connecting');

    this.socket = TcpSocket.createConnection(
      {host, port, tls: false},
      () => {
        this.onConnected();
        useBoatStore.getState().setNmeaStatus('connected');
      },
    );

    this.socket.on('data', (data: Buffer | string) => {
      const chunk =
        typeof data === 'string' ? data : data.toString('utf8');
      this.lineBuffer += chunk;
      this.processBuffer();
    });

    this.socket.on('error', (err: Error) => {
      useBoatStore.getState().setNmeaStatus('error', err.message);
    });

    this.socket.on('close', () => {
      useBoatStore.getState().setNmeaStatus('disconnected');
      this.socket = null;
      this.onDisconnected();
    });
  }

  doDisconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.lineBuffer = '';
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

    // Prevent buffer from growing unbounded (e.g., if \n never arrives)
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
          if (vhw.headingTrue !== null) {
            store.setHeadingTrue(vhw.headingTrue);
          }
          if (vhw.headingMag !== null) {
            store.setHeadingMag(vhw.headingMag);
          }
          if (vhw.waterSpeedKnots !== null) {
            store.setWaterSpeed(vhw.waterSpeedKnots);
          }
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
      default:
        break;
    }
  }
}

export const NMEAService = new NMEAServiceClass();
