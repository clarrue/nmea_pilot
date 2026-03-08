/**
 * PressureHistoryChart — 24h barometric pressure trend.
 *
 * Layout:
 *   - Period tabs: 3h / 6h / 12h / 24h
 *   - MIN / MAX readout
 *   - SVG line chart with hPa Y-axis and time labels
 */
import React, {memo, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {Line, Path, Rect, Text as SvgText} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {PressureRecord} from '../store/slices/pressureHistory.slice';

type Period = '3h' | '6h' | '12h' | '24h';

const PERIOD_MS: Record<Period, number> = {
  '3h':  10_800_000,
  '6h':  21_600_000,
  '12h': 43_200_000,
  '24h': 86_400_000,
};

const VB_W = 400;
const VB_H = 130;
const PAD = {l: 38, r: 8, t: 6, b: 18};
const PLOT_H = VB_H - PAD.t - PAD.b;
const PLOT_W = VB_W - PAD.l - PAD.r;

function PeriodTabs({period, setPeriod, colors}: {period: Period; setPeriod: (p: Period) => void; colors: any}) {
  return (
    <View style={styles.periodRow}>
      {(['3h', '6h', '12h', '24h'] as Period[]).map(p => (
        <TouchableOpacity
          key={p}
          style={[styles.periodBtn, period === p && {backgroundColor: colors.accent}]}
          onPress={() => setPeriod(p)}>
          <Text style={[styles.periodTxt, {color: period === p ? colors.background : colors.textMuted}]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PressureHistoryChartInner({width}: {width: number}) {
  const {colors} = useTheme();
  const [period, setPeriod] = useState<Period>('6h');
  const pressureHistory = useBoatStore(s => s.pressureHistory);

  const {records, minHPa, maxHPa, yMin, yMax} = useMemo(() => {
    const cutoff = Date.now() - PERIOD_MS[period];
    const recs = pressureHistory.filter((r: PressureRecord) => r.t >= cutoff);
    if (recs.length === 0) {
      return {records: recs, minHPa: null, maxHPa: null, yMin: 990, yMax: 1030};
    }
    const values = recs.map((r: PressureRecord) => r.hPa);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Give 2 hPa padding, rounded to nearest hPa
    const pad = Math.max(2, (max - min) * 0.1);
    return {
      records: recs,
      minHPa: min,
      maxHPa: max,
      yMin: Math.floor(min - pad),
      yMax: Math.ceil(max + pad),
    };
  }, [pressureHistory, period]);

  const n = records.length;
  const range = yMax - yMin;
  const xOf = (i: number) => PAD.l + (n > 1 ? (i / (n - 1)) * PLOT_W : PLOT_W / 2);
  const yOf = (v: number) => PAD.t + PLOT_H - ((v - yMin) / range) * PLOT_H;

  const linePath = n > 1
    ? records.map((r: PressureRecord, i: number) =>
        `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(r.hPa).toFixed(1)}`
      ).join(' ')
    : '';

  const areaPath = n > 1
    ? `M ${xOf(0).toFixed(1)},${(PAD.t + PLOT_H).toFixed(1)} L ${
        records.map((r: PressureRecord, i: number) => `${xOf(i).toFixed(1)},${yOf(r.hPa).toFixed(1)}`).join(' L ')
      } L ${xOf(n - 1).toFixed(1)},${(PAD.t + PLOT_H).toFixed(1)} Z`
    : '';

  const svgH = (VB_H * width) / VB_W;
  const yTicks = [yMin, Math.round((yMin + yMax) / 2), yMax];

  return (
    <View style={[styles.container, {borderTopColor: colors.border}]}>
      <PeriodTabs period={period} setPeriod={setPeriod} colors={colors} />

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>MIN</Text>
          <Text style={[styles.statValue, {color: colors.text}]}>
            {minHPa !== null ? minHPa.toFixed(1) : '---'}
            <Text style={styles.statUnit}> hPa</Text>
          </Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>MAX</Text>
          <Text style={[styles.statValue, {color: colors.text}]}>
            {maxHPa !== null ? maxHPa.toFixed(1) : '---'}
            <Text style={styles.statUnit}> hPa</Text>
          </Text>
        </View>
      </View>

      {n === 0 ? (
        <View style={[styles.emptyBox, {height: svgH}]}>
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            No data yet — recording starts automatically
          </Text>
        </View>
      ) : (
        <Svg width={width} height={svgH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          {/* Plot background */}
          <Rect x={PAD.l} y={PAD.t} width={PLOT_W} height={PLOT_H} fill={colors.surfaceElevated} rx={2} />

          {/* Area fill */}
          {areaPath ? <Path d={areaPath} fill={colors.accent} opacity={0.2} /> : null}

          {/* Line */}
          {linePath ? <Path d={linePath} stroke={colors.accent} strokeWidth={1.5} fill="none" /> : null}

          {/* Y-axis labels */}
          {yTicks.map(v => (
            <SvgText key={v} x={PAD.l - 3} y={yOf(v) + 3} textAnchor="end" fill={colors.textMuted} fontSize="8">
              {v}
            </SvgText>
          ))}

          {/* Y-axis unit */}
          <SvgText x={PAD.l - 3} y={PAD.t - 1} textAnchor="end" fill={colors.textMuted} fontSize="7">
            hPa
          </SvgText>

          {/* Horizontal grid lines */}
          {yTicks.map(v => (
            <Line
              key={`g${v}`}
              x1={PAD.l} y1={yOf(v)} x2={VB_W - PAD.r} y2={yOf(v)}
              stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,3"
            />
          ))}

          {/* Time labels */}
          <SvgText x={PAD.l} y={VB_H - 2} textAnchor="start" fill={colors.textMuted} fontSize="8">
            {`-${period}`}
          </SvgText>
          <SvgText x={VB_W - PAD.r} y={VB_H - 2} textAnchor="end" fill={colors.textMuted} fontSize="8">
            now
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {borderTopWidth: 1, paddingTop: 2},
  periodRow: {flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 6},
  periodBtn: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10},
  periodTxt: {fontSize: 11, fontWeight: '700', letterSpacing: 0.5},
  statsRow: {flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 4},
  statBlock: {alignItems: 'center'},
  statLabel: {fontSize: 10, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase'},
  statValue: {fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums']},
  statUnit: {fontSize: 13, fontWeight: '500'},
  emptyBox: {justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: 12, textAlign: 'center', paddingHorizontal: 16},
});

export const PressureHistoryChart = memo(PressureHistoryChartInner);
