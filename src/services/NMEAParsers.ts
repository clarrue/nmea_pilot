import {WindData} from '../store/slices/nmea.slice';
import {GpsData} from '../store/slices/nmea.slice';
import {feetToMeters} from '../utils/unitConversions';

/**
 * Validate NMEA 0183 checksum.
 * Checksum is XOR of all bytes between '$' and '*' (exclusive).
 * Returns true if checksum matches the 2-hex suffix after '*'.
 */
export function validateChecksum(sentence: string): boolean {
  const start = sentence.indexOf('$');
  const end = sentence.indexOf('*', start);
  if (start === -1 || end === -1 || end + 2 >= sentence.length) {
    return false;
  }
  const body = sentence.slice(start + 1, end);
  const expected = sentence.slice(end + 1, end + 3).toUpperCase();
  let checksum = 0;
  for (let i = 0; i < body.length; i++) {
    checksum ^= body.charCodeAt(i);
  }
  const actual = checksum.toString(16).toUpperCase().padStart(2, '0');
  return actual === expected;
}

/**
 * Split a sentence into fields (strips leading $ and trailing *XX).
 */
function parseFields(sentence: string): string[] {
  let s = sentence.trim();
  if (s.startsWith('$') || s.startsWith('!')) {
    s = s.slice(1);
  }
  const starIdx = s.indexOf('*');
  if (starIdx !== -1) {
    s = s.slice(0, starIdx);
  }
  return s.split(',');
}

/**
 * Parse DBT (Depth Below Transducer), DBS (Depth Below Surface),
 * or DBK (Depth Below Keel) sentences.
 *
 * Format: $--DBT,fathoms,f,meters,M,feet,F*hh
 * Fields: [0]=talker+type, [1]=fathoms, [2]='f', [3]=meters, [4]='M', [5]=feet, [6]='F'
 *
 * Prefer meters field [3], fallback to feet×0.3048.
 * Returns depth in meters, or null if unparseable.
 */
export function parseDBx(sentence: string): number | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  // Field [3] = meters
  const metersStr = fields[3];
  if (metersStr && metersStr.length > 0) {
    const m = parseFloat(metersStr);
    if (!isNaN(m) && m >= 0) {
      return m;
    }
  }
  // Fallback: field [5] = feet
  const feetStr = fields[5];
  if (feetStr && feetStr.length > 0) {
    const ft = parseFloat(feetStr);
    if (!isNaN(ft) && ft >= 0) {
      return feetToMeters(ft);
    }
  }
  return null;
}

/**
 * Parse VHW (Water Speed and Heading) sentence.
 *
 * Format: $--VHW,x.x,T,x.x,M,x.x,N,x.x,K*hh
 * Fields: [0]=type, [1]=headingTrue, [2]='T', [3]=headingMag, [4]='M',
 *         [5]=speedKnots, [6]='N', [7]=speedKmh, [8]='K'
 *
 * Returns { headingTrue, headingMag, waterSpeedKnots } or null.
 */
export function parseVHW(sentence: string): {
  headingTrue: number | null;
  headingMag: number | null;
  waterSpeedKnots: number | null;
} | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  if (fields.length < 8) {
    return null;
  }
  const headingTrue = fields[1] ? parseFloat(fields[1]) : NaN;
  const headingMag = fields[3] ? parseFloat(fields[3]) : NaN;
  const waterSpeedKnots = fields[5] ? parseFloat(fields[5]) : NaN;

  return {
    headingTrue: !isNaN(headingTrue) ? headingTrue : null,
    headingMag: !isNaN(headingMag) ? headingMag : null,
    waterSpeedKnots: !isNaN(waterSpeedKnots) ? waterSpeedKnots : null,
  };
}

/**
 * Parse MWV (Wind Speed and Angle) sentence.
 *
 * Format: $--MWV,x.x,R/T,x.x,N/M/K,A*hh
 * Fields: [0]=type, [1]=windAngle, [2]=R/T, [3]=windSpeed, [4]=unit, [5]=status
 *
 * R=apparent, T=true. Status must be 'A' (valid).
 * Normalizes speed to knots.
 * Returns { type: 'apparent'|'true', wind: WindData } or null.
 */
