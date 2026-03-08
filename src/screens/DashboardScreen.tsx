import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WindRose} from '../components/WindRose';
import {CompassRose} from '../components/CompassRose';
import {RudderIndicator} from '../components/RudderIndicator';
import {ConnectionStatus} from '../components/ConnectionStatus';
import {PressureHistoryChart} from '../components/PressureHistoryChart';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({title, accent, colors}: {title: string; accent: string; colors: any}) {
  return (
    <View>
      <View style={[styles.panelAccentBar, {backgroundColor: accent}]} />
      <View style={[styles.panelHeader, {borderBottomColor: colors.border}]}>
        <Text style={[styles.panelTitle, {color: accent}]}>{title}</Text>
      </View>
    </View>
  );
}

// ─── Shared: big value block ──────────────────────────────────────────────────

function BigValue({
  label,
  value,
  unit,
  color,
  valueSize = 56,
  colors,
}: {
  label: string;
  value: string | null;
  unit?: string;
  color?: string;
  valueSize?: number;
  colors: any;
}) {
  return (
    <View style={styles.bigValueBlock}>
      <Text style={[styles.bigValueLabel, {color: colors.textSecondary}]}>{label}</Text>
      <View style={styles.bigValueRow}>
        <Text
          style={[styles.bigValueNum, {color: color ?? colors.text, fontSize: valueSize}]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {value ?? '---'}
        </Text>
        {unit ? (
          <Text style={[styles.bigValueUnit, {color: colors.textMuted, fontSize: valueSize * 0.35}]}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Autopilot panel ─────────────────────────────────────────────────────────

function AutopilotPanel({colors, rudderSize, compact = false}: {
  colors: any;
  rudderSize: number;
  compact?: boolean;
}) {
  const apEnabled = useBoatStore(s => s.apEnabled);
  const apMode = useBoatStore(s => s.apMode);
  const apHeadingCmd = useBoatStore(s => s.apHeadingCmd);
  const rudderAngle = useBoatStore(s => s.rudderAngle);
  const imu = useBoatStore(s => s.imu);

  const targetHdg = apHeadingCmd !== null
    ? String(Math.round(apHeadingCmd) % 360).padStart(3, '0') + '°'
    : null;

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface}]}>
      <PanelHeader title="AUTOPILOT" accent={colors.accent} colors={colors} />

      {/* Status pill badge */}
      <View style={[
        styles.apStatusBadge,
        {
          backgroundColor: apEnabled ? colors.success + '22' : colors.surfaceElevated,
          borderColor: apEnabled ? colors.success : colors.border,
        },
      ]}>
        <View style={[styles.apDot, {backgroundColor: apEnabled ? colors.success : colors.textMuted}]} />
        <Text style={[styles.apStatusText, {color: apEnabled ? colors.success : colors.textMuted}]}>
          {apEnabled ? 'ENGAGED' : 'STANDBY'}
        </Text>
      </View>

      <Text style={[styles.apMode, {color: colors.textSecondary}]}>
        {apMode ? apMode.toUpperCase() : '---'}
      </Text>

      <BigValue
        label="TARGET HDG"
        value={targetHdg}
        color={colors.accent}
        valueSize={compact ? 44 : 60}
        colors={colors}
      />

      <View style={styles.centeredBlock}>
        <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>RUDDER</Text>
        <RudderIndicator angle={rudderAngle ?? 0} size={rudderSize} />
      </View>

      {!compact && imu && (
        <View style={styles.imuRow}>
          <View style={styles.imuCell}>
            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>PITCH</Text>
            <Text style={[styles.imuValue, {color: colors.text}]}>{imu.pitch.toFixed(1)}°</Text>
          </View>
          <View style={styles.imuCell}>
            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>ROLL</Text>
            <Text style={[styles.imuValue, {color: colors.text}]}>{imu.roll.toFixed(1)}°</Text>
          </View>
          <View style={styles.imuCell}>
            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>HEEL</Text>
            <Text style={[styles.imuValue, {color: colors.text}]}>{imu.heel.toFixed(1)}°</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Wind panel ───────────────────────────────────────────────────────────────

function WindPanel({colors, roseSize}: {colors: any; roseSize: number}) {
  const windApparent = useBoatStore(s => s.windApparent);
  const windTrue = useBoatStore(s => s.windTrue);
  const windHistory = useBoatStore(s => s.windHistory);
  const [windMode, setWindMode] = useState<'apparent' | 'true'>('apparent');

  const activeWind = windMode === 'apparent' ? windApparent : windTrue;
  const accentColor = windMode === 'apparent' ? colors.windApparent : colors.windTrue;

  const {avgSpeed, maxGust} = useMemo(() => {
    const cutoff = Date.now() - 3_600_000;
    const recs = windHistory.filter(r => r.t >= cutoff);
    if (recs.length === 0) {return {avgSpeed: null, maxGust: null};}
    const speeds = recs.map(r => windMode === 'apparent' ? r.aSpeed : (r.tSpeed ?? 0));
    const gusts  = recs.map(r => windMode === 'apparent' ? r.aGust  : (r.tGust  ?? 0));
    return {
      avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
      maxGust: Math.max(...gusts),
    };
  }, [windHistory, windMode]);

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface}]}>
      <PanelHeader title="WIND" accent={colors.windApparent} colors={colors} />

      <View style={styles.centeredBlock}>
        <WindRose
          angle={activeWind?.value.angle}
          speed={activeWind?.value.speed}
          size={roseSize}
        />
      </View>

      <View style={styles.windToggleRow}>
        <TouchableOpacity
          style={[styles.windToggleBtn, windMode === 'apparent' && {backgroundColor: colors.windApparent}]}
          onPress={() => setWindMode('apparent')}>
          <Text style={[styles.windToggleTxt, {color: windMode === 'apparent' ? colors.background : colors.textMuted}]}>
            AWA
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.windToggleBtn, windMode === 'true' && {backgroundColor: colors.windTrue}]}
          onPress={() => setWindMode('true')}>
          <Text style={[styles.windToggleTxt, {color: windMode === 'true' ? colors.background : colors.textMuted}]}>
            TWA
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.windStatsRow, {borderTopColor: colors.border}]}>
        <View style={styles.windStatBlock}>
          <Text style={[styles.windStatLabel, {color: colors.textMuted}]}>AVG 1H</Text>
          <Text style={[styles.windStatValue, {color: accentColor}]}>
            {avgSpeed !== null ? avgSpeed.toFixed(1) : '---'}
            <Text style={[styles.windStatUnit, {color: colors.textMuted}]}> kn</Text>
          </Text>
        </View>
        <View style={[styles.windStatDivider, {backgroundColor: colors.border}]} />
        <View style={styles.windStatBlock}>
          <Text style={[styles.windStatLabel, {color: colors.textMuted}]}>GUST</Text>
          <Text style={[styles.windStatValue, {color: colors.warning}]}>
            {maxGust !== null ? maxGust.toFixed(1) : '---'}
            <Text style={[styles.windStatUnit, {color: colors.textMuted}]}> kn</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Navigation panel ─────────────────────────────────────────────────────────

