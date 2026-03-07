/**
 * WindRose — bow-relative wind angle display (B&G / Garmin style).
 *
 * Layout:
 *   - Full circle, 0° at top = bow, clockwise = starboard
 *   - Outer band: 0–60° green (stbd) / red (port), rest grey
 *   - Tick marks every 10°, neutral-colour degree labels every 30°
 *   - Bow marker (filled triangle) at 12-o'clock
 *   - Boat-hull shaped indicator (viewed from above) pointing toward wind
 *   - Speed readout in centre
 *   - Optional corner data: AWA / AWS (top) and TWA / TWS (bottom)
 */
import React, {memo, useMemo} from 'react';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';
// Path kept for arc bands
import {useTheme} from '../theme/ThemeContext';

// ── Props ─────────────────────────────────────────────────────────────────────

interface WindRoseProps {
  angle?: number;   // bow-relative degrees, negative = port, positive = stbd
  speed?: number;   // knots (for centre readout)
  size?: number;
  // Corner data (optional – shown only when provided)
  windApparent?: {angle: number; speed: number} | null;
  windTrue?: {angle: number; speed: number} | null;
}

// ── SVG layout constants ──────────────────────────────────────────────────────

const VB = 300;
const CX = 150;
const CY = 150;
const R_BAND = 118;
const BAND_W = 24;
const R_IN  = R_BAND - BAND_W / 2;  // 106
const R_OUT = R_BAND + BAND_W / 2;  // 130

const R_TICK_MAJOR_IN = 86;
const R_TICK_MINOR_IN = 98;
const R_LABEL = 143;

// ── Precomputed arc paths ─────────────────────────────────────────────────────

const TOP   = {x: 150, y: 32};
const BOT   = {x: 150, y: 268};
const P40S  = {x: 225.85, y: 59.61};
const P40P  = {x: 74.15,  y: 59.61};

