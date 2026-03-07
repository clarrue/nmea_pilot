import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WindRose} from '../components/WindRose';
import {CompassRose} from '../components/CompassRose';
import {RudderIndicator} from '../components/RudderIndicator';
import {ConnectionStatus} from '../components/ConnectionStatus';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

// ─── Panel header ─────────────────────────────────────────────────────────────

function PanelHeader({title, colors}: {title: string; colors: any}) {
  return (
    <View style={[styles.panelHeader, {borderBottomColor: colors.border}]}>
      <Text style={[styles.panelTitle, {color: colors.accent}]}>{title}</Text>
    </View>
  );
}

// ─── Shared: big value block ──────────────────────────────────────────────────

function BigValue({
  label,
  value,
  unit,
  color,
  valueSize = 64,
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

function AutopilotPanel({colors, rudderSize}: {colors: any; rudderSize: number}) {
  const apEnabled = useBoatStore(s => s.apEnabled);
  const apMode = useBoatStore(s => s.apMode);
  const apHeadingCmd = useBoatStore(s => s.apHeadingCmd);
  const rudderAngle = useBoatStore(s => s.rudderAngle);
  const imu = useBoatStore(s => s.imu);

  const targetHdg = apHeadingCmd !== null
    ? String(Math.round(apHeadingCmd) % 360).padStart(3, '0') + '°'
    : null;

  return (
    <View style={[styles.panel, {backgroundColor: colors.surface, borderRightColor: colors.border}]}>
      <PanelHeader title="AUTOPILOT" colors={colors} />

      {/* Engaged / Standby */}
      <View style={styles.apStatusRow}>
        <View style={[styles.apDot, {backgroundColor: apEnabled ? colors.success : colors.textMuted}]} />
        <Text style={[styles.apStatusText, {color: apEnabled ? colors.success : colors.textMuted}]}>
          {apEnabled ? 'ENGAGED' : 'STANDBY'}
        </Text>
      </View>

      <Text style={[styles.apMode, {color: colors.textSecondary}]}>
        {apMode ? apMode.toUpperCase() : '---'}
      </Text>

      {/* Target heading */}
      <BigValue
        label="TARGET HDG"
        value={targetHdg}
        color={colors.accent}
        valueSize={72}
        colors={colors}
      />

      {/* Rudder — big arc gauge with built-in digital readout */}
      <View style={styles.centeredBlock}>
        <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>RUDDER</Text>
        <RudderIndicator angle={rudderAngle ?? 0} size={rudderSize} />
      </View>

      {/* IMU */}
      {imu && (
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

  // Compute last-1h AVG speed and MAX GUST from history
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
    <View style={[styles.panel, {backgroundColor: colors.surface, borderRightColor: colors.border}]}>
      <PanelHeader title="WIND" colors={colors} />

      <View style={styles.centeredBlock}>
        <WindRose
          angle={activeWind?.value.angle}
          speed={activeWind?.value.speed}
          size={roseSize}
        />
      </View>

      {/* APPARENT / TRUE toggle below the rose */}
      <View style={styles.windToggleRow}>
        <TouchableOpacity
          style={[
            styles.windToggleBtn,
            windMode === 'apparent' && {backgroundColor: colors.windApparent},
          ]}
          onPress={() => setWindMode('apparent')}>
          <Text style={[
            styles.windToggleTxt,
            {color: windMode === 'apparent' ? colors.background : colors.textMuted},
          ]}>
            APPARENT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.windToggleBtn,
            windMode === 'true' && {backgroundColor: colors.windTrue},
          ]}
          onPress={() => setWindMode('true')}>
          <Text style={[
            styles.windToggleTxt,
            {color: windMode === 'true' ? colors.background : colors.textMuted},
          ]}>
            TRUE
          </Text>
        </TouchableOpacity>
      </View>

      {/* AVG / MAX GUST compact stats */}
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
          <Text style={[styles.windStatLabel, {color: colors.textMuted}]}>MAX GUST</Text>
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
    <View style={[styles.panel, {backgroundColor: colors.surface, borderRightColor: colors.border}]}>
      <PanelHeader title="NAVIGATION" colors={colors} />

      <View style={styles.centeredBlock}>
        <CompassRose heading={headingTrue?.value ?? 0} size={compassSize} />
      </View>

      {/* Headings */}
      <View style={styles.navRow}>
        <BigValue
          label="HDG (T)"
          value={headingTrue ? String(Math.round(headingTrue.value)).padStart(3, '0') + '°' : null}
          color={colors.text}
          valueSize={56}
          colors={colors}
        />
        <BigValue
          label="COG"
          value={gps ? String(Math.round(gps.value.cog)).padStart(3, '0') + '°' : null}
          color={colors.textSecondary}
          valueSize={56}
          colors={colors}
        />
      </View>

      {/* Speed */}
      <View style={styles.navRow}>
        <BigValue
          label="STW"
          value={speedDisplay}
          unit={speedUnitLabel}
          color={colors.accent}
          valueSize={56}
          colors={colors}
        />
        <BigValue
          label="SOG"
          value={gps ? gps.value.sog.toFixed(1) : null}
          unit="kn"
          color={colors.accent}
          valueSize={56}
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

  // Simple shallow-water colour hint: <3m red, <10m amber, else white
  const depthColor = useMemo(() => {
    if (!depth) {return colors.text;}
    const m = depth.value;
    if (m < 3) {return colors.danger;}
    if (m < 10) {return colors.warning;}
    return colors.text;
  }, [depth, colors]);

  return (
    <View style={[styles.panel, styles.depthPanel, {backgroundColor: colors.surface}]}>
      <PanelHeader title="DEPTH" colors={colors} />

      <View style={styles.depthContent}>
        <Text style={[styles.depthValue, {color: depthColor}]} numberOfLines={1} adjustsFontSizeToFit>
          {depthDisplay ?? '---'}
        </Text>
        <Text style={[styles.depthUnit, {color: colors.textMuted}]}>
          {depthUnitLabel}
        </Text>
      </View>
    </View>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function DashboardScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  const nmeaStatus = useBoatStore(s => s.nmeaStatus);
  const pypilotStatus = useBoatStore(s => s.pypilotStatus);
  const depthUnit = useBoatStore(s => s.settings.depthUnit);
  const speedUnit = useBoatStore(s => s.settings.speedUnit);

  const panelWidth = isLandscape ? width / 4 : width;
  const roseSize = isLandscape
    ? Math.min(panelWidth - 32, height * 0.60)
    : Math.min(width * 0.85, 480);
  const compassSize = isLandscape
    ? Math.min(height * 0.34, 210)
    : Math.min(width * 0.55, 220);
  const rudderSize = isLandscape
    ? Math.min(panelWidth - 48, 220)
    : Math.min(width - 48, 300);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Status bar */}
      <View style={[styles.statusBar, {borderBottomColor: colors.border}]}>
        <ConnectionStatus label="NMEA" status={nmeaStatus} />
        <ConnectionStatus label="Pypilot" status={pypilotStatus} />
      </View>

      {isLandscape ? (
        <View style={styles.landscapeContent}>
          <AutopilotPanel colors={colors} rudderSize={rudderSize} />
          <WindPanel colors={colors} roseSize={roseSize} />
          <NavigationPanel colors={colors} compassSize={compassSize} speedUnit={speedUnit} />
          <DepthPanel colors={colors} depthUnit={depthUnit} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.portraitContent}>
          <AutopilotPanel colors={colors} rudderSize={rudderSize} />
          <WindPanel colors={colors} roseSize={roseSize} />
          <NavigationPanel colors={colors} compassSize={compassSize} speedUnit={speedUnit} />
          <DepthPanel colors={colors} depthUnit={depthUnit} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},

  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },

  landscapeContent: {flex: 1, flexDirection: 'row'},
  portraitContent: {gap: 0},

  // Panel
  panel: {
    flex: 1,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  depthPanel: {
    // No right border on last panel
    borderRightWidth: 0,
  },
  panelHeader: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2.5,
  },

  centeredBlock: {
    alignItems: 'center',
    paddingVertical: 6,
  },

  sectionLabel: {
    fontSize: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  bigValueLabel: {
    fontSize: 12,
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
    marginLeft: 4,
    marginBottom: 6,
  },

  // Autopilot
  apStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  apDot: {width: 14, height: 14, borderRadius: 7},
  apStatusText: {fontSize: 24, fontWeight: '700', letterSpacing: 1},
  apMode: {fontSize: 16, textAlign: 'center', marginBottom: 4, fontWeight: '500'},

  imuRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    marginTop: 10,
  },
  imuCell: {alignItems: 'center'},
  imuValue: {fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums']},

  // Wind toggle
  windPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  windToggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  windToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  windToggleTxt: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Wind quick stats
  windStatsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
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
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  windStatValue: {
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  windStatUnit: {
    fontSize: 14,
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
    paddingHorizontal: 16,
  },
  depthValue: {
    fontSize: 120,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  depthUnit: {
    fontSize: 32,
    fontWeight: '600',
    marginTop: -8,
    letterSpacing: 2,
  },
});
