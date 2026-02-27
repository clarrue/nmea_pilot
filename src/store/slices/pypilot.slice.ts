export type ApMode = 'compass' | 'wind' | 'gps' | 'true wind';

export interface ImuData {
  pitch: number;  // degrees, positive = bow up
  roll: number;   // degrees, positive = starboard
  heel: number;   // degrees
  rate: number;   // turn rate, deg/s
}

export interface PypilotSlice {
  apEnabled: boolean;
  apMode: ApMode;
  apHeading: number | null;       // current boat heading from AP
  apHeadingCmd: number | null;    // commanded heading
  rudderAngle: number | null;     // degrees, negative = port, positive = starboard
  imu: ImuData | null;
  servoEngaged: boolean;
  servoAmps: number | null;
  tackState: string | null;       // 'none' | 'begin' | 'tacking' | 'done'
  tackDirection: 'port' | 'starboard' | null;
  windAngle: number | null;       // apparent wind angle from AP perspective

  setPypilotValue: (key: string, value: unknown) => void;
  setApHeadingCmd: (heading: number) => void;
  setApEnabled: (enabled: boolean) => void;
  setApMode: (mode: ApMode) => void;
}

export const createPypilotSlice = (
  set: (fn: (state: PypilotSlice) => Partial<PypilotSlice>) => void,
): PypilotSlice => ({
  apEnabled: false,
  apMode: 'compass',
  apHeading: null,
  apHeadingCmd: null,
  rudderAngle: null,
  imu: null,
  servoEngaged: false,
  servoAmps: null,
  tackState: null,
  tackDirection: null,
  windAngle: null,

  setPypilotValue: (key: string, value: unknown) =>
    set(state => {
      switch (key) {
        case 'ap.enabled':
          return {apEnabled: Boolean(value)};
        case 'ap.mode':
          return {apMode: value as ApMode};
        case 'ap.heading':
          return {apHeading: typeof value === 'number' ? value : null};
        case 'ap.heading_command':
          return {apHeadingCmd: typeof value === 'number' ? value : null};
        case 'rudder.angle':
          return {rudderAngle: typeof value === 'number' ? value : null};
        case 'imu.pitch':
          return {imu: {...(state.imu ?? {pitch: 0, roll: 0, heel: 0, rate: 0}), pitch: value as number}};
        case 'imu.roll':
          return {imu: {...(state.imu ?? {pitch: 0, roll: 0, heel: 0, rate: 0}), roll: value as number}};
        case 'imu.heel':
          return {imu: {...(state.imu ?? {pitch: 0, roll: 0, heel: 0, rate: 0}), heel: value as number}};
        case 'imu.rate':
          return {imu: {...(state.imu ?? {pitch: 0, roll: 0, heel: 0, rate: 0}), rate: value as number}};
        case 'servo.engaged':
          return {servoEngaged: Boolean(value)};
        case 'servo.amps':
          return {servoAmps: typeof value === 'number' ? value : null};
        case 'ap.tack.state':
          return {tackState: String(value)};
        case 'ap.tack.direction':
          return {tackDirection: value as 'port' | 'starboard'};
        case 'wind.angle':
          return {windAngle: typeof value === 'number' ? value : null};
        default:
          return {};
      }
    }),

  setApHeadingCmd: (heading: number) =>
    set(() => ({apHeadingCmd: heading})),

  setApEnabled: (enabled: boolean) =>
    set(() => ({apEnabled: enabled})),

  setApMode: (mode: ApMode) =>
    set(() => ({apMode: mode})),
});

// Keys to watch on the pypilot server
export const PYPILOT_WATCH_KEYS = [
  'ap.enabled',
  'ap.mode',
  'ap.heading',
  'ap.heading_command',
  'rudder.angle',
  'imu.pitch',
  'imu.roll',
  'imu.heel',
  'imu.rate',
  'servo.engaged',
  'servo.amps',
  'ap.tack.state',
  'ap.tack.direction',
  'wind.angle',
  'ap.target',
  'ap.pilot',
] as const;