const FULL_STBD   = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 1 ${BOT.x} ${BOT.y}`;
const FULL_PORT   = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 0 ${BOT.x} ${BOT.y}`;
const ARC_STBD_40 = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 1 ${P40S.x} ${P40S.y}`;
const ARC_PORT_40 = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 0 ${P40P.x} ${P40P.y}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad)};
}


// ── Main component ────────────────────────────────────────────────────────────

function WindRoseInner({
  angle,
  speed,
  size = 300,
  windApparent,
  windTrue,
}: WindRoseProps) {
  const {colors} = useTheme();

  const absAngle   = angle !== undefined ? Math.abs(angle) : 0;
  const isPort     = angle !== undefined && angle < 0;
  const isHighAngle = absAngle > 60;

  // Indicator / speed colour
  const accentColor =
    angle === undefined
      ? colors.textMuted
      : isHighAngle
      ? colors.textSecondary
      : isPort
      ? colors.danger
      : colors.success;

  const speedText = speed !== undefined ? speed.toFixed(1) : '---';
  const speedInt  = speed !== undefined ? Math.floor(speed).toString() : '---';
  const speedDec  = speed !== undefined ? '.' + speed.toFixed(1).split('.')[1] : '';

  // Tick marks
  const ticks = useMemo(() => {
    const list: {x1: number; y1: number; x2: number; y2: number; major: boolean}[] = [];
    for (let a = -170; a <= 180; a += 10) {
      const outer  = polar(a, R_IN);
      const isMajor = a % 30 === 0;
      const inner  = polar(a, isMajor ? R_TICK_MAJOR_IN : R_TICK_MINOR_IN);
      list.push({x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major: isMajor});
    }
    return list;
  }, []);

  // Degree labels every 30° (skip 0° — bow marker is there)
  const labels = useMemo(() => {
    const list: {x: number; y: number; text: string}[] = [];
    for (let a = -150; a <= 180; a += 30) {
      if (a === 0) {continue;}
      const pos = polar(a, R_LABEL);
      list.push({x: pos.x, y: pos.y, text: String(Math.abs(a))});
    }
    return list;
  }, []);

  // Angle value colour (port/stbd/high) — used for corner angle readings
  function angleValColor(ang: number): string {
    const abs = Math.abs(ang);
    if (abs > 60) {return colors.textSecondary;}
    return ang < 0 ? colors.danger : colors.success;
  }

  function angleStr(ang: number): string {
    return `${Math.abs(ang).toFixed(0)}°`;
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      accessibilityLabel="Wind Angle Gauge">

      {/* ── Outer bezel (contrast ring) ── */}
      <Circle cx={CX} cy={CY} r={R_OUT + 10} fill={colors.surfaceElevated} />
      <Circle cx={CX} cy={CY} r={R_OUT + 7}  fill={colors.border} />

      {/* ── Outer rim ── */}
      <Circle
        cx={CX} cy={CY} r={R_OUT + 3}
        fill={colors.background}
        stroke={colors.textSecondary}
        strokeWidth={2}
      />

      {/* ── Band: grey base ── */}
      <Path d={FULL_STBD} stroke={colors.surfaceElevated} strokeWidth={BAND_W} fill="none" strokeLinecap="butt" />
      <Path d={FULL_PORT} stroke={colors.surfaceElevated} strokeWidth={BAND_W} fill="none" strokeLinecap="butt" />

      {/* ── Band: coloured overlay 0°–40° ── */}
      <Path d={ARC_STBD_40} stroke={colors.success} strokeWidth={BAND_W} fill="none" strokeLinecap="butt" opacity={0.85} />
      <Path d={ARC_PORT_40} stroke={colors.danger}  strokeWidth={BAND_W} fill="none" strokeLinecap="butt" opacity={0.85} />

      {/* ── Inner background disc ── */}
      <Circle cx={CX} cy={CY} r={R_IN} fill={colors.surface} />

      {/* ── Tick marks ── */}
      {ticks.map((t, i) => (
        <Line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={t.major ? colors.textSecondary : colors.textMuted}
          strokeWidth={t.major ? 1.5 : 0.8}
        />
      ))}

      {/* ── Degree labels — neutral colour ── */}
      {labels.map(({x, y, text}, i) => (
        <SvgText
          key={i}
          x={x} y={y}
          textAnchor="middle"
          alignmentBaseline="central"
          fill={colors.textMuted}
          fontSize="13"
          fontWeight="bold">
          {text}
        </SvgText>
      ))}


      {/* ── Wind cursor (same triangle as bow marker, rotated to wind angle) ── */}
      {angle !== undefined && (
        <G rotation={angle} origin={`${CX},${CY}`}>
          <Polygon
            points={`${CX},${CY - R_IN + 4} ${CX - 9},${CY - R_IN + 22} ${CX + 9},${CY - R_IN + 22}`}
            fill={colors.text}
            opacity={0.95}
          />
        </G>
      )}

      {/* ── Speed readout — integer large, decimal smaller and lower ── */}
      <SvgText
        x={CX - 4} y={CY - 10}
        textAnchor="end"
        alignmentBaseline="central"
        fill={colors.text}
        fontSize="42"
        fontWeight="900"
        fontVariant="tabular-nums">
        {speedInt}
      </SvgText>
      {speedDec !== '' && (
        <SvgText
          x={CX - 2} y={CY + 6}
          textAnchor="start"
          alignmentBaseline="central"
          fill={colors.text}
          fontSize="22"
          fontWeight="700"
          fontVariant="tabular-nums">
          {speedDec}
        </SvgText>
      )}
      <SvgText
        x={CX} y={CY + 20}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize="11">
        kn
      </SvgText>

      {/* ── Direction readout ── */}
      <SvgText
        x={CX} y={CY + 34}
        textAnchor="middle"
        alignmentBaseline="central"
        fill={colors.text}
        fontSize="22"
        fontWeight="700"
        fontVariant="tabular-nums">
        {angle !== undefined ? `${Math.abs(angle).toFixed(0)}°` : '---'}
      </SvgText>

      {/* ── Corner data: AWA (top-left) / AWS (top-right) ── */}
      {windApparent && (
        <G>
          <SvgText x={8}   y={16} textAnchor="start" fill={colors.textMuted}                 fontSize="10" fontWeight="700">AWA</SvgText>
          <SvgText x={8}   y={36} textAnchor="start" fill={angleValColor(windApparent.angle)} fontSize="22" fontWeight="800" fontVariant="tabular-nums">{angleStr(windApparent.angle)}</SvgText>
          <SvgText x={292} y={16} textAnchor="end"   fill={colors.textMuted}                 fontSize="10" fontWeight="700">AWS</SvgText>
          <SvgText x={292} y={36} textAnchor="end"   fill={colors.windApparent}              fontSize="22" fontWeight="800" fontVariant="tabular-nums">{windApparent.speed.toFixed(1)}</SvgText>
          <SvgText x={292} y={48} textAnchor="end"   fill={colors.textMuted}                 fontSize="10">kn</SvgText>
        </G>
      )}

      {/* ── Corner data: TWA (bottom-left) / TWS (bottom-right) ── */}
      {windTrue && (
        <G>
          <SvgText x={8}   y={258} textAnchor="start" fill={colors.textMuted}               fontSize="10" fontWeight="700">TWA</SvgText>
          <SvgText x={8}   y={278} textAnchor="start" fill={angleValColor(windTrue.angle)}  fontSize="22" fontWeight="800" fontVariant="tabular-nums">{angleStr(windTrue.angle)}</SvgText>
          <SvgText x={292} y={258} textAnchor="end"   fill={colors.textMuted}               fontSize="10" fontWeight="700">TWS</SvgText>
          <SvgText x={292} y={278} textAnchor="end"   fill={colors.windTrue}                fontSize="22" fontWeight="800" fontVariant="tabular-nums">{windTrue.speed.toFixed(1)}</SvgText>
          <SvgText x={292} y={290} textAnchor="end"   fill={colors.textMuted}               fontSize="10">kn</SvgText>
        </G>
      )}
    </Svg>
  );
}

export const WindRose = memo(WindRoseInner);
