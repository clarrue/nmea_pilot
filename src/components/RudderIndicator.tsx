/**
 * RudderIndicator — arc-style gauge, -35° (port) to +35° (starboard).
 *
 * Layout:
 *   - Thick grey arc track
 *   - A needle sweeping along the arc
 *   - Large digital angle readout in the centre
 *   - PORT / STBD labels at the extremes
 *   - All monochrome (no port/centre/stbd colour zones)
 */
import React, {memo} from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';

interface RudderIndicatorProps {
  angle?: number; // -35 (full port) to +35 (full stbd)
  size?: number;  // controls width; height = size * (HEIGHT / WIDTH)
}

// ── SVG constants ─────────────────────────────────────────────────────────────
const WIDTH = 300;
const HEIGHT = 220;
const CX = 150;
const CY = 210; // arc centre near bottom so the arc sweeps over the label area

const R = 170;       // arc radius
const ARC_W = 28;    // coloured band stroke width
const MAX_DEG = 35;  // physical rudder limit

// The gauge spans from -MAX_DEG to +MAX_DEG relative to straight-ahead (top).
// We map that to SVG angles: svgAngle = bowAngle - 90
// So: -35° bow → SVG -125°;  0° bow → SVG -90°;  +35° bow → SVG -55°
function bowToSVG(bowDeg: number): number {
  return bowDeg - 90; // SVG rotation from 3-o'clock reference
}

// Point on the arc for a given rudder angle
function arcPoint(angleDeg: number, r: number) {
  const rad = (bowToSVG(angleDeg) * Math.PI) / 180;
  return {x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad)};
}

// Build an SVG arc path segment from angle a1 to a2 at radius r (clockwise)
function arcPath(a1: number, a2: number, r: number): string {
  const p1 = arcPoint(a1, r);
  const p2 = arcPoint(a2, r);
  const sweep = a2 > a1 ? 1 : 0;
  const delta = Math.abs(a2 - a1);
  const large = delta > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} ${sweep} ${p2.x} ${p2.y}`;
}

// ─────────────────────────────────────────────────────────────────────────────

function RudderIndicatorInner({angle = 0, size = 300}: RudderIndicatorProps) {
  const {colors} = useTheme();
  const clamped = Math.max(-MAX_DEG, Math.min(MAX_DEG, angle));

  // The filled arc goes from 0° to the current angle
  const filledArc =
    Math.abs(clamped) > 0.5 ? arcPath(0, clamped, R) : null;

  // Needle tip position
  const needleTip = arcPoint(clamped, R - ARC_W / 2 - 4);
  const needleBase = arcPoint(clamped, R - ARC_W / 2 - 30);

  // Scale factor for the SVG → displayed size
  const svgHeight = (HEIGHT * size) / WIDTH;

  return (
    <Svg
      width={size}
      height={svgHeight}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      accessibilityLabel="Rudder Indicator">

      {/* ── Background arc track (grey) ── */}
      <Path
        d={arcPath(-MAX_DEG, MAX_DEG, R)}
        stroke={colors.surfaceElevated}
        strokeWidth={ARC_W}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Filled deflection arc (neutral) ── */}
      {filledArc && (
        <Path
          d={filledArc}
          stroke={colors.textSecondary}
          strokeWidth={ARC_W}
          fill="none"
          strokeLinecap="butt"
          opacity={0.9}
        />
      )}

      {/* ── Centre-zero tick ── */}
      {(() => {
        const c0 = arcPoint(0, R + ARC_W / 2 + 4);
        const c1 = arcPoint(0, R - ARC_W / 2 - 4);
        return (
          <Line
            x1={c0.x} y1={c0.y}
            x2={c1.x} y2={c1.y}
            stroke={colors.text}
            strokeWidth={2.5}
          />
        );
      })()}

      {/* ── Limit ticks at ±35° ── */}
      {([-MAX_DEG, MAX_DEG] as number[]).map(a => {
        const outer = arcPoint(a, R + ARC_W / 2 + 4);
        const inner = arcPoint(a, R - ARC_W / 2 - 4);
        return (
          <Line
            key={a}
            x1={outer.x} y1={outer.y}
            x2={inner.x} y2={inner.y}
            stroke={colors.textMuted}
            strokeWidth={1.5}
          />
        );
      })}

      {/* ── Needle ── */}
      <Line
        x1={needleBase.x}
        y1={needleBase.y}
        x2={needleTip.x}
        y2={needleTip.y}
        stroke={colors.textSecondary}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <Circle
        cx={needleTip.x}
        cy={needleTip.y}
        r={7}
        fill={colors.textSecondary}
      />

      {/* ── PORT label ── */}
      {(() => {
        const p = arcPoint(-MAX_DEG, R + ARC_W / 2 + 18);
        return (
          <SvgText
            x={p.x}
            y={p.y}
            textAnchor="middle"
            alignmentBaseline="central"
            fill={colors.textSecondary}
            fontSize="13"
            fontWeight="bold">
            P
          </SvgText>
        );
      })()}

      {/* ── STBD label ── */}
      {(() => {
        const p = arcPoint(MAX_DEG, R + ARC_W / 2 + 18);
        return (
          <SvgText
            x={p.x}
            y={p.y}
            textAnchor="middle"
            alignmentBaseline="central"
            fill={colors.textSecondary}
            fontSize="13"
            fontWeight="bold">
            S
          </SvgText>
        );
      })()}

      {/* ── Large digital angle ── */}
      <SvgText
        x={CX}
        y={CY - R + 64}
        textAnchor="middle"
        alignmentBaseline="central"
        fill={colors.text}
        fontSize="58"
        fontWeight="900"
        fontVariant="tabular-nums">
        {clamped > 0 ? '+' : ''}{clamped.toFixed(1)}°
      </SvgText>
    </Svg>
  );
}

export const RudderIndicator = memo(RudderIndicatorInner);
