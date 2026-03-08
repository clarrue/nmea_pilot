import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';
import {NMEAService} from '../services/NMEAService';
import {PypilotService} from '../services/PypilotService';
import {ConnectionStatus} from '../components/ConnectionStatus';

function SectionHeader({title}: {title: string}) {
  const {colors} = useTheme();
  return (
    <Text style={[styles.sectionHeader, {color: colors.textSecondary}]}>
      {title}
    </Text>
  );
}

function SettingRow({label, children}: {label: string; children: React.ReactNode}) {
  const {colors} = useTheme();
  return (
    <View style={[styles.settingRow, {borderColor: colors.border}]}>
      <Text style={[styles.settingLabel, {color: colors.text}]}>{label}</Text>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}

function HostPortInput({
  host,
  port,
  onSave,
}: {
  host: string;
  port: number;
  onSave: (host: string, port: number) => void;
}) {
  const {colors} = useTheme();
  const [localHost, setLocalHost] = useState(host);
  const [localPort, setLocalPort] = useState(String(port));

  useEffect(() => {
    setLocalHost(host);
    setLocalPort(String(port));
  }, [host, port]);

  const handleSave = () => {
    const portNum = parseInt(localPort, 10);
    if (!localHost.trim() || isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid', 'Enter a valid host and port (1-65535).');
      return;
    }
    onSave(localHost.trim(), portNum);
  };

  return (
    <View style={styles.hostPortContainer}>
      <TextInput
        value={localHost}
        onChangeText={setLocalHost}
        placeholder="192.168.1.100"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          styles.hostInput,
          {color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated},
        ]}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        value={localPort}
        onChangeText={setLocalPort}
        placeholder="10110"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          styles.portInput,
          {color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceElevated},
        ]}
        keyboardType="number-pad"
      />
      <Pressable
        onPress={handleSave}
        style={[styles.saveBtn, {backgroundColor: colors.buttonPrimary}]}>
        <Text style={[styles.saveBtnText, {color: colors.buttonText}]}>Save</Text>
      </Pressable>
    </View>
  );
}

export function SettingsScreen() {
  const {colors, mode} = useTheme();
  const setTheme = useBoatStore(s => s.setTheme);
  const settings = useBoatStore(s => s.settings);
  const setNmeaConfig = useBoatStore(s => s.setNmeaConfig);
  const setPypilotConfig = useBoatStore(s => s.setPypilotConfig);
  const setDepthUnit = useBoatStore(s => s.setDepthUnit);
  const setSpeedUnit = useBoatStore(s => s.setSpeedUnit);
  const setVisiblePanels = useBoatStore(s => s.setVisiblePanels);
  const saveSettings = useBoatStore(s => s.saveSettings);
  const nmeaStatus = useBoatStore(s => s.nmeaStatus);
  const pypilotStatus = useBoatStore(s => s.pypilotStatus);

  const handleNmeaSave = useCallback(
    (host: string, port: number) => {
      setNmeaConfig({host, port});
      saveSettings();
      NMEAService.reconnect(host, port);
    },
    [setNmeaConfig, saveSettings],
  );

  const handlePypilotSave = useCallback(
    (host: string, port: number) => {
      setPypilotConfig({host, port});
      saveSettings();
      PypilotService.reconnect(host, port);
    },
    [setPypilotConfig, saveSettings],
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Connection status */}
        <SectionHeader title="Connection Status" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <ConnectionStatus label="NMEA" status={nmeaStatus} />
          <ConnectionStatus label="Pypilot" status={pypilotStatus} />
        </View>

        {/* NMEA source */}
        <SectionHeader title="NMEA Source" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <HostPortInput
            host={settings.nmea.host}
            port={settings.nmea.port}
            onSave={handleNmeaSave}
          />
        </View>

        {/* Pypilot */}
        <SectionHeader title="Pypilot Server" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <HostPortInput
            host={settings.pypilot.host}
            port={settings.pypilot.port}
            onSave={handlePypilotSave}
          />
        </View>

        {/* Display units */}
        <SectionHeader title="Display Units" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <SettingRow label="Depth">
            {(['m', 'ft', 'fathoms'] as const).map(unit => (
              <Pressable
                key={unit}
                onPress={() => { setDepthUnit(unit); saveSettings(); }}
                style={[
                  styles.unitBtn,
                  settings.depthUnit === unit && {backgroundColor: colors.accent},
                  {borderColor: colors.border},
                ]}>
                <Text
                  style={{
                    color: settings.depthUnit === unit ? colors.buttonText : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {unit}
                </Text>
              </Pressable>
            ))}
          </SettingRow>
          <SettingRow label="Speed">
            {(['kn', 'kmh', 'mph'] as const).map(unit => (
              <Pressable
                key={unit}
                onPress={() => { setSpeedUnit(unit); saveSettings(); }}
                style={[
                  styles.unitBtn,
                  settings.speedUnit === unit && {backgroundColor: colors.accent},
                  {borderColor: colors.border},
                ]}>
                <Text
                  style={{
                    color: settings.speedUnit === unit ? colors.buttonText : colors.text,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {unit}
                </Text>
              </Pressable>
            ))}
          </SettingRow>
        </View>

        {/* Dashboard panels */}
        <SectionHeader title="Dashboard Panels" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          {(['wind', 'navigation', 'autopilot', 'depth', 'pressure'] as const).map(panel => {
            const active = settings.visiblePanels[panel];
            return (
              <SettingRow key={panel} label={panel.charAt(0).toUpperCase() + panel.slice(1)}>
                <Pressable
                  onPress={() => { setVisiblePanels({[panel]: !active}); saveSettings(); }}
                  style={[
                    styles.unitBtn,
                    active && {backgroundColor: colors.accent},
                    {borderColor: colors.border},
                  ]}>
                  <Text style={{color: active ? colors.buttonText : colors.text, fontSize: 13, fontWeight: '600'}}>
                    {active ? 'ON' : 'OFF'}
                  </Text>
                </Pressable>
              </SettingRow>
            );
          })}
        </View>

        {/* Theme */}
        <SectionHeader title="Display Theme" />
        <View style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <SettingRow label="Theme">
            {(['day', 'light', 'night'] as const).map(t => (
              <Pressable
                key={t}
                onPress={() => { setTheme(t); saveSettings(); }}
                style={[
                  styles.unitBtn,
                  mode === t && {backgroundColor: colors.accent},
                  {borderColor: colors.border},
                ]}>
                <Text style={{
                  color: mode === t ? colors.buttonText : colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}>
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </SettingRow>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: 16, gap: 8},
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {fontSize: 15, fontWeight: '500'},
  settingControl: {flexDirection: 'row', alignItems: 'center', gap: 6},
  hostPortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  hostInput: {flex: 1},
  portInput: {width: 70},
  saveBtn: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: {fontSize: 14, fontWeight: '600'},
  unitBtn: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