function NavigationPanel({colors, compassSize, speedUnit}: {
  colors: any;
  compassSize: number;
  speedUnit: string;
}) {
  const headingTrue = useBoatStore(s => s.headingTrue);
  const waterSpeed = useBoatStore(s => s.waterSpeed);
  const gps = useBoatStore(s => s.gps);

  const speedDisplay = useMemo(() => {
    if (!waterSpeed) {return null;}
    switch (speedUnit) {
      case 'kmh': return (waterSpeed.value * 1.852).toFixed(1);
      case 'mph': return (waterSpeed.value * 1.15078).toFixed(1);
      default: return waterSpeed.value.toFixed(1);
    }
  }, [waterSpeed, speedUnit]);
  const speedUnitLabel = speedUnit === 'kmh' ? 'km/h' : speedUnit;

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface}]}>
      <PanelHeader title="NAVIGATION" accent={colors.success} colors={colors} />

      <View style={styles.centeredBlock}>
        <CompassRose heading={headingTrue?.value ?? 0} size={compassSize} />
      </View>

      <View style={styles.navRow}>
        <BigValue
          label="HDG"
          value={headingTrue ? String(Math.round(headingTrue.value)).padStart(3, '0') + '°' : null}
          color={colors.text}
          valueSize={48}
          colors={colors}
        />
        <BigValue
          label="COG"
          value={gps ? String(Math.round(gps.value.cog)).padStart(3, '0') + '°' : null}
          color={colors.textSecondary}
          valueSize={48}
          colors={colors}
        />
      </View>

      <View style={styles.navRow}>
        <BigValue
          label="STW"
          value={speedDisplay}
          unit={speedUnitLabel}
          color={colors.accent}
          valueSize={48}
          colors={colors}
        />
        <BigValue
          label="SOG"
          value={gps ? gps.value.sog.toFixed(1) : null}
          unit="kn"
          color={colors.accent}
          valueSize={48}
          colors={colors}
        />
      </View>
    </View>
  );
}

