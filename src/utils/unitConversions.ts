const KN_TO_KMH = 1.852;
const KN_TO_MPH = 1.15078;
const M_TO_FT = 3.28084;
const M_TO_FATHOMS = 0.546807;
const FT_TO_M = 0.3048;

export function knotsToKmh(knots: number): number {
  return knots * KN_TO_KMH;
}

export function knotsToMph(knots: number): number {
  return knots * KN_TO_MPH;
}

export function metersToFeet(meters: number): number {
  return meters * M_TO_FT;
}

export function metersToFathoms(meters: number): number {
  return meters * M_TO_FATHOMS;
}

export function feetToMeters(feet: number): number {
  return feet * FT_TO_M;
}

/**
 * Format a depth value with unit label.
 */
export function formatDepth(
  meters: number,
  unit: 'm' | 'ft' | 'fathoms' = 'm',
): string {
  switch (unit) {
    case 'ft':
      return `${metersToFeet(meters).toFixed(1)} ft`;
    case 'fathoms':
      return `${metersToFathoms(meters).toFixed(1)} fm`;
    default:
      return `${meters.toFixed(1)} m`;
  }
}

/**
 * Format a speed value with unit label.
 */
export function formatSpeed(
  knots: number,
  unit: 'kn' | 'kmh' | 'mph' = 'kn',
): string {
  switch (unit) {
    case 'kmh':
      return `${knotsToKmh(knots).toFixed(1)} km/h`;
    case 'mph':
      return `${knotsToMph(knots).toFixed(1)} mph`;
    default:
      return `${knots.toFixed(1)} kn`;
  }
}
