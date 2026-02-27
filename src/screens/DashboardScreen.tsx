import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {InstrumentCard} from '../components/InstrumentCard';
import {WindRose} from '../components/WindRose';
import {CompassRose} from '../components/CompassRose';
import {RudderIndicator} from '../components/RudderIndicator';
import {ConnectionStatus} from '../components/ConnectionStatus';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {formatDepth, formatSpeed} from '../utils/unitConversions';

function APMini() {
  const {colors} = useTheme();
  const apEnabled = useBoatStore(s => s.apEnabled);
  const apMode = useBoatStore(s => s.apMode);
  const apHeadingCmd = useBoatStore(s => s.apHeadingCmd);

  return (
    <View style={[styles.apMini, {backgroundColor: colors.surface, borderColor: colors.border}]}>
      <Text style={[styles.apMiniLabel, {color: colors.textSecondary}]}>AUTOPILOT</Text>
      <View style={[styles.apMiniDot, {backgroundColor: apEnabled ? colors.success : colors.textMuted}]} />
      <Text style={[styles.apMiniStatus, {color: apEnabled ? colors.success : colors.textMuted}]}>
        {apEnabled ? 'ENGAGED' : 'STANDBY'}
      </Text>
      <Text style={[styles.apMiniMode, {color: colors.textSecondary}]}>
        {apMode.toUpperCase()}
      </Text>
      {apHeadingCmd !== null && (
        <Text style={[styles.apMiniCmd, {color: colors.accent}]}>
          {String(Math.round(apHeadingCmd) % 360).padStart(3, '0')}°
        </Text>
      )}
    </View>
  );
}

