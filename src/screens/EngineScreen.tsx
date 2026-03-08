import React, {useEffect, useRef, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Line, Rect, Text as SvgText} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {StampedValue} from '../store/slices/nmea.slice';

// ─── Ford Lehman SP135 2725E thresholds ───────────────────────────────────────
//   Max continuous: 2600 RPM in gear | Absolute max: 2850 RPM
//   Coolant: normal 78-84°C | alarm 96°C | danger 104°C
//   Oil pressure: normal 50-65 psi cruise | warning < 30 psi
//   Oil temp: normal 80-93°C | warning 107°C

const BAR_TO_PSI = 14.5038;

const RPM_MAX = 3000;   // diesel — scale tops at 3000
const RPM_WARN = 2200;  // approaching max continuous
const RPM_DANGER = 2600; // at rated max continuous

function RpmSection({rpm, colors}: {rpm: StampedValue<number> | null; colors: any}) {
  const value = rpm?.value ?? null;
  const barFill = value !== null ? Math.min(value / RPM_MAX, 1) : 0;
  const barColor = value !== null ? rpmColor(value, colors) : colors.textMuted;
  const displayValue = value !== null ? Math.round(value).toString() : '---';

  return (
    <View style={[styles.rpmSection, {backgroundColor: colors.surface}]}>
      <Text style={[styles.rpmLabel, {color: colors.textSecondary}]}>ENGINE RPM</Text>
      <View style={styles.rpmValueRow}>
        <Text style={[styles.rpmValue, {color: barColor}]}>{displayValue}</Text>
        <Text style={[styles.rpmUnit, {color: colors.textMuted}]}>rpm</Text>
      </View>

      {/* Bar track */}
      <View style={[styles.rpmBarTrack, {backgroundColor: colors.surfaceElevated, borderColor: colors.border}]}>
        <View
          style={[
            styles.rpmBarFill,
            {width: `${barFill * 100}%` as any, backgroundColor: barColor},
          ]}
        />
      </View>

      {/* Scale ticks */}
      <View style={styles.rpmScale}>
        {[0, 500, 1000, 1500, 2000, 2500, 3000].map(tick => (
          <Text key={tick} style={[styles.rpmTick, {color:
            tick > RPM_DANGER ? colors.danger :
            tick > RPM_WARN ? colors.warning :
            colors.textMuted}]}>
            {tick === 0 ? '0' : tick >= 1000 ? `${tick/1000}k` : tick}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Voltage color helper ─────────────────────────────────────────────────────

function voltageColor(v: number, colors: any): string {
  if (v < 12.5) {return colors.danger;}
  if (v < 13.0) {return colors.warning;}
  if (v <= 14.8) {return colors.success;}
  return colors.warning;
}

// ─── Fuel bar cell ────────────────────────────────────────────────────────────

function FuelCell({
  fuelLevel,
  colors,
}: {
  fuelLevel: StampedValue<number> | null;
  colors: any;
}) {
  const value = fuelLevel?.value ?? null;
  const barFill = value !== null ? Math.min(Math.max(value, 0), 100) / 100 : 0;
  const barColor =
    value === null
      ? colors.textMuted
      : value < 10
      ? colors.danger
      : value < 25
      ? colors.warning
      : colors.success;
  const displayValue = value !== null ? value.toFixed(0) : '---';

  return (
    <View style={[styles.cell, {backgroundColor: colors.surfaceElevated, borderColor: colors.border}]}>
      <Text style={[styles.cellLabel, {color: colors.textSecondary}]}>FUEL LEVEL</Text>
      <View style={styles.cellValueRow}>
        <Text style={[styles.cellValue, {color: barColor}]}>{displayValue}</Text>
        <Text style={[styles.cellUnit, {color: colors.textMuted}]}>%</Text>
      </View>
      <View style={[styles.fuelBarTrack, {backgroundColor: colors.surface, borderColor: colors.border}]}>
        <View
          style={[
            styles.fuelBarFill,
            {width: `${barFill * 100}%` as any, backgroundColor: barColor},
          ]}
        />
      </View>
    </View>
  );
}

// ─── Generic value cell ───────────────────────────────────────────────────────

function ValueCell({
  label,
  stamped,
  unit,
  valueColor,
  formatValue,
  colors,
}: {
  label: string;
  stamped: StampedValue<number> | null;
  unit: string;
  valueColor: string;
  formatValue: (v: number) => string;
  colors: any;
}) {
  const displayValue = stamped !== null ? formatValue(stamped.value) : '---';

  return (
    <View style={[styles.cell, {backgroundColor: colors.surfaceElevated, borderColor: colors.border}]}>
      <Text style={[styles.cellLabel, {color: colors.textSecondary}]}>{label}</Text>
      <View style={styles.cellValueRow}>
        <Text style={[styles.cellValue, {color: valueColor}]} numberOfLines={1} adjustsFontSizeToFit>
          {displayValue}
        </Text>
        {stamped !== null && (
          <Text style={[styles.cellUnit, {color: colors.textMuted}]}>{unit}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Oil pressure vs RPM scatter plot ─────────────────────────────────────────

const OIL_P_MAX_PSI = 90;  // psi, y-axis top
const OIL_P_DANGER_PSI = 30; // < 30 psi = danger (official manual alarm threshold)
const OIL_P_WARN_PSI = 40;   // 30-40 psi = caution buffer zone
const HISTORY_MAX = 300; // max data points kept

interface OilRpmPoint { rpm: number; oil: number; }

function OilVsRpmChart({points, width, colors}: {
  points: OilRpmPoint[];
  width: number;
  colors: any;
}) {
  const PAD = {top: 10, right: 16, bottom: 32, left: 40};
  const H = 200;
  const W = width;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const toX = (rpm: number) => PAD.left + (rpm / RPM_MAX) * plotW;
  const toY = (psi: number) => PAD.top + (1 - psi / OIL_P_MAX_PSI) * plotH;

  // Reference lines: danger and warning
  const yDanger = toY(OIL_P_DANGER_PSI);
  const yWarn   = toY(OIL_P_WARN_PSI);

  // X axis ticks
  const xTicks = [0, 500, 1000, 1500, 2000, 2500, 3000];
  // Y axis ticks in PSI
  const yTicks = [0, 15, 30, 45, 60, 75, 90];

  return (
    <View style={[styles.chartCard, {backgroundColor: colors.surface}]}>
      <Text style={[styles.chartTitle, {color: colors.textSecondary}]}>OIL PRESSURE vs RPM</Text>
      <Svg width={W} height={H}>
        {/* Danger zone background (below 30 psi) */}
        <Rect
          x={PAD.left} y={yDanger}
          width={plotW} height={plotH - (yDanger - PAD.top)}
          fill={colors.danger} opacity={0.08}
        />
        {/* Warning zone background (30–45 psi) */}
        <Rect
          x={PAD.left} y={yWarn}
          width={plotW} height={yDanger - yWarn}
          fill={colors.warning} opacity={0.08}
        />

        {/* Horizontal reference lines */}
        <Line x1={PAD.left} y1={yDanger} x2={PAD.left + plotW} y2={yDanger}
          stroke={colors.danger} strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
        <Line x1={PAD.left} y1={yWarn} x2={PAD.left + plotW} y2={yWarn}
          stroke={colors.warning} strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />

        {/* Y axis ticks and labels */}
        {yTicks.map(v => {
          const y = toY(v);
          return (
            <React.Fragment key={v}>
              <Line x1={PAD.left - 4} y1={y} x2={PAD.left} y2={y}
                stroke={colors.textMuted} strokeWidth={1} />
              <SvgText x={PAD.left - 6} y={y} textAnchor="end" alignmentBaseline="central"
                fill={colors.textMuted} fontSize="9">{v}</SvgText>
            </React.Fragment>
          );
        })}

        {/* X axis ticks and labels */}
        {xTicks.map(v => {
          const x = toX(v);
          return (
            <React.Fragment key={v}>
              <Line x1={x} y1={PAD.top + plotH} x2={x} y2={PAD.top + plotH + 4}
                stroke={colors.textMuted} strokeWidth={1} />
              <SvgText x={x} y={PAD.top + plotH + 14} textAnchor="middle"
                fill={colors.textMuted} fontSize="9">
                {v === 0 ? '0' : v >= 1000 ? `${v/1000}k` : v}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Axes */}
        <Line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH}
          stroke={colors.border} strokeWidth={1} />
        <Line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH}
          stroke={colors.border} strokeWidth={1} />

        {/* Axis unit labels */}
        <SvgText x={PAD.left - 32} y={PAD.top + plotH / 2} textAnchor="middle"
          fill={colors.textMuted} fontSize="9" rotation="-90"
          originX={PAD.left - 32} originY={PAD.top + plotH / 2}>psi</SvgText>
        <SvgText x={PAD.left + plotW / 2} y={H - 2} textAnchor="middle"
          fill={colors.textMuted} fontSize="9">RPM</SvgText>

        {/* Data points — convert bar → psi */}
        {points.map((p, i) => {
          const psi = p.oil * BAR_TO_PSI;
          const dotColor =
            psi < OIL_P_DANGER_PSI ? colors.danger :
            psi < OIL_P_WARN_PSI   ? colors.warning :
            colors.success;
          return (
            <Circle key={i} cx={toX(p.rpm)} cy={toY(psi)}
              r={3} fill={dotColor} opacity={0.75} />
          );
        })}

        {/* Empty state */}
        {points.length === 0 && (
          <SvgText x={PAD.left + plotW / 2} y={PAD.top + plotH / 2}
            textAnchor="middle" alignmentBaseline="central"
            fill={colors.textMuted} fontSize="11">No data yet</SvgText>
        )}
      </Svg>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function EngineScreen() {
  const {colors} = useTheme();

  // Oil vs RPM history buffer
  const historyRef = useRef<OilRpmPoint[]>([]);
  const [chartPoints, setChartPoints] = useState<OilRpmPoint[]>([]);
  const [chartWidth, setChartWidth] = useState(320);

  const rpm = useBoatStore(s => s.rpm);
  const oilPressure = useBoatStore(s => s.oilPressure);

  // Record (rpm, oilPressure) pairs whenever both are fresh
  useEffect(() => {
    if (rpm === null || oilPressure === null) {return;}
    const point: OilRpmPoint = {rpm: rpm.value, oil: oilPressure.value};
    const buf = historyRef.current;
    buf.push(point);
    if (buf.length > HISTORY_MAX) {buf.splice(0, buf.length - HISTORY_MAX);}
    setChartPoints([...buf]);
  }, [rpm?.updatedAt, oilPressure?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const coolantTemp = useBoatStore(s => s.coolantTemp);
  const oilTemp = useBoatStore(s => s.oilTemp);
  const alternatorVoltage = useBoatStore(s => s.alternatorVoltage);
  const fuelLevel = useBoatStore(s => s.fuelLevel);
  const batteryVoltage = useBoatStore(s => s.batteryVoltage);
  const engineHours = useBoatStore(s => s.engineHours);

  // Derived colors
  // Coolant: normal 78-84°C | alarm 96°C | danger 104°C
  const coolantColor =
    coolantTemp === null
      ? colors.textMuted
      : coolantTemp.value > 96
      ? colors.danger
      : coolantTemp.value > 84
      ? colors.warning
      : colors.success;

  // Oil pressure in PSI: danger < 30 psi (manual alarm) | caution 30-40 | normal ≥ 40
  const oilPressurePsi = oilPressure ? oilPressure.value * BAR_TO_PSI : null;
  const oilPressureColor =
    oilPressurePsi === null
      ? colors.textMuted
      : oilPressurePsi < OIL_P_DANGER_PSI
      ? colors.danger
      : oilPressurePsi < OIL_P_WARN_PSI
      ? colors.warning
      : colors.success;

  // Oil temp: normal 80-93°C | warning 107°C
  const oilTempColor =
    oilTemp === null
      ? colors.textMuted
      : oilTemp.value > 107
      ? colors.danger
      : oilTemp.value > 93
      ? colors.warning
      : colors.success;

  const altVoltColor =
    alternatorVoltage === null
      ? colors.textMuted
      : voltageColor(alternatorVoltage.value, colors);

  const batVoltColor =
    batteryVoltage === null
      ? colors.textMuted
      : voltageColor(batteryVoltage.value, colors);

  const hoursColor = colors.text;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
        <View style={[styles.headerAccent, {backgroundColor: colors.accent}]} />
        <Text style={[styles.headerTitle, {color: colors.accent}]}>FORD LEHMAN SP135</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onLayout={e => setChartWidth(e.nativeEvent.layout.width - 24)}>

        {/* RPM section */}
        <RpmSection rpm={rpm} colors={colors} />

        {/* 2-column grid */}
        <View style={styles.grid}>
          <ValueCell
            label="COOLANT TEMP"
            stamped={coolantTemp}
            unit="°C"
            valueColor={coolantColor}
            formatValue={v => v.toFixed(1)}
            colors={colors}
          />
          <ValueCell
            label="OIL PRESSURE"
            stamped={oilPressure}
            unit="psi"
            valueColor={oilPressureColor}
            formatValue={v => (v * BAR_TO_PSI).toFixed(1)}
            colors={colors}
          />
          <ValueCell
            label="OIL TEMP"
            stamped={oilTemp}
            unit="°C"
            valueColor={oilTempColor}
            formatValue={v => v.toFixed(1)}
            colors={colors}
          />
          <ValueCell
            label="ALTERNATOR"
            stamped={alternatorVoltage}
            unit="V"
            valueColor={altVoltColor}
            formatValue={v => v.toFixed(1)}
            colors={colors}
          />
          <FuelCell fuelLevel={fuelLevel} colors={colors} />
          <ValueCell
            label="BATTERY"
            stamped={batteryVoltage}
            unit="V"
            valueColor={batVoltColor}
            formatValue={v => v.toFixed(1)}
            colors={colors}
          />
          <ValueCell
            label="ENGINE HOURS"
            stamped={engineHours}
            unit="h"
            valueColor={hoursColor}
            formatValue={v => v.toFixed(1)}
            colors={colors}
          />
        </View>

        {/* Oil pressure vs RPM chart */}
        <OilVsRpmChart points={chartPoints} width={chartWidth} colors={colors} />

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},

  header: {
    borderBottomWidth: 1,
  },
  headerAccent: {
    height: 3,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  scroll: {flex: 1},
  scrollContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },

  // ─── RPM ────────────────────────────────────────────────────────────────────
  rpmSection: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  rpmLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  rpmValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  rpmValue: {
    fontSize: 72,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 76,
  },
  rpmUnit: {
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 8,
    marginBottom: 10,
  },
  rpmBarTrack: {
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rpmBarFill: {
    height: '100%',
    borderRadius: 7,
  },
  rpmScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  rpmTick: {
    fontSize: 10,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },

  // ─── Grid ───────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cell: {
    width: '47.5%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    elevation: 2,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cellValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  cellValue: {
    fontSize: 38,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 42,
  },
  cellUnit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginBottom: 4,
  },

  // ─── Chart card ─────────────────────────────────────────────────────────────
  chartCard: {
    borderRadius: 12,
    padding: 12,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  // ─── Fuel bar inside cell ────────────────────────────────────────────────────
  fuelBarTrack: {
    height: 6,
    borderRadius: 3,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  fuelBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
