/**
 * WindHistoryChart — time-series wind speed + direction history.
 *
 * Layout:
 *   - Period tabs: 1h / 3h / 6h / 12h / 24h
 *   - AVG speed  |  MAX GUST readout
 *   - SVG chart:
 *       · Background speed area (apparent or true colour)
 *       · Gust area overlay (warning orange, semi-transparent)
 *       · Mean speed line
 *       · Max-gust dashed horizontal line
 *       · Gust-peak markers (orange ▲) at local maxima
 *       · Direction arrows (green=stbd ≤60°, red=port ≤60°, grey=>60°) rotated to show bow-relative angle
 *       · Y-axis labels (knots) + time labels
 */
import React, {memo, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Svg, {
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {WindRecord} from '../store/slices/windHistory.slice';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = '1h' | '3h' | '6h' | '12h' | '24h';

const PERIOD_MS: Record<Period, number> = {
  '1h':   3_600_000,
  '3h':  10_800_000,
  '6h':  21_600_000,
  '12h': 43_200_000,
  '24h': 86_400_000,
};

// ── SVG layout constants ──────────────────────────────────────────────────────

const VB_W = 400;
const VB_H = 160;
const PAD = {l: 34, r: 8, t: 6, b: 18};
const SPEED_H = 100;  // height of the speed plot area
const GAP = 6;        // gap between speed area and direction strip
const DIR_H = 22;     // height of direction strip
const DIR_Y = PAD.t + SPEED_H + GAP;
const PLOT_W = VB_W - PAD.l - PAD.r;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSpeed(r: WindRecord, mode: 'apparent' | 'true'): number {
  return mode === 'apparent' ? r.aSpeed : (r.tSpeed ?? 0);
}
function getGust(r: WindRecord, mode: 'apparent' | 'true'): number {
  return mode === 'apparent' ? r.aGust : (r.tGust ?? 0);
}
function getAngle(r: WindRecord, mode: 'apparent' | 'true'): number {
  return mode === 'apparent' ? r.aAngle : (r.tAngle ?? r.aAngle);
}

// ── Period tab strip ──────────────────────────────────────────────────────────

function PeriodTabs({
  period,
  setPeriod,
  colors,
}: {
  period: Period;
  setPeriod: (p: Period) => void;
  colors: any;
}) {
  return (
    <View style={styles.periodRow}>
      {(['1h', '3h', '6h', '12h', '24h'] as Period[]).map(p => (
        <TouchableOpacity
          key={p}
          style={[
            styles.periodBtn,
            period === p && {backgroundColor: colors.accent},
          ]}
          onPress={() => setPeriod(p)}>
          <Text
            style={[
              styles.periodTxt,
              {color: period === p ? colors.background : colors.textMuted},
            ]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main chart component ──────────────────────────────────────────────────────

function WindHistoryChartInner({
  windMode,
  width,
}: {
  windMode: 'apparent' | 'true';
  width: number;
}) {
  const {colors} = useTheme();
  const [period, setPeriod] = useState<Period>('6h');
  const windHistory = useBoatStore(s => s.windHistory);

  const accentColor =
    windMode === 'apparent' ? colors.windApparent : colors.windTrue;

  // ── Derived data ────────────────────────────────────────────────────────────
  const {records, avgSpeed, maxGust, maxY} = useMemo(() => {
    const cutoff = Date.now() - PERIOD_MS[period];
    const recs = windHistory.filter(r => r.t >= cutoff);

    const speeds = recs.map(r => getSpeed(r, windMode));
    const gusts = recs.map(r => getGust(r, windMode));

    const avg =
      speeds.length > 0
        ? speeds.reduce((a, b) => a + b, 0) / speeds.length
        : 0;
    const maxG = gusts.length > 0 ? Math.max(...gusts) : 0;
    const ceil = Math.max(maxG * 1.2, 5);

    return {records: recs, avgSpeed: avg, maxGust: maxG, maxY: ceil};
  }, [windHistory, period, windMode]);

  // ── Scale helpers ───────────────────────────────────────────────────────────
  const n = records.length;
  const xOf = (i: number) =>
    PAD.l + (n > 1 ? (i / (n - 1)) * PLOT_W : PLOT_W / 2);
  const yOf = (v: number) =>
    PAD.t + SPEED_H - (v / maxY) * SPEED_H;

  // ── Build SVG area paths ────────────────────────────────────────────────────
  const buildArea = (valueFn: (r: WindRecord) => number): string => {
    if (n < 2) {return '';}
    const base = (PAD.t + SPEED_H).toFixed(1);
    const pts = records
      .map((r, i) => `${xOf(i).toFixed(1)},${yOf(valueFn(r)).toFixed(1)}`)
      .join(' L ');
    return `M ${xOf(0).toFixed(1)},${base} L ${pts} L ${xOf(n - 1).toFixed(1)},${base} Z`;
  };

  const gustArea = buildArea(r => getGust(r, windMode));
  const speedArea = buildArea(r => getSpeed(r, windMode));

  const speedLine =
    n > 1
      ? records
          .map(
            (r, i) =>
              `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)},${yOf(
                getSpeed(r, windMode),
              ).toFixed(1)}`,
          )
          .join(' ')
      : '';

  const maxGustY = yOf(maxGust);
  const svgH = (VB_H * width) / VB_W;

  // Y-axis tick values
  const yTicks = [0, Math.round(maxY / 2), Math.round(maxY)];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, {borderTopColor: colors.border}]}>
      {/* Period tabs */}
      <PeriodTabs period={period} setPeriod={setPeriod} colors={colors} />

      {/* AVG / MAX GUST readout */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>
            AVG
          </Text>
          <Text style={[styles.statValue, {color: accentColor}]}>
            {avgSpeed.toFixed(1)}
            <Text style={styles.statUnit}> kn</Text>
          </Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={[styles.statLabel, {color: colors.textMuted}]}>
            MAX GUST
          </Text>
          <Text style={[styles.statValue, {color: colors.warning}]}>
            {maxGust.toFixed(1)}
            <Text style={styles.statUnit}> kn</Text>
          </Text>
        </View>
      </View>

      {/* SVG chart */}
      {n === 0 ? (
        <View style={[styles.emptyBox, {height: svgH}]}>
          <Text style={[styles.emptyText, {color: colors.textMuted}]}>
            No data yet — recording starts automatically
          </Text>
        </View>
      ) : (
        <Svg
          width={width}
          height={svgH}
          viewBox={`0 0 ${VB_W} ${VB_H}`}>

          {/* Speed plot background */}
          <Rect
            x={PAD.l}
            y={PAD.t}
            width={PLOT_W}
            height={SPEED_H}
            fill={colors.surfaceElevated}
            rx={2}
          />

          {/* Gust area (orange, semi-transparent, behind speed area) */}
          {gustArea ? (
            <Path d={gustArea} fill={colors.warning} opacity={0.2} />
          ) : null}

          {/* Mean speed area */}
          {speedArea ? (
            <Path d={speedArea} fill={accentColor} opacity={0.40} />
          ) : null}

          {/* Mean speed line */}
          {speedLine ? (
            <Path
              d={speedLine}
              stroke={accentColor}
              strokeWidth={1.5}
              fill="none"
            />
          ) : null}

          {/* Max-gust dashed horizontal line */}
          {maxGust > 0 && (
            <>
              <Line
                x1={PAD.l}
                y1={maxGustY}
                x2={VB_W - PAD.r}
                y2={maxGustY}
                stroke={colors.warning}
                strokeWidth={0.8}
                strokeDasharray="4,3"
              />
              <SvgText
                x={PAD.l + 2}
                y={maxGustY - 2}
                fill={colors.warning}
                fontSize="7"
                fontWeight="600">
                {`MAX ${maxGust.toFixed(1)}`}
              </SvgText>
            </>
          )}


          {/* Y-axis labels */}
          {yTicks.map(v => (
            <SvgText
              key={v}
              x={PAD.l - 3}
              y={yOf(v) + 3}
              textAnchor="end"
              fill={colors.textMuted}
              fontSize="8">
              {v}
            </SvgText>
          ))}

          {/* Y-axis unit */}
          <SvgText
            x={PAD.l - 3}
            y={PAD.t - 1}
            textAnchor="end"
            fill={colors.textMuted}
            fontSize="7">
            kn
          </SvgText>

          {/* Direction strip background */}
          <Rect
            x={PAD.l}
            y={DIR_Y}
            width={PLOT_W}
            height={DIR_H}
            fill={colors.surfaceElevated}
            rx={2}
          />

          {/* Direction arrows — subsampled to ~24 visible regardless of record count */}
          {(() => {
            const step = Math.max(1, Math.ceil(n / (PLOT_W / 15)));
            const cy = DIR_Y + DIR_H / 2;
            return records.reduce<React.ReactElement[]>((acc, r, i) => {
              if (i % step !== 0) {return acc;}
              const ang = getAngle(r, windMode);
              const isPort = ang < 0;
              const isHigh = Math.abs(ang) > 60;
              const arrowColor = isHigh
                ? colors.textMuted
                : isPort
                ? colors.danger
                : colors.success;
              const cx = xOf(i);
              acc.push(
                <G key={i} rotation={ang} origin={`${cx},${cy}`}>
                  <Polygon
                    points={`${cx},${cy - 8} ${cx - 5},${cy + 4} ${cx + 5},${cy + 4}`}
                    fill={arrowColor}
                    opacity={0.9}
                  />
                </G>,
              );
              return acc;
            }, []);
          })()}

          {/* Time labels */}
          <SvgText
            x={PAD.l}
            y={VB_H - 2}
            textAnchor="start"
            fill={colors.textMuted}
            fontSize="8">
            {`-${period}`}
          </SvgText>
          <SvgText
            x={VB_W - PAD.r}
            y={VB_H - 2}
            textAnchor="end"
            fill={colors.textMuted}
            fontSize="8">
            now
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  periodTxt: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  statBlock: {alignItems: 'center'},
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export const WindHistoryChart = memo(WindHistoryChartInner);