export function DashboardScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;

  // Store selectors
  const depth = useBoatStore(s => s.depth);
  const waterSpeed = useBoatStore(s => s.waterSpeed);
  const headingTrue = useBoatStore(s => s.headingTrue);
  const windApparent = useBoatStore(s => s.windApparent);
  const windTrue = useBoatStore(s => s.windTrue);
  const gps = useBoatStore(s => s.gps);
  const rudderAngle = useBoatStore(s => s.rudderAngle);
  const imu = useBoatStore(s => s.imu);
  const nmeaStatus = useBoatStore(s => s.nmeaStatus);
  const pypilotStatus = useBoatStore(s => s.pypilotStatus);
  const depthUnit = useBoatStore(s => s.settings.depthUnit);
  const speedUnit = useBoatStore(s => s.settings.speedUnit);

  const roseSize = isLandscape ? Math.min(height * 0.35, 160) : Math.min(width * 0.5, 200);

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

  const speedDisplay = useMemo(() => {
    if (!waterSpeed) {return null;}
    switch (speedUnit) {
      case 'kmh': return (waterSpeed.value * 1.852).toFixed(1);
      case 'mph': return (waterSpeed.value * 1.15078).toFixed(1);
      default: return waterSpeed.value.toFixed(1);
    }
  }, [waterSpeed, speedUnit]);

  const speedUnitLabel = speedUnit === 'kmh' ? 'km/h' : speedUnit;

  if (isLandscape) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
        {/* Status bar */}
        <View style={styles.statusBar}>
          <ConnectionStatus label="NMEA" status={nmeaStatus} />
          <ConnectionStatus label="Pypilot" status={pypilotStatus} />
        </View>

        {/* Row 1: Text instruments */}
        <View style={styles.landscapeRow}>
          <InstrumentCard
            label="HDG"
            value={headingTrue ? String(Math.round(headingTrue.value)).padStart(3, '0') : null}
            unit="°T"
            updatedAt={headingTrue?.updatedAt}
          />
          <InstrumentCard
            label="DEPTH"
            value={depthDisplay}
            unit={depthUnitLabel}
            updatedAt={depth?.updatedAt}
          />
          <InstrumentCard
            label="STW"
            value={speedDisplay}
            unit={speedUnitLabel}
            updatedAt={waterSpeed?.updatedAt}
          />
          <InstrumentCard
            label="SOG"
            value={gps ? gps.value.sog.toFixed(1) : null}
            unit="kn"
            updatedAt={gps?.updatedAt}
          />
          <InstrumentCard
            label="COG"
            value={gps ? String(Math.round(gps.value.cog)).padStart(3, '0') : null}
            unit="°"
            updatedAt={gps?.updatedAt}
          />
          <InstrumentCard
            label="AWS"
            value={windApparent ? windApparent.value.speed.toFixed(1) : null}
            unit="kn"
            updatedAt={windApparent?.updatedAt}
          />
        </View>

        {/* Row 2: Wind rose + Compass + AP mini */}
        <View style={styles.landscapeRow}>
          <InstrumentCard label="WIND" value={null} updatedAt={null}>
            <WindRose
              apparentAngle={windApparent?.value.angle}
              apparentSpeed={windApparent?.value.speed}
              trueAngle={windTrue?.value.angle}
              trueSpeed={windTrue?.value.speed}
              size={roseSize}
            />
          </InstrumentCard>
          <InstrumentCard label="COMPASS" value={null} updatedAt={null}>
            <CompassRose heading={headingTrue?.value ?? 0} size={roseSize} />
          </InstrumentCard>
          <APMini />
        </View>

        {/* Row 3: IMU + Rudder */}
        <View style={styles.landscapeRow}>
          <InstrumentCard
            label="PITCH"
            value={imu ? imu.pitch.toFixed(1) : null}
            unit="°"
          />
          <InstrumentCard
            label="ROLL"
            value={imu ? imu.roll.toFixed(1) : null}
            unit="°"
          />
          <InstrumentCard
            label="HEEL"
            value={imu ? imu.heel.toFixed(1) : null}
            unit="°"
          />
          <InstrumentCard label="RUDDER" value={null} updatedAt={null}>
            <RudderIndicator angle={rudderAngle ?? 0} size={180} />
          </InstrumentCard>
        </View>
      </SafeAreaView>
    );
  }

  // Portrait layout
  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.statusBar}>
        <ConnectionStatus label="NMEA" status={nmeaStatus} />
        <ConnectionStatus label="Pypilot" status={pypilotStatus} />
      </View>
      <ScrollView contentContainerStyle={styles.portraitScroll}>
        <View style={styles.portraitRow}>
          <InstrumentCard
            label="HDG"
            value={headingTrue ? String(Math.round(headingTrue.value)).padStart(3, '0') : null}
            unit="°T"
            updatedAt={headingTrue?.updatedAt}
          />
          <InstrumentCard
            label="DEPTH"
            value={depthDisplay}
            unit={depthUnitLabel}
            updatedAt={depth?.updatedAt}
          />
        </View>

        <View style={styles.portraitRow}>
          <InstrumentCard
            label="STW"
            value={speedDisplay}
            unit={speedUnitLabel}
            updatedAt={waterSpeed?.updatedAt}
          />
          <InstrumentCard
            label="SOG"
            value={gps ? gps.value.sog.toFixed(1) : null}
            unit="kn"
            updatedAt={gps?.updatedAt}
          />
        </View>

        <InstrumentCard label="WIND ROSE" value={null} updatedAt={null}>
          <WindRose
            apparentAngle={windApparent?.value.angle}
            apparentSpeed={windApparent?.value.speed}
            trueAngle={windTrue?.value.angle}
            trueSpeed={windTrue?.value.speed}
            size={roseSize}
          />
        </InstrumentCard>

        <View style={styles.portraitRow}>
          <InstrumentCard
            label="AWS"
            value={windApparent ? windApparent.value.speed.toFixed(1) : null}
            unit="kn"
            updatedAt={windApparent?.updatedAt}
          />
          <InstrumentCard
            label="AWA"
            value={windApparent ? windApparent.value.angle.toFixed(0) : null}
            unit="°"
            updatedAt={windApparent?.updatedAt}
          />
        </View>

        <InstrumentCard label="RUDDER" value={null} updatedAt={null}>
          <RudderIndicator angle={rudderAngle ?? 0} size={width - 40} />
        </InstrumentCard>

        <View style={styles.portraitRow}>
          <InstrumentCard
            label="PITCH"
            value={imu ? imu.pitch.toFixed(1) : null}
            unit="°"
          />
          <InstrumentCard
            label="ROLL"
            value={imu ? imu.roll.toFixed(1) : null}
            unit="°"
          />
          <InstrumentCard
            label="HEEL"
            value={imu ? imu.heel.toFixed(1) : null}
            unit="°"
          />
        </View>

        <APMini />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  landscapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'stretch',
  },
  portraitScroll: {padding: 8, gap: 8},
  portraitRow: {flexDirection: 'row', gap: 4},
  apMini: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    margin: 4,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  apMiniLabel: {fontSize: 10, fontWeight: '600', textTransform: 'uppercase'},
  apMiniDot: {width: 10, height: 10, borderRadius: 5},
  apMiniStatus: {fontSize: 18, fontWeight: 'bold'},
  apMiniMode: {fontSize: 13},
  apMiniCmd: {fontSize: 24, fontWeight: 'bold'},
});
