/**
 * WindHistoryService — two-tier wind recording.
 *
 * High-frequency tier (3 s): samples apparent + true wind from the store
 * and accumulates them in memory.
 *
 * Low-frequency tier (30 s): aggregates each window into a WindRecord
 * containing mean angle/speed plus the peak gust, then commits it to
 * the Zustand store (which persists to AsyncStorage).
 */
import {useBoatStore} from '../store/useBoatStore';
import {WindRecord} from '../store/slices/windHistory.slice';

const SAMPLE_INTERVAL_MS = 3_000;  // how often we read the sensors
const WINDOW_MS = 30_000;          // aggregation window size

interface Sample {
  angle: number;
  speed: number;
}

/** Circular mean for bow-relative angles in degrees (handles ±180 wrap). */
function circularMean(angles: number[]): number {
  if (angles.length === 0) {return 0;}
  const sinSum = angles.reduce((s, a) => s + Math.sin((a * Math.PI) / 180), 0);
  const cosSum = angles.reduce((s, a) => s + Math.cos((a * Math.PI) / 180), 0);
  return (Math.atan2(sinSum / angles.length, cosSum / angles.length) * 180) / Math.PI;
}

interface WindowStats {
  angle: number;
  speed: number;
  gustSpeed: number;
  gustAngle: number;
}

function aggregate(samples: Sample[]): WindowStats | null {
  if (samples.length === 0) {return null;}
  const speeds = samples.map(s => s.speed);
  const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const meanAngle = circularMean(samples.map(s => s.angle));
  const maxSpeed = Math.max(...speeds);
  const gustIdx = speeds.indexOf(maxSpeed);
  return {
    angle: meanAngle,
    speed: meanSpeed,
    gustSpeed: maxSpeed,
    gustAngle: samples[gustIdx].angle,
  };
}

class WindHistoryServiceClass {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private aSamples: Sample[] = [];
  private tSamples: Sample[] = [];
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
    const state = useBoatStore.getState();
    const windA = state.windApparent;
    const windT = state.windTrue;

    if (windA) {
      this.aSamples.push({angle: windA.value.angle, speed: windA.value.speed});
    }
    if (windT) {
      this.tSamples.push({angle: windT.value.angle, speed: windT.value.speed});
    }

    if (Date.now() - this.windowStart >= WINDOW_MS) {
      this.flush();
    }
  }

  private flush(): void {
    const aStats = aggregate(this.aSamples);
    const tStats = aggregate(this.tSamples);

    // Skip window if no data at all
    if (!aStats && !tStats) {
      this.reset();
      return;
    }

    const record: WindRecord = {
      t: this.windowStart,
      aSpeed: aStats?.speed ?? 0,
      aAngle: aStats?.angle ?? 0,
      aGust: aStats?.gustSpeed ?? 0,
      aGustAngle: aStats?.gustAngle ?? 0,
      tSpeed: tStats?.speed ?? null,
      tAngle: tStats?.angle ?? null,
      tGust: tStats?.gustSpeed ?? null,
      tGustAngle: tStats?.gustAngle ?? null,
    };

    useBoatStore.getState().addWindRecord(record);
    this.reset();
  }

  private reset(): void {
    this.aSamples = [];
    this.tSamples = [];
    this.windowStart = Date.now();
  }
}

export const WindHistoryService = new WindHistoryServiceClass();
