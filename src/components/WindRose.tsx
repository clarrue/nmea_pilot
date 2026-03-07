/**
 * WindRose — i60-style bow-relative wind angle display.
 *
 * Layout:
 *   - Full circle, 0° at top = bow, clockwise = starboard
 *   - Outer band: 0–60° zone neutral (grey), >60° port RED, >60° stbd GREEN
 *   - Tick marks every 10°, labelled every 30°
 *   - Bow marker (triangle) at 12-o'clock
 *   - Single needle (apparent or true, chosen outside)
 *   - Angle + speed readout in the lower half of the rose
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
import {useTheme} from '../theme/ThemeContext';

interface WindRoseProps {
  angle?: number;  // bow-relative degrees, negative = port, positive = stbd
  speed?: number;  // knots
  size?: number;
}

// ── SVG constants ─────────────────────────────────────────────────────────────
const VB = 300;          // viewBox square size
const CX = 150;
const CY = 150;
const R_BAND = 118;      // centre radius of the coloured band
const BAND_W = 24;       // stroke width of the coloured band
const R_IN = R_BAND - BAND_W / 2;   // inner edge of band = 106
const R_OUT = R_BAND + BAND_W / 2;  // outer edge of band = 130

// Tick radii (measuring inward from inner edge of band)
const R_TICK_MAJOR_IN = 86; // major tick inner end
const R_TICK_MINOR_IN = 98; // minor tick inner end

const R_LABEL = 74; // degree label radius
const R_NEEDLE = R_IN - 6; // 100

// ── Arc segment precomputed coordinates ──────────────────────────────────────
// Full-circle band split into two semicircles (grey base layer)
const TOP = {x: 150, y: 32};   // 0°  (bow)
const BOT = {x: 150, y: 268};  // 180° (stern)
const FULL_STBD = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 1 ${BOT.x} ${BOT.y}`; // clockwise
const FULL_PORT = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 0 ${BOT.x} ${BOT.y}`; // counterclockwise

// Coloured overlay arcs (0°–60° only, drawn on top of the grey base)
// P60S = polar(60,118)  = (252.19, 91)  — upper-right / 2 o'clock
// P60P = polar(-60,118) = (47.81,  91)  — upper-left  / 10 o'clock
const P60S = {x: 252.19, y: 91};
const P60P = {x: 47.81,  y: 91};
// 0°→60° stbd: top clockwise to 2 o'clock
const ARC_STBD_60 = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 1 ${P60S.x} ${P60S.y}`;
// 0°→60° port: top counterclockwise to 10 o'clock
const ARC_PORT_60 = `M ${TOP.x} ${TOP.y} A ${R_BAND} ${R_BAND} 0 0 0 ${P60P.x} ${P60P.y}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert bow-relative angle (0=top, +cw=stbd) to SVG x,y at radius r. */
function polar(angleDeg: number, r: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad)};
}

// ── Needle ────────────────────────────────────────────────────────────────────

