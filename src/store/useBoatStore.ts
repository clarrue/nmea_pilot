import {create} from 'zustand';
import {NmeaSlice, createNmeaSlice} from './slices/nmea.slice';
import {PypilotSlice, createPypilotSlice} from './slices/pypilot.slice';
import {ConnectionSlice, createConnectionSlice} from './slices/connection.slice';
import {SettingsSlice, createSettingsSlice} from './slices/settings.slice';
import {WindHistorySlice, createWindHistorySlice} from './slices/windHistory.slice';

export type BoatStore =
  NmeaSlice &
  PypilotSlice &
  ConnectionSlice &
  SettingsSlice &
  WindHistorySlice;

export const useBoatStore = create<BoatStore>()((set, get) => ({
  ...createNmeaSlice(set as (fn: (state: NmeaSlice) => Partial<NmeaSlice>) => void),
  ...createPypilotSlice(set as (fn: (state: PypilotSlice) => Partial<PypilotSlice>) => void),
  ...createConnectionSlice(set as (fn: (state: ConnectionSlice) => Partial<ConnectionSlice>) => void),
  ...createSettingsSlice(
    set as (fn: (state: SettingsSlice) => Partial<SettingsSlice>) => void,
    get as () => SettingsSlice,
  ),
  ...createWindHistorySlice(
    set as (fn: (state: WindHistorySlice) => Partial<WindHistorySlice>) => void,
    get as () => WindHistorySlice,
  ),
}));