export function parseMWV(sentence: string): {
  type: 'apparent' | 'true';
  wind: WindData;
} | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  if (fields.length < 6) {
    return null;
  }

  const status = fields[5];
  if (status !== 'A') {
    return null; // Invalid data
  }

  const angleStr = fields[1];
  const referenceStr = fields[2];
  const speedStr = fields[3];
  const unitStr = fields[4];

  if (!angleStr || !referenceStr || !speedStr || !unitStr) {
    return null;
  }

  const angle = parseFloat(angleStr);
  if (isNaN(angle)) {
    return null;
  }

  let speed = parseFloat(speedStr);
  if (isNaN(speed)) {
    return null;
  }

  // Normalize speed to knots
  switch (unitStr.toUpperCase()) {
    case 'M': // m/s
      speed = speed * 1.94384;
      break;
    case 'K': // km/h
      speed = speed / 1.852;
      break;
    case 'N': // already knots
      break;
    default:
      return null;
  }

  const type =
    referenceStr.toUpperCase() === 'R' ? 'apparent' : 'true';

  return {
    type,
    wind: {angle, speed},
  };
}

/**
 * Parse RMC (Recommended Minimum Navigation Information) sentence.
 *
 * Format: $--RMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,x.x,a*hh
 * Fields: [0]=type, [1]=time, [2]=status, [3]=lat, [4]=N/S, [5]=lon, [6]=E/W,
 *         [7]=SOG, [8]=COG, [9]=date, ...
 *
 * Status must be 'A' (active/valid).
 * Returns GpsData or null.
 */
export function parseRMC(sentence: string): GpsData | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  if (fields.length < 9) {
    return null;
  }

  const status = fields[2];
  if (status !== 'A') {
    return null;
  }

  const sog = parseFloat(fields[7]);
  const cog = parseFloat(fields[8]);

  if (isNaN(sog) || isNaN(cog)) {
    return null;
  }

  // Parse lat/lon (optional, for position display)
  let latitude: number | undefined;
  let longitude: number | undefined;

  const latStr = fields[3];
  const latDir = fields[4];
  if (latStr && latDir) {
    const latDeg = parseFloat(latStr.slice(0, 2));
    const latMin = parseFloat(latStr.slice(2));
    if (!isNaN(latDeg) && !isNaN(latMin)) {
      latitude = latDeg + latMin / 60;
      if (latDir === 'S') {
        latitude = -latitude;
      }
    }
  }

  const lonStr = fields[5];
  const lonDir = fields[6];
  if (lonStr && lonDir) {
    const lonDeg = parseFloat(lonStr.slice(0, 3));
    const lonMin = parseFloat(lonStr.slice(3));
    if (!isNaN(lonDeg) && !isNaN(lonMin)) {
      longitude = lonDeg + lonMin / 60;
      if (lonDir === 'W') {
        longitude = -longitude;
      }
    }
  }

  return {sog, cog, latitude, longitude};
}

/**
 * Parse MDA (Meteorological Composite) sentence for barometric pressure.
 *
 * Format: $--MDA,x.x,I,x.x,B,...*hh
 * Field [1]/[2] = pressure in inches of mercury / 'I'
 * Field [3]/[4] = pressure in bars / 'B'
 *
 * Returns pressure in hPa, or null.
 */
export function parseMDA(sentence: string): number | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  // Prefer bars field [3]
  if (fields[3] && fields[4] === 'B') {
    const bars = parseFloat(fields[3]);
    if (!isNaN(bars) && bars > 0.5 && bars < 1.1) {
      return bars * 1000; // bars → hPa
    }
  }
  // Fallback: inches of mercury field [1]
  if (fields[1] && fields[2] === 'I') {
    const inHg = parseFloat(fields[1]);
    if (!isNaN(inHg) && inHg > 0) {
      return inHg * 33.8639; // inHg → hPa
    }
  }
  return null;
}

/**
 * Parse XDR (Transducer Measurement) sentence for barometric pressure.
 *
 * Fields come in groups of 4: type, value, unit, name
 * For pressure: type='P', unit='B' (bar), 'P' (pascal), or 'M' (mbar)
 *
 * Returns pressure in hPa, or null.
 */
export function parseXDR(sentence: string): number | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  for (let i = 1; i + 2 < fields.length; i += 4) {
    if (fields[i] !== 'P') {continue;}
    const val = parseFloat(fields[i + 1]);
    const unit = fields[i + 2];
    if (isNaN(val) || val <= 0) {continue;}
    if (unit === 'B') {return val * 1000;}  // bar → hPa
    if (unit === 'P') {return val / 100;}   // Pa → hPa
    if (unit === 'M') {return val;}         // mbar = hPa
  }
  return null;
}

/**
 * Identify sentence type from the 3-character mnemonic (chars 3-5 of sentence).
 * E.g., "$IIMWV,..." → "MWV"
 */
export function getSentenceType(sentence: string): string {
  const s = sentence.startsWith('$') ? sentence.slice(1) : sentence;
  return s.slice(2, 5).toUpperCase();
}

