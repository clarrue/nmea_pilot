import {StampedValue} from './nmea.slice';

export interface EngineSlice {
  rpm: StampedValue<number> | null;              // RPM
  coolantTemp: StampedValue<number> | null;      // °C
  oilPressure: StampedValue<number> | null;      // bar
  oilTemp: StampedValue<number> | null;          // °C
  alternatorVoltage: StampedValue<number> | null; // V
  fuelLevel: StampedValue<number> | null;        // % (0-100)
  batteryVoltage: StampedValue<number> | null;   // V
  engineHours: StampedValue<number> | null;      // hours

  setRpm: (rpm: number) => void;
  setCoolantTemp: (celsius: number) => void;
  setOilPressure: (bar: number) => void;
  setOilTemp: (celsius: number) => void;
  setAlternatorVoltage: (volts: number) => void;
  setFuelLevel: (percent: number) => void;
  setBatteryVoltage: (volts: number) => void;
  setEngineHours: (hours: number) => void;
}

export const createEngineSlice = (
  set: (fn: (state: EngineSlice) => Partial<EngineSlice>) => void,
): EngineSlice => ({
  rpm: null,
  coolantTemp: null,
  oilPressure: null,
  oilTemp: null,
  alternatorVoltage: null,
  fuelLevel: null,
  batteryVoltage: null,
  engineHours: null,

  setRpm: (rpm: number) =>
    set(() => ({rpm: {value: rpm, updatedAt: Date.now()}})),

  setCoolantTemp: (celsius: number) =>
    set(() => ({coolantTemp: {value: celsius, updatedAt: Date.now()}})),

  setOilPressure: (bar: number) =>
    set(() => ({oilPressure: {value: bar, updatedAt: Date.now()}})),

  setOilTemp: (celsius: number) =>
    set(() => ({oilTemp: {value: celsius, updatedAt: Date.now()}})),

  setAlternatorVoltage: (volts: number) =>
    set(() => ({alternatorVoltage: {value: volts, updatedAt: Date.now()}})),

  setFuelLevel: (percent: number) =>
    set(() => ({fuelLevel: {value: percent, updatedAt: Date.now()}})),

  setBatteryVoltage: (volts: number) =>
    set(() => ({batteryVoltage: {value: volts, updatedAt: Date.now()}})),

  setEngineHours: (hours: number) =>
    set(() => ({engineHours: {value: hours, updatedAt: Date.now()}})),
});
