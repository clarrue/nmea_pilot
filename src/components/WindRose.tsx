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
import {toRadians} from '../utils/headingMath';

interface WindRoseProps {
  apparentAngle?: number;  // bow-relative, degrees
  apparentSpeed?: number;  // knots
  trueAngle?: number;      // bow-relative, degrees
  trueSpeed?: number;      // knots
  size?: number;
}

const CX = 150;
const CY = 150;
const OUTER_R = 120;
const LABEL_R = 138;

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function WindArrow({
  angle,
  speed,
  color,
  arrowId,
}: {
  angle: number;
  speed: number;
  color: string;
  arrowId: string;
}) {
  // Arrow length proportional to speed (max ~100px at 50kn)
  const length = Math.min(Math.max(speed * 2, 20), 100);
  // Arrow tip points toward the direction the wind is coming FROM (i.e., angle 0 = wind from bow = arrow points up)
  // SVG rotation: angle 0 = pointing up (toward N / bow), clockwise = starboard
  return (
    <G rotation={angle} origin={`${CX},${CY}`}>
      {/* Shaft */}
      <Line
        x1={CX}
        y1={CY + length * 0.2}
        x2={CX}
        y2={CY - length * 0.8}
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      {/* Arrowhead */}
      <Polygon
        points={`${CX},${CY - length * 0.8} ${CX - 6},${CY - length * 0.8 + 14} ${CX + 6},${CY - length * 0.8 + 14}`}
        fill={color}
      />
      {/* Speed label */}
      <SvgText
        x={CX + 10}
        y={CY - length * 0.8 + 5}
        fill={color}
        fontSize="10"
        fontWeight="bold">
        {speed.toFixed(1)}
      </SvgText>
    </G>
  );
}

function WindRoseInner({
  apparentAngle,
  apparentSpeed,
  trueAngle,
  trueSpeed,
  size = 300,
}: WindRoseProps) {
  const {colors} = useTheme();

  // Generate tick marks and cardinal labels
  const geometry = useMemo(() => {
    const ticks: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      major: boolean;
    }> = [];
    const labels: Array<{x: number; y: number; label: string}> = [];

    for (let i = 0; i < 360; i += 5) {
      const rad = toRadians(i - 90);
      const inner = i % 10 === 0 ? OUTER_R - 10 : OUTER_R - 5;
      ticks.push({
        x1: CX + OUTER_R * Math.cos(rad),
        y1: CY + OUTER_R * Math.sin(rad),
        x2: CX + inner * Math.cos(rad),
        y2: CY + inner * Math.sin(rad),
        major: i % 45 === 0,
      });
    }

    CARDINALS.forEach((label, idx) => {
      const deg = idx * 45;
      const rad = toRadians(deg - 90);
      labels.push({
        x: CX + LABEL_R * Math.cos(rad),
        y: CY + LABEL_R * Math.sin(rad),
        label,
      });
    });

    return {ticks, labels};
  }, []);

  const scale = size / 300;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      accessibilityLabel="Wind Rose">
      {/* Background */}
      <Circle cx={CX} cy={CY} r={OUTER_R} fill={colors.surface} stroke={colors.border} strokeWidth={1} />

      {/* Tick marks */}
      {geometry.ticks.map((t, i) => (
        <Line
          key={`tick-${i}`}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={colors.textMuted}
          strokeWidth={t.major ? 1.5 : 0.8}
        />
      ))}

      {/* Cardinal labels */}
      {geometry.labels.map(({x, y, label}) => (
        <SvgText
          key={label}
          x={x}
          y={y}
          textAnchor="middle"
          alignmentBaseline="central"
          fill={colors.text}
          fontSize="12"
          fontWeight="bold">
          {label}
        </SvgText>
      ))}

      {/* Boat triangle */}
      <Path
        d="M150,130 L160,165 L150,158 L140,165 Z"
        fill={colors.textSecondary}
        stroke={colors.text}
        strokeWidth={1}
      />

      {/* True wind arrow (orange) */}
      {trueAngle !== undefined && trueSpeed !== undefined && trueSpeed > 0 && (
        <WindArrow
          angle={trueAngle}
          speed={trueSpeed}
          color={colors.windTrue}
          arrowId="true"
        />
      )}

      {/* Apparent wind arrow (blue) */}
      {apparentAngle !== undefined &&
        apparentSpeed !== undefined &&
        apparentSpeed > 0 && (
          <WindArrow
            angle={apparentAngle}
            speed={apparentSpeed}
            color={colors.windApparent}
            arrowId="apparent"
          />
        )}

      {/* Center dot */}
      <Circle cx={CX} cy={CY} r={4} fill={colors.text} />
    </Svg>
  );
}

export const WindRose = memo(WindRoseInner);