function Needle({
  angle,
  color,
  length,
  width = 3,
}: {
  angle: number;
  color: string;
  length: number;
  width?: number;
}) {
  const TAIL = 14;
  const TIP_W = width * 1.8;
  return (
    <G rotation={angle} origin={`${CX},${CY}`}>
      {/* Shaft */}
      <Line
        x1={CX}
        y1={CY + TAIL}
        x2={CX}
        y2={CY - length}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {/* Arrowhead at tip */}
      <Polygon
        points={`${CX},${CY - length} ${CX - TIP_W},${CY - length + TIP_W * 2.5} ${CX + TIP_W},${CY - length + TIP_W * 2.5}`}
        fill={color}
      />
    </G>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function WindRoseInner({
  angle,
  speed,
  size = 300,
}: WindRoseProps) {
  const {colors} = useTheme();

  // Needle / text colour: red/green within 0–60°, neutral beyond 60°
  const absAngle = angle !== undefined ? Math.abs(angle) : 0;
  const isPort = angle !== undefined && angle < 0;
  const isHighAngle = absAngle > 60;

  const accentColor =
    angle === undefined
      ? colors.textMuted
      : isHighAngle
      ? colors.textSecondary
      : isPort
      ? colors.danger
      : colors.success;

  // Centre text
  const angleText =
    angle === undefined
      ? '---'
      : absAngle < 0.5
      ? '0°'
      : `${isPort ? 'P' : 'S'} ${absAngle.toFixed(0)}°`;

  const speedText = speed !== undefined ? speed.toFixed(1) : '---';

  // Pre-compute tick marks
  const ticks = useMemo(() => {
    const list: {x1: number; y1: number; x2: number; y2: number; major: boolean}[] = [];
    for (let a = -170; a <= 180; a += 10) {
      const outer = polar(a, R_IN);
      const isMajor = a % 30 === 0;
      const inner = polar(a, isMajor ? R_TICK_MAJOR_IN : R_TICK_MINOR_IN);
      list.push({x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major: isMajor});
    }
    return list;
  }, []);

  // Pre-compute labels (every 30°, skip 0 which has the bow marker)
  const labels = useMemo(() => {
    const list: {x: number; y: number; text: string; port: boolean}[] = [];
    for (let a = -150; a <= 180; a += 30) {
      if (a === 0) {continue;}
      const pos = polar(a, R_LABEL);
      list.push({x: pos.x, y: pos.y, text: String(Math.abs(a)), port: a < 0});
    }
    return list;
  }, []);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      accessibilityLabel="Wind Angle Gauge">

      {/* ── Outer rim ── */}
      <Circle
        cx={CX}
        cy={CY}
        r={R_OUT + 3}
        fill={colors.background}
        stroke={colors.border}
        strokeWidth={1.5}
      />

      {/* ── Full band grey base (both halves) ── */}
      <Path
        d={FULL_STBD}
        stroke={colors.surfaceElevated}
        strokeWidth={BAND_W}
        fill="none"
        strokeLinecap="butt"
      />
      <Path
        d={FULL_PORT}
        stroke={colors.surfaceElevated}
        strokeWidth={BAND_W}
        fill="none"
        strokeLinecap="butt"
      />

      {/* ── Coloured overlay: 0°–60° green (stbd) and red (port) ── */}
      <Path
        d={ARC_STBD_60}
        stroke={colors.success}
        strokeWidth={BAND_W}
        fill="none"
        strokeLinecap="butt"
        opacity={0.85}
      />
      <Path
        d={ARC_PORT_60}
        stroke={colors.danger}
        strokeWidth={BAND_W}
        fill="none"
        strokeLinecap="butt"
        opacity={0.85}
      />

      {/* ── Inner background circle ── */}
      <Circle cx={CX} cy={CY} r={R_IN} fill={colors.surface} />

      {/* ── Tick marks ── */}
      {ticks.map((t, i) => (
        <Line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? colors.textSecondary : colors.textMuted}
          strokeWidth={t.major ? 1.5 : 0.8}
        />
      ))}

      {/* ── Degree labels ── */}
      {labels.map(({x, y, text, port}, i) => (
        <SvgText
          key={i}
          x={x}
          y={y}
          textAnchor="middle"
          alignmentBaseline="central"
          fill={port ? colors.danger : colors.success}
          fontSize="13"
          fontWeight="bold">
          {text}
        </SvgText>
      ))}

      {/* ── Bow marker (triangle at 0°) ── */}
      <Polygon
        points={`${CX},${CY - R_IN + 4} ${CX - 9},${CY - R_IN + 22} ${CX + 9},${CY - R_IN + 22}`}
        fill={colors.text}
        opacity={0.9}
      />

      {/* ── Wind needle ── */}
      {angle !== undefined && (
        <Needle
          angle={angle}
          color={accentColor}
          length={R_NEEDLE}
          width={3.5}
        />
      )}

      {/* ── Center pivot ── */}
      <Circle
        cx={CX}
        cy={CY}
        r={7}
        fill={colors.surface}
        stroke={colors.text}
        strokeWidth={2}
      />

      {/* ── Angle readout (below pivot, inside lower circle) ── */}
      <SvgText
        x={CX}
        y={CY + 44}
        textAnchor="middle"
        alignmentBaseline="central"
        fill={accentColor}
        fontSize="32"
        fontWeight="900"
        fontVariant="tabular-nums">
        {angleText}
      </SvgText>

      {/* ── Speed readout ── */}
      <SvgText
        x={CX}
        y={CY + 76}
        textAnchor="middle"
        alignmentBaseline="central"
        fill={accentColor}
        fontSize="22"
        fontWeight="bold"
        fontVariant="tabular-nums">
        {speedText}
      </SvgText>
      <SvgText
        x={CX}
        y={CY + 92}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize="10">
        {'kts'}
      </SvgText>
    </Svg>
  );
}

export const WindRose = memo(WindRoseInner);
