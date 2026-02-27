import React, {useCallback} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CompassRose} from '../components/CompassRose';
import {RudderIndicator} from '../components/RudderIndicator';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {PypilotService} from '../services/PypilotService';
import {ApMode} from '../store/slices/pypilot.slice';
import {normalizeHeading} from '../utils/headingMath';

const AP_MODES: ApMode[] = ['compass', 'wind', 'gps', 'true wind'];

function APButton({
  label,
  onPress,
  variant = 'neutral',
  active = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'neutral';
  active?: boolean;
  disabled?: boolean;
}) {
  const {colors} = useTheme();
  const bgColor = active
    ? colors.accent
    : variant === 'danger'
    ? colors.buttonDanger
    : variant === 'primary'
    ? colors.buttonPrimary
    : colors.buttonNeutral;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        {backgroundColor: bgColor, opacity: pressed || disabled ? 0.6 : 1},
      ]}>
      <Text style={[styles.buttonText, {color: colors.buttonText}]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AutopilotScreen() {
  const {colors} = useTheme();
  const apEnabled = useBoatStore(s => s.apEnabled);
  const apMode = useBoatStore(s => s.apMode);
  const apHeading = useBoatStore(s => s.apHeading);
  const apHeadingCmd = useBoatStore(s => s.apHeadingCmd);
  const rudderAngle = useBoatStore(s => s.rudderAngle);
  const imu = useBoatStore(s => s.imu);
  const tackState = useBoatStore(s => s.tackState);
  const pypilotStatus = useBoatStore(s => s.pypilotStatus);

  const isConnected = pypilotStatus === 'connected';

  const toggleAP = useCallback(() => {
    PypilotService.setEnabled(!apEnabled);
  }, [apEnabled]);

  const handleModeChange = useCallback((mode: ApMode) => {
    PypilotService.setMode(mode);
  }, []);

  const handleHeadingAdjust = useCallback((delta: number) => {
    PypilotService.adjustHeading(delta);
  }, []);

  const handleTack = useCallback(
    (direction: 'port' | 'starboard') => {
      Alert.alert(
        `Tack ${direction}?`,
        `Execute ${direction} tack?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Execute',
            onPress: () => {
              PypilotService.setTackDirection(direction);
              PypilotService.beginTack();
            },
          },
        ],
      );
    },
    [],
  );

  const displayHeading = apHeading !== null ? Math.round(apHeading) : 0;
  const displayCmd =
    apHeadingCmd !== null
      ? String(Math.round(normalizeHeading(apHeadingCmd))).padStart(3, '0') +
        '°'
      : '---';

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status bar */}
        <View style={[styles.statusBar, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>STATUS</Text>
            <Text
              style={[
                styles.statusValue,
                {color: apEnabled ? colors.success : colors.textMuted},
              ]}>
              {apEnabled ? 'ENGAGED' : 'STANDBY'}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>MODE</Text>
            <Text style={[styles.statusValue, {color: colors.text}]}>
              {apMode.toUpperCase()}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusLabel, {color: colors.textSecondary}]}>TARGET</Text>
            <Text style={[styles.statusValue, {color: colors.accent}]}>
              {displayCmd}
            </Text>
          </View>
        </View>

        {/* Compass + Rudder */}
        <View style={styles.gaugesRow}>
          <CompassRose heading={displayHeading} size={200} />
          <View style={styles.rudderContainer}>
            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>RUDDER</Text>
            <RudderIndicator angle={rudderAngle ?? 0} size={200} />
            {imu && (
              <View style={styles.imuRow}>
                <View style={styles.imuItem}>
                  <Text style={[styles.imuLabel, {color: colors.textMuted}]}>PITCH</Text>
                  <Text style={[styles.imuValue, {color: colors.text}]}>
                    {imu.pitch.toFixed(1)}°
                  </Text>
                </View>
                <View style={styles.imuItem}>
                  <Text style={[styles.imuLabel, {color: colors.textMuted}]}>ROLL</Text>
                  <Text style={[styles.imuValue, {color: colors.text}]}>
                    {imu.roll.toFixed(1)}°
                  </Text>
                </View>
                <View style={styles.imuItem}>
                  <Text style={[styles.imuLabel, {color: colors.textMuted}]}>HEEL</Text>
                  <Text style={[styles.imuValue, {color: colors.text}]}>
                    {imu.heel.toFixed(1)}°
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Engage / Disengage */}
        <View style={styles.row}>
          <APButton
            label={apEnabled ? 'DISENGAGE' : 'ENGAGE'}
            onPress={toggleAP}
            variant={apEnabled ? 'danger' : 'primary'}
            disabled={!isConnected}
          />
        </View>

        {/* Heading adjustment */}
        {apEnabled && (
          <View style={styles.adjustRow}>
            <APButton label="-10°" onPress={() => handleHeadingAdjust(-10)} />
            <APButton label="-1°" onPress={() => handleHeadingAdjust(-1)} />
            <APButton label="+1°" onPress={() => handleHeadingAdjust(1)} />
            <APButton label="+10°" onPress={() => handleHeadingAdjust(10)} />
          </View>
        )}

        {/* Mode selector */}
        <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>MODE</Text>
        <View style={styles.modeRow}>
          {AP_MODES.map(mode => (
            <APButton
              key={mode}
              label={mode.toUpperCase()}
              onPress={() => handleModeChange(mode)}
              active={apMode === mode}
              disabled={!isConnected}
            />
          ))}
        </View>

        {/* Tack controls */}
        {apEnabled && (
          <>
            <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>TACK</Text>
            <View style={styles.row}>
              <APButton
                label="◄ PORT TACK"
                onPress={() => handleTack('port')}
                variant="neutral"
              />
              <APButton
                label="STBD TACK ►"
                onPress={() => handleTack('starboard')}
                variant="neutral"
              />
            </View>
            {tackState && tackState !== 'none' && (
              <Text style={[styles.tackStatus, {color: colors.warning}]}>
                TACK: {tackState.toUpperCase()}
              </Text>
            )}
          </>
        )}

        {!isConnected && (
          <Text style={[styles.offlineNotice, {color: colors.textMuted}]}>
            Pypilot not connected
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: 12, gap: 12},
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  statusItem: {alignItems: 'center'},
  statusLabel: {fontSize: 10, fontWeight: '600', textTransform: 'uppercase'},
  statusValue: {fontSize: 20, fontWeight: 'bold', marginTop: 2},
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  rudderContainer: {alignItems: 'center', flex: 1, minWidth: 200},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  imuRow: {flexDirection: 'row', gap: 16, marginTop: 8},
  imuItem: {alignItems: 'center'},
  imuLabel: {fontSize: 10, textTransform: 'uppercase'},
  imuValue: {fontSize: 16, fontWeight: 'bold'},
  row: {flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap'},
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {fontSize: 14, fontWeight: 'bold'},
  tackStatus: {textAlign: 'center', fontSize: 13, fontWeight: '600'},
  offlineNotice: {textAlign: 'center', fontSize: 13, marginTop: 8},
});
