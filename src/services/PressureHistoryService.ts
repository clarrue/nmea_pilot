/**
 * PressureHistoryService — records barometric pressure history.
 *
 * Samples the store every 30 s, aggregates into 5-minute mean windows,
 * and commits each PressureRecord to the Zustand store (persisted to AsyncStorage).
 */
import {useBoatStore} from '../store/useBoatStore';
import {PressureRecord} from '../store/slices/pressureHistory.slice';

const SAMPLE_INTERVAL_MS = 30_000;  // 30 s
const WINDOW_MS = 300_000;          // 5 min

class PressureHistoryServiceClass {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private samples: number[] = [];
  private windowStart: number = Date.now();

  start(): void {
    this.reset();
    this.intervalId = setInterval(() => this.sample(), SAMPLE_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private sample(): void {
    const pressure = useBoatStore.getState().pressure;
    if (pressure) {
      this.samples.push(pressure.value);
    }
    if (Date.now() - this.windowStart >= WINDOW_MS) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.samples.length === 0) {
      this.reset();
      return;
    }
    const mean = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const record: PressureRecord = {
      t: this.windowStart,
      hPa: Math.round(mean * 10) / 10,
    };
    useBoatStore.getState().addPressureRecord(record);
    this.reset();
  }

  private reset(): void {
    this.samples = [];
    this.windowStart = Date.now();
  }
}

export const PressureHistoryService = new PressureHistoryServiceClass();