// ─── Depth panel ──────────────────────────────────────────────────────────────

function DepthPanel({colors, depthUnit}: {colors: any; depthUnit: string}) {
  const depth = useBoatStore(s => s.depth);

  const depthDisplay = useMemo(() => {
    if (!depth) {return null;}
    const v = depth.value;
    switch (depthUnit) {
      case 'ft': return (v * 3.28084).toFixed(1);
      case 'fathoms': return (v * 0.546807).toFixed(1);
      default: return v.toFixed(1);
    }
  }, [depth, depthUnit]);
  const depthUnitLabel = depthUnit === 'fathoms' ? 'fm' : depthUnit;

  const depthColor = useMemo(() => {
    if (!depth) {return colors.text;}
    if (depth.value < 3) {return colors.danger;}
    if (depth.value < 10) {return colors.warning;}
    return colors.text;
  }, [depth, colors]);

  const alertBorder = useMemo(() => {
    if (!depth) {return 'transparent';}
    if (depth.value < 3) {return colors.danger;}
    if (depth.value < 10) {return colors.warning;}
    return 'transparent';
  }, [depth, colors]);

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface, borderWidth: 2, borderColor: alertBorder}]}>
      <PanelHeader title="DEPTH" accent={colors.warning} colors={colors} />
      <View style={styles.depthContent}>
        {depthDisplay ? (
          <View style={styles.depthValueRow}>
            <Text style={[styles.depthValue, {color: depthColor}]} numberOfLines={1} adjustsFontSizeToFit>
              {depthDisplay.split('.')[0]}
            </Text>
            <Text style={[styles.depthDecimal, {color: depthColor}]}>
              {'.' + depthDisplay.split('.')[1]}
            </Text>
          </View>
        ) : (
          <Text style={[styles.depthValue, {color: depthColor}]}>---</Text>
        )}
        <Text style={[styles.depthUnit, {color: colors.textMuted}]}>
          {depthUnitLabel}
        </Text>
      </View>
    </View>
  );
}

// ─── Pressure panel ───────────────────────────────────────────────────────────

