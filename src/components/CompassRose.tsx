import React, {memo, useMemo} from 'react';
import Svg, {Circle, G, Line, Path, Text as SvgText} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';
import {toRadians} from '../utils/headingMath';

interface CompassRoseProps {
  heading?: number; // degrees true
  size?: number;
}

const CX = 150;
const CY = 150;
const RING_R = 115;
const LABEL_R = 100;

const CARDINALS = [
  {label: 'N', deg: 0},
  {label: 'E', deg: 90},
  {label: 'S', deg: 180},
  {label: 'W', deg: 270},
];

function CompassRoseInner({heading = 0, size = 300}: CompassRoseProps) {
  const {colors} = useTheme();

  const ticks = useMemo(() => {
    const result = [];
    for (let i = 0; i < 360; i += 5) {
      const rad = toRadians(i - 90);
      const inner = i % 10 === 0 ? RING_R - 10 : RING_R - 5;
      result.push({
        x1: CX + RING_R * Math.cos(rad),
        y1: CY + RING_R * Math.sin(rad),
        x2: CX + inner * Math.cos(rad),
        y2: CY + inner * Math.sin(rad),
        major: i % 45 === 0,
      });
    }
    return result;
  }, []);

  // Rotate ring so heading points up (needle fixed, ring rotates)
  const ringRotation = -heading;

  return (
    <Svg width={size} height={size} viewBox="0 0 300 300" accessibilityLabel="Compass">
      {/* Outer circle */}
      <Circle
        cx={CX}
        cy={CY}
        r={RING_R}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={2}
      />

      {/* Rotating ring with ticks and labels */}
      <G rotation={ringRotation} origin={`${CX},${CY}`}>
        {ticks.map((t, i) => (
          <Line
            key={`ct-${i}`}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={colors.textMuted}
            strokeWidth={t.major ? 1.5 : 0.8}
          />
        ))}
        {CARDINALS.map(({label, deg}) => {
          const rad = toRadians(deg - 90);
          return (
            <SvgText
              key={label}
              x={CX + LABEL_R * Math.cos(rad)}
              y={CY + LABEL_R * Math.sin(rad)}
              textAnchor="middle"
              alignmentBaseline="central"
              fill={label === 'N' ? colors.compassNeedle : colors.text}
              fontSize="14"
              fontWeight="bold">
              {label}
            </SvgText>
          );
        })}
      </G>

      {/* Fixed lubber line (top = bow) */}
      <Line
        x1={CX}
        y1={CY - RING_R}
        x2={CX}
        y2={CY - RING_R + 18}
        stroke={colors.accent}
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* Heading digital readout */}
      <SvgText
        x={CX}
        y={CY + 15}
        textAnchor="middle"
        fill={colors.text}
        fontSize="28"
        fontWeight="bold">
        {String(Math.round(heading) % 360).padStart(3, '0')}°
      </SvgText>

      {/* Center dot */}
      <Circle cx={CX} cy={CY} r={4} fill={colors.text} />
    </Svg>
  );
}

export const CompassRose = memo(CompassRoseInner);
