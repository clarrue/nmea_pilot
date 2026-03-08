import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PressureRecord {
  t: number;    // window start timestamp (Unix ms)
  hPa: number;  // mean pressure in hPa
}

const STORAGE_KEY = '@nmea_pressure_history';
const MAX_RECORDS = 288; // 24h at one record per 5min

export interface PressureHistorySlice {
  pressureHistory: PressureRecord[];
  addPressureRecord: (record: PressureRecord) => void;
  loadPressureHistory: () => Promise<void>;
}

export const createPressureHistorySlice = (
  set: (fn: (state: PressureHistorySlice) => Partial<PressureHistorySlice>) => void,
): PressureHistorySlice => ({
  pressureHistory: [],

  addPressureRecord: (record: PressureRecord) =>
    set(state => {
      const next = [...state.pressureHistory, record];
      const trimmed = next.length > MAX_RECORDS ? next.slice(-MAX_RECORDS) : next;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed)).catch(() => {});
      return {pressureHistory: trimmed};
    }),

  loadPressureHistory: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const records = JSON.parse(json) as PressureRecord[];
        const cutoff = Date.now() - 86_400_000;
        set(() => ({pressureHistory: records.filter(r => r.t >= cutoff)}));
      }
    } catch {
      // Use empty history if storage fails
    }
  },
});