function PressurePanel({colors, width}: {colors: any; width: number}) {
  const pressure = useBoatStore(s => s.pressure);
  const pressureHistory = useBoatStore(s => s.pressureHistory);

  // Trend: compare last record vs record from ~3h ago (hPa/h)
  const trend = useMemo(() => {
    if (pressureHistory.length < 2) {return null;}
    const now = pressureHistory[pressureHistory.length - 1];
    const cutoff = now.t - 3 * 3_600_000;
    const old = pressureHistory.find(r => r.t >= cutoff) ?? pressureHistory[0];
    const deltahPa = now.hPa - old.hPa;
    const deltaH = (now.t - old.t) / 3_600_000;
    if (deltaH < 0.1) {return null;}
    return deltahPa / deltaH; // hPa/h
  }, [pressureHistory]);

  const trendLabel = trend === null ? null
    : trend > 1.5  ? '↑↑ Rising fast'
    : trend > 0.5  ? '↑ Rising'
    : trend < -1.5 ? '↓↓ Falling fast'
    : trend < -0.5 ? '↓ Falling'
    : '→ Steady';

  const trendColor = trend === null ? colors.textMuted
    : Math.abs(trend) > 1.5 ? colors.warning
    : colors.textSecondary;

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface}]}>
      <PanelHeader title="PRESSURE" accent={colors.accent} colors={colors} />
      <View style={styles.pressureContent}>
        <View style={styles.pressureValueRow}>
          <Text style={[styles.pressureValue, {color: colors.text}]} numberOfLines={1} adjustsFontSizeToFit>
            {pressure ? pressure.value.toFixed(0) : '---'}
          </Text>
          <Text style={[styles.pressureUnit, {color: colors.textMuted}]}>hPa</Text>
        </View>
        {trendLabel && (
          <Text style={[styles.pressureTrend, {color: trendColor}]}>{trendLabel}</Text>
        )}
      </View>
      <PressureHistoryChart width={width} />
    </View>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function DashboardScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();

  const nmeaStatus = useBoatStore(s => s.nmeaStatus);
  const pypilotStatus = useBoatStore(s => s.pypilotStatus);
  const depthUnit = useBoatStore(s => s.settings.depthUnit);
  const speedUnit = useBoatStore(s => s.settings.speedUnit);
  const visiblePanels = useBoatStore(s => s.settings.visiblePanels);

  const cellW = Math.floor(width / 2);

  // Compute row count first so sizes adapt to available height per row
  const panelCount = [visiblePanels.wind, visiblePanels.navigation, visiblePanels.autopilot, visiblePanels.depth, visiblePanels.pressure].filter(Boolean).length;
  const rowCount = Math.max(1, Math.ceil(panelCount / 2));
  const cellH = Math.floor((height - 60) / rowCount); // 60 ≈ status bar

  // Leave room for panel header + labels + stats below the graphic
  const roseSize = Math.min(cellW - 24, Math.floor(cellH * 0.55), 400);
  const compassSize = Math.min(cellW - 28, Math.floor(cellH * 0.45), 350);
  const rudderSize = Math.min(cellW - 24, Math.floor(cellH * 0.50), 300);

  // Build ordered list of visible panel elements
  const panels: React.ReactElement[] = [];
  if (visiblePanels.wind) {
    panels.push(<WindPanel key="wind" colors={colors} roseSize={roseSize} />);
  }
  if (visiblePanels.navigation) {
    panels.push(<NavigationPanel key="navigation" colors={colors} compassSize={compassSize} speedUnit={speedUnit} />);
  }
  if (visiblePanels.autopilot) {
    panels.push(<AutopilotPanel key="autopilot" colors={colors} rudderSize={rudderSize} compact />);
  }
  if (visiblePanels.depth) {
    panels.push(<DepthPanel key="depth" colors={colors} depthUnit={depthUnit} />);
  }
  if (visiblePanels.pressure) {
    panels.push(<PressurePanel key="pressure" colors={colors} width={cellW - 8} />);
  }

  // Group into rows of 2
  const rows: React.ReactElement[][] = [];
  for (let i = 0; i < panels.length; i += 2) {
    rows.push(panels.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Status bar */}
      <View style={[styles.statusBar, {borderBottomColor: colors.border, backgroundColor: colors.surface}]}>
        <ConnectionStatus label="NMEA" status={nmeaStatus} />
        <ConnectionStatus label="Pypilot" status={pypilotStatus} />
      </View>

      <View style={styles.portraitGrid}>
        {rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, {color: colors.textMuted}]}>
              No panels selected.{'\n'}Enable panels in Settings.
            </Text>
          </View>
        ) : (
          rows.map((row, i) => (
            <View key={i} style={styles.gridRow}>
              {row}
            </View>
          ))
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},

  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
  },

  portraitGrid: {
    flex: 1,
    padding: 4,
    gap: 4,
  },
  // Pressure
  pressureContent: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pressureValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pressureValue: {
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  pressureUnit: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 6,
  },
  pressureTrend: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },

  // Panel card
  panel: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  panelAccentBar: {
    height: 3,
  },
  panelHeader: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },

  centeredBlock: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
  },

  // BigValue
  bigValueBlock: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  bigValueLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bigValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bigValueNum: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  bigValueUnit: {
    fontWeight: '600',
    marginLeft: 3,
    marginBottom: 5,
  },

  // Autopilot
  apStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    alignSelf: 'center',
  },
  apDot: {width: 10, height: 10, borderRadius: 5},
  apStatusText: {fontSize: 16, fontWeight: '700', letterSpacing: 1.5},
  apMode: {fontSize: 13, textAlign: 'center', marginBottom: 2, fontWeight: '500', letterSpacing: 1},

  imuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  imuCell: {alignItems: 'center'},
  imuValue: {fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums']},

  // Wind toggle
  windToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  windToggleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 14,
  },
  windToggleTxt: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Wind stats
  windStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  windStatBlock: {
    flex: 1,
    alignItems: 'center',
  },
  windStatDivider: {
    width: 1,
    marginVertical: 4,
  },
  windStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  windStatValue: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  windStatUnit: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },

  // Depth
  depthContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  depthValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  depthValue: {
    fontSize: 96,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  depthDecimal: {
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  depthUnit: {
    fontSize: 26,
    fontWeight: '600',
    marginTop: -4,
    letterSpacing: 2,
  },
});
