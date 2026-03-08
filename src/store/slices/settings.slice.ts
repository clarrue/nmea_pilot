import AsyncStorage from '@react-native-async-storage/async-storage';
import {ThemeMode} from '../../theme/colors';

export type DepthUnit = 'm' | 'ft' | 'fathoms';
export type SpeedUnit = 'kn' | 'kmh' | 'mph';

export interface ConnectionConfig {
  host: string;
  port: number;
}

export interface StalenessConfig {
  warnAfterMs: number;  // default 5000
  hideAfterMs: number;  // default 15000
}

export interface VisiblePanels {
  wind: boolean;
  navigation: boolean;
  autopilot: boolean;
  depth: boolean;
  pressure: boolean;
}

export interface Settings {
  nmea: ConnectionConfig;
  pypilot: ConnectionConfig;
  theme: ThemeMode;
  depthUnit: DepthUnit;
  speedUnit: SpeedUnit;
  staleness: StalenessConfig;
  visiblePanels: VisiblePanels;
}

const STORAGE_KEY = '@nmea_settings';

const DEFAULT_SETTINGS: Settings = {
  nmea: {host: '192.168.4.1', port: 1457},
  pypilot: {host: '192.168.1.10', port: 23322},
  theme: 'day',
  depthUnit: 'm',
  speedUnit: 'kn',
  staleness: {warnAfterMs: 5000, hideAfterMs: 15000},
  visiblePanels: {wind: true, navigation: true, autopilot: true, depth: true, pressure: true},
};

export interface SettingsSlice {
  settings: Settings;

  setNmeaConfig: (config: ConnectionConfig) => void;
  setPypilotConfig: (config: ConnectionConfig) => void;
  setTheme: (theme: ThemeMode) => void;
  setDepthUnit: (unit: DepthUnit) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setStaleness: (config: StalenessConfig) => void;
  setVisiblePanels: (panels: Partial<VisiblePanels>) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const createSettingsSlice = (
  set: (fn: (state: SettingsSlice) => Partial<SettingsSlice>) => void,
  get: () => SettingsSlice,
): SettingsSlice => ({
  settings: DEFAULT_SETTINGS,

  setNmeaConfig: (config: ConnectionConfig) =>
    set(state => ({
      settings: {...state.settings, nmea: config},
    })),

  setPypilotConfig: (config: ConnectionConfig) =>
    set(state => ({
      settings: {...state.settings, pypilot: config},
    })),

  setTheme: (theme: ThemeMode) =>
    set(state => ({
      settings: {...state.settings, theme},
    })),

  setDepthUnit: (unit: DepthUnit) =>
    set(state => ({
      settings: {...state.settings, depthUnit: unit},
    })),

  setSpeedUnit: (unit: SpeedUnit) =>
    set(state => ({
      settings: {...state.settings, speedUnit: unit},
    })),

  setStaleness: (config: StalenessConfig) =>
    set(state => ({
      settings: {...state.settings, staleness: config},
    })),

  setVisiblePanels: (panels: Partial<VisiblePanels>) =>
    set(state => ({
      settings: {
        ...state.settings,
        visiblePanels: {...state.settings.visiblePanels, ...panels},
      },
    })),

  loadSettings: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const saved = JSON.parse(json) as Partial<Settings>;
        set(state => ({
          settings: {
            ...state.settings,
            ...saved,
            nmea: {...DEFAULT_SETTINGS.nmea, ...(saved.nmea ?? {})},
            pypilot: {...DEFAULT_SETTINGS.pypilot, ...(saved.pypilot ?? {})},
            staleness: {...DEFAULT_SETTINGS.staleness, ...(saved.staleness ?? {})},
            visiblePanels: {...DEFAULT_SETTINGS.visiblePanels, ...(saved.visiblePanels ?? {})},
          },
        }));
      }
    } catch {
      // Use defaults if storage fails
    }
  },

  saveSettings: async () => {
    try {
      const {settings} = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Silently fail
    }
  },
});
