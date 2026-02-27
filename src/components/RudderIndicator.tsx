import React, {memo} from 'react';
import Svg, {G, Line, Rect, Text as SvgText} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';

interface RudderIndicatorProps {
  angle?: number; // -35 to +35, negative=port, positive=starboard
  size?: number;
}

const WIDTH = 300;
const HEIGHT = 80;
const TRACK_Y = 40;
const TRACK_LEFT = 30;
const TRACK_RIGHT = 270;
const TRACK_WIDTH = TRACK_RIGHT - TRACK_LEFT;
const MAX_ANGLE = 35;

function RudderIndicatorInner({angle = 0, size = 300}: RudderIndicatorProps) {
  const {colors} = useTheme();
  const clamped = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));

  // Center x = mid of track
  const centerX = (TRACK_LEFT + TRACK_RIGHT) / 2;
  // Bar extends from center to angle position
  const angleToX = (a: number) =>
    centerX + (a / MAX_ANGLE) * (TRACK_WIDTH / 2);
  const barX = angleToX(clamped);
  const barLeft = Math.min(centerX, barX);
  const barWidth = Math.abs(barX - centerX);

  // Color: port=red, center=green, starboard=blue
  const barColor =
    Math.abs(clamped) < 2
      ? colors.success
      : clamped < 0
      ? colors.danger
      : colors.rudderBar;

  return (
    <Svg
      width={size}
      height={(HEIGHT * size) / WIDTH}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      accessibilityLabel="Rudder Indicator">
      {/* Track */}
      <Rect
        x={TRACK_LEFT}
        y={TRACK_Y - 6}
        width={TRACK_WIDTH}
        height={12}
        rx={4}
        fill={colors.surfaceElevated}
        stroke={colors.border}
        strokeWidth={1}
      />

      {/* Bar */}
      {barWidth > 0 && (
        <Rect
          x={barLeft}
          y={TRACK_Y - 6}
          width={barWidth}
          height={12}
          fill={barColor}
          opacity={0.85}
        />
      )}

      {/* Center tick */}
      <Line
        x1={centerX}
        y1={TRACK_Y - 12}
        x2={centerX}
        y2={TRACK_Y + 12}
        stroke={colors.text}
        strokeWidth={2}
      />

      {/* -35 label */}
      <SvgText
        x={TRACK_LEFT}
        y={TRACK_Y + 24}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize="10">
        P35
      </SvgText>

      {/* +35 label */}
      <SvgText
        x={TRACK_RIGHT}
        y={TRACK_Y + 24}
        textAnchor="middle"
        fill={colors.textMuted}
        fontSize="10">
        S35
      </SvgText>

      {/* Angle label */}
      <SvgText
        x={centerX}
        y={TRACK_Y + 24}
        textAnchor="middle"
        fill={colors.text}
        fontSize="12"
        fontWeight="bold">
        {clamped > 0 ? '+' : ''}
        {clamped.toFixed(1)}°
      </SvgText>

      {/* Pointer triangle */}
      <G>
        <Line
          x1={barX}
          y1={TRACK_Y - 12}
          x2={barX}
          y2={TRACK_Y + 12}
          stroke={barColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
}

export const RudderIndicator = memo(RudderIndicatorInner);
