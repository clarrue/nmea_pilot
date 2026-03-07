/**
 * DEV ONLY — seeds the wind history store with 24 h of simulated data
 * so the WindHistoryChart can be visually tested without a live NMEA feed.
 * Call seedWindHistory() once on startup, then remove this call.
 */
import {useBoatStore} from '../store/useBoatStore';
import {WindRecord} from '../store/slices/windHistory.slice';

export function seedWindHistory(): void {
  const now = Date.now();
  const TOTAL = 2880; // 24 h at 30 s intervals
  const records: WindRecord[] = [];

  // We build a slowly-evolving wind scenario:
  //   - Base angle oscillates (wind shifting) with several cycles over 24 h
  //   - Base speed has a diurnal-ish variation
  //   - Occasional gusty spells (clusters of high gust multipliers)
  //   - A few outlier gust events

  let gustSpell = 0; // remaining records in a gusty spell

  for (let i = 0; i < TOTAL; i++) {
    const t = now - (TOTAL - i) * 30_000;
    const frac = i / TOTAL; // 0 → 1 over 24 h

    // ── Angle: slow oscillation -40°..+55°, mix of periods ──────────────
    const angle =
      20 +
      25 * Math.sin(frac * 2 * Math.PI * 4) +       // 4-cycle slow shift
      12 * Math.sin(frac * 2 * Math.PI * 11 + 1) +  // faster oscillation
      (Math.random() - 0.5) * 8;                     // noise

    // ── Speed: 8–22 kn with a morning-lull / afternoon-build shape ──────
    const diurnal = 5 * Math.sin((frac - 0.15) * Math.PI); // peak at ~noon
    const baseSpeed = Math.max(2, 13 + diurnal + (Math.random() - 0.5) * 3);

    // ── Gust spell logic ─────────────────────────────────────────────────
    if (gustSpell > 0) {
      gustSpell--;
    } else if (Math.random() < 0.04) {
      // Start a gusty spell (~4 % chance each record = ~1.2 per hour)
      gustSpell = Math.floor(4 + Math.random() * 8); // 2–5 min spells
    }

    const isGusty = gustSpell > 0;
    const gustMultiplier = isGusty
      ? 1.3 + Math.random() * 0.5   // strong gust: +30–80 %
      : 1.0 + Math.random() * 0.18; // background puff: +0–18 %

    const gustSpeed = baseSpeed * gustMultiplier;
    const gustAngle = angle + (Math.random() - 0.5) * 20; // gust shifts angle slightly

    // ── True wind: slightly slower + wider angle than apparent ───────────
    const tSpeed = baseSpeed * 0.82 + (Math.random() - 0.5) * 1.5;
    const tAngle = angle * 1.08 + (Math.random() - 0.5) * 5;
    const tGust = gustSpeed * 0.82;

    records.push({
      t,
      aSpeed: +baseSpeed.toFixed(1),
      aAngle: +angle.toFixed(1),
      aGust:  +gustSpeed.toFixed(1),
      aGustAngle: +gustAngle.toFixed(1),
      tSpeed: +tSpeed.toFixed(1),
      tAngle: +tAngle.toFixed(1),
      tGust:  +tGust.toFixed(1),
      tGustAngle: +gustAngle.toFixed(1),
    });
  }

  // Bypass addWindRecord (avoids 2 880 AsyncStorage writes) — test only
  useBoatStore.setState({windHistory: records});
}
