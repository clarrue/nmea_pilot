/**
 * Normalize a heading to [0, 360).
 */
export function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Add a delta to a heading, keeping result in [0, 360).
 */
export function addHeading(heading: number, delta: number): number {
  return normalizeHeading(heading + delta);
}

/**
 * Shortest signed angular difference from `from` to `to`, in [-180, 180].
 * Positive = clockwise (starboard), negative = counter-clockwise (port).
 */
export function headingDelta(from: number, to: number): number {
  const raw = normalizeHeading(to) - normalizeHeading(from);
  if (raw > 180) {
    return raw - 360;
  }
  if (raw < -180) {
    return raw + 360;
  }
  return raw;
}

/**
 * Convert degrees to radians.
 */
export function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 */
export function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}
