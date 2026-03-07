import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WindRecord {
  t: number;          // window start timestamp (Unix ms)
  aSpeed: number;     // apparent mean speed (knots)
  aAngle: number;     // apparent mean angle (degrees, bow-relative)
  aGust: number;      // apparent peak gust speed (knots)
  aGustAngle: number; // apparent gust angle
  tSpeed: number | null;
  tAngle: number | null;
  tGust: number | null;
  tGustAngle: number | null;
}

const STORAGE_KEY = '@nmea_wind_history';
const MAX_RECORDS = 2880; // 24h at one record per 30s

export interface WindHistorySlice {
  windHistory: WindRecord[];
  addWindRecord: (record: WindRecord) => void;
  loadWindHistory: () => Promise<void>;
  saveWindHistory: () => Promise<void>;
}

export const createWindHistorySlice = (
  set: (fn: (state: WindHistorySlice) => Partial<WindHistorySlice>) => void,
  get: () => WindHistorySlice,
): WindHistorySlice => ({
  windHistory: [],

  addWindRecord: (record: WindRecord) =>
    set(state => {
      const next = [...state.windHistory, record];
      const trimmed = next.length > MAX_RECORDS ? next.slice(-MAX_RECORDS) : next;
      // Persist asynchronously after updating state
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)).catch(() => {});
      return {windHistory: trimmed};
    }),

  loadWindHistory: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const records = JSON.parse(json) as WindRecord[];
        // Only keep records from the last 24h
        const cutoff = Date.now() - 86_400_000;
        set(() => ({windHistory: records.filter(r => r.t >= cutoff)}));
      }
    } catch {
      // Use empty history if storage fails
    }
  },

  saveWindHistory: async () => {
    try {
      const {windHistory} = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(windHistory));
    } catch {
      // Silently fail
    }
  },
});