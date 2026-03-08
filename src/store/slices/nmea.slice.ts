export interface StampedValue<T> {
  value: T;
  updatedAt: number; // Unix ms timestamp
}

export interface WindData {
  angle: number; // 0-359 degrees, bow-relative
  speed: number; // knots
}

export interface GpsData {
  sog: number; // speed over ground, knots
  cog: number; // course over ground, degrees
  latitude?: number;
  longitude?: number;
}

export interface NmeaSlice {
  depth: StampedValue<number> | null;       // meters
  waterSpeed: StampedValue<number> | null;  // knots
  headingTrue: StampedValue<number> | null; // degrees
  headingMag: StampedValue<number> | null;  // degrees
  windApparent: StampedValue<WindData> | null;
  windTrue: StampedValue<WindData> | null;
  gps: StampedValue<GpsData> | null;
  pressure: StampedValue<number> | null;    // hPa

  setDepth: (meters: number) => void;
  setWaterSpeed: (knots: number) => void;
  setHeadingTrue: (deg: number) => void;
  setHeadingMag: (deg: number) => void;
  setWindApparent: (wind: WindData) => void;
  setWindTrue: (wind: WindData) => void;
  setGps: (gps: GpsData) => void;
  setPressure: (hPa: number) => void;
}

export const createNmeaSlice = (
  set: (fn: (state: NmeaSlice) => Partial<NmeaSlice>) => void,
): NmeaSlice => ({
  depth: null,
  waterSpeed: null,
  headingTrue: null,
  headingMag: null,
  windApparent: null,
  windTrue: null,
  gps: null,
  pressure: null,

  setDepth: (meters: number) =>
    set(() => ({depth: {value: meters, updatedAt: Date.now()}})),

  setWaterSpeed: (knots: number) =>
    set(() => ({waterSpeed: {value: knots, updatedAt: Date.now()}})),

  setHeadingTrue: (deg: number) =>
    set(() => ({headingTrue: {value: deg, updatedAt: Date.now()}})),

  setHeadingMag: (deg: number) =>
    set(() => ({headingMag: {value: deg, updatedAt: Date.now()}})),

  setWindApparent: (wind: WindData) =>
    set(() => ({windApparent: {value: wind, updatedAt: Date.now()}})),

  setWindTrue: (wind: WindData) =>
    set(() => ({windTrue: {value: wind, updatedAt: Date.now()}})),

  setGps: (gps: GpsData) =>
    set(() => ({gps: {value: gps, updatedAt: Date.now()}})),

  setPressure: (hPa: number) =>
    set(() => ({pressure: {value: hPa, updatedAt: Date.now()}})),
});