/**
 * Parse RPM (Engine RPM) sentence from NMEA 2000 gateway (PGN 127488).
 *
 * Format: $IIRPM,E,<engine#>,<rpm>,<pitch%>,A*hh
 * Fields: [0]=type, [1]=source (E=Engine), [2]=engine number,
 *         [3]=RPM, [4]=pitch%, [5]=status (A=valid)
 *
 * Only accepts source 'E' (engine). Status must be 'A'.
 * Returns RPM as number, or null.
 */
export function parseRPM(sentence: string): number | null {
  if (!validateChecksum(sentence)) {
    return null;
  }
  const fields = parseFields(sentence);
  if (fields.length < 6) {
    return null;
  }
  const source = fields[1];
  if (!source || source.toUpperCase() !== 'E') {
    return null;
  }
  const status = fields[5];
  if (!status || status.toUpperCase() !== 'A') {
    return null;
  }
  const rpm = parseFloat(fields[3]);
  if (isNaN(rpm) || rpm < 0) {
    return null;
  }
  return rpm;
}

export interface XDREngineData {
  coolantTemp?: number;       // °C
  oilPressure?: number;       // bar
  oilTemp?: number;           // °C
  alternatorVoltage?: number; // V
  fuelLevel?: number;         // % (0-100)
  batteryVoltage?: number;    // V
  engineHours?: number;       // hours
}

/**
 * Parse XDR (Transducer Measurement) sentence for engine data from NMEA 2000 gateway.
 *
 * Fields come in groups of 4 starting at index 1: type, value, unit, name
 *
 * Recognized transducer names (case-insensitive):
 *   coolantTemp:       ENGTEMP, COOLANTTEMP, ENGINE#0.TEMP
 *   oilPressure:       ENGOILP, OILPRESS, ENGINE#0.OILP
 *   oilTemp:           ENGOILTEMP, OILTEMP, ENGINE#0.OILTEMP
 *   alternatorVoltage: ALTVOLT, ALTVOLTAGE, ENGINE#0.ALTVOLT
 *   fuelLevel:         FUELLEVEL, FUEL, FLUID#0 (ratio 0-1 → multiply by 100)
 *   batteryVoltage:    BATVOLT, BATTVOLT, BATTERY#0
 *   engineHours:       ENGHOURS, ENGINEHOURS (unit H=hours; unit S=seconds → divide by 3600)
 *
 * Returns an object with any recognized fields populated.
 */
export function parseXDREngine(sentence: string): XDREngineData {
  const result: XDREngineData = {};

  if (!validateChecksum(sentence)) {
    return result;
  }
  const fields = parseFields(sentence);

  for (let i = 1; i + 3 < fields.length; i += 4) {
    const type = (fields[i] ?? '').toUpperCase();
    const valStr = fields[i + 1] ?? '';
    const unit = (fields[i + 2] ?? '').toUpperCase();
    const name = (fields[i + 3] ?? '').toUpperCase();

    const val = parseFloat(valStr);
    if (isNaN(val)) {
      continue;
    }

    // Coolant temperature: type C, °C
    if (
      type === 'C' &&
      (name === 'ENGTEMP' || name === 'COOLANTTEMP' || name === 'ENGINE#0.TEMP')
    ) {
      result.coolantTemp = val;
      continue;
    }

    // Oil pressure: type P, bar
    if (
      type === 'P' &&
      (name === 'ENGOILP' || name === 'OILPRESS' || name === 'ENGINE#0.OILP')
    ) {
      result.oilPressure = val;
      continue;
    }

    // Oil temperature: type C, °C
    if (
      type === 'C' &&
      (name === 'ENGOILTEMP' || name === 'OILTEMP' || name === 'ENGINE#0.OILTEMP')
    ) {
      result.oilTemp = val;
      continue;
    }

    // Alternator voltage: type U, V
    if (
      type === 'U' &&
      (name === 'ALTVOLT' || name === 'ALTVOLTAGE' || name === 'ENGINE#0.ALTVOLT')
    ) {
      result.alternatorVoltage = val;
      continue;
    }

    // Fuel level: type G, ratio 0-1 → percent
    if (
      type === 'G' &&
      (name === 'FUELLEVEL' || name === 'FUEL' || name === 'FLUID#0')
    ) {
      result.fuelLevel = val * 100;
      continue;
    }

    // Battery voltage: type U, V
    if (
      type === 'U' &&
      (name === 'BATVOLT' || name === 'BATTVOLT' || name === 'BATTERY#0')
    ) {
      result.batteryVoltage = val;
      continue;
    }

    // Engine hours: type H (hours) or S (seconds)
    if (name === 'ENGHOURS' || name === 'ENGINEHOURS') {
      if (unit === 'S') {
        result.engineHours = val / 3600;
      } else {
        // H or empty — treat as hours
        result.engineHours = val;
      }
      continue;
    }
  }

  return result;
}
