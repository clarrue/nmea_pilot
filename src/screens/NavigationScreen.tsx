import React, {useMemo} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CompassRose} from '../components/CompassRose';
import {InstrumentCard} from '../components/InstrumentCard';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeg(v: number): string {
  return String(Math.round(v) % 360).padStart(3, '0') + '°';
}

function formatLatLon(lat: number, lon: number): {latStr: string; lonStr: string} {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat);
  const absLon = Math.abs(lon);
  const latDeg = Math.floor(absLat);
  const lonDeg = Math.floor(absLon);
  const latMin = ((absLat - latDeg) * 60).toFixed(3);
  const lonMin = ((absLon - lonDeg) * 60).toFixed(3);
  return {
    latStr: `${latDeg}° ${latMin}' ${latDir}`,
    lonStr: `${lonDeg}° ${lonMin}' ${lonDir}`,
  };
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({title, accent}: {title: string; accent: string}) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionAccent, {backgroundColor: accent}]} />
      <Text style={[styles.sectionLabelText, {color: accent}]}>{title}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function NavigationScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();

  const headingTrue = useBoatStore(s => s.headingTrue);
  const headingMag = useBoatStore(s => s.headingMag);
  const waterSpeed = useBoatStore(s => s.waterSpeed);
  const gps = useBoatStore(s => s.gps);
  const speedUnit = useBoatStore(s => s.settings.speedUnit);

  const compassSize = Math.min(width - 32, height * 0.42);

  const speedDisplay = useMemo(() => {
    if (!waterSpeed) {return null;}
    switch (speedUnit) {
      case 'kmh': return (waterSpeed.value * 1.852).toFixed(1);
      case 'mph': return (waterSpeed.value * 1.15078).toFixed(1);
      default: return waterSpeed.value.toFixed(1);
    }
  }, [waterSpeed, speedUnit]);
  const speedUnitLabel = speedUnit === 'kmh' ? 'km/h' : speedUnit;

  const position = useMemo(() => {
    if (!gps?.value.latitude || !gps?.value.longitude) {return null;}
    return formatLatLon(gps.value.latitude, gps.value.longitude);
  }, [gps]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        {/* Compass */}
        <SectionLabel title="HEADING" accent={colors.success} />
        <View style={styles.compassWrapper}>
          <CompassRose heading={headingTrue?.value ?? 0} size={compassSize} />
        </View>

        {/* Heading / Course row */}
        <View style={styles.cardsRow}>
          <InstrumentCard
            label="HDG TRUE"
            value={headingTrue ? formatDeg(headingTrue.value) : null}
            updatedAt={headingTrue?.updatedAt}
            accentColor={colors.success}
          />
          <InstrumentCard
            label="HDG MAG"
            value={headingMag ? formatDeg(headingMag.value) : null}
            updatedAt={headingMag?.updatedAt}
            accentColor={colors.textSecondary}
          />
          <InstrumentCard
            label="COG"
            value={gps ? formatDeg(gps.value.cog) : null}
            updatedAt={gps?.updatedAt}
            accentColor={colors.accent}
          />
        </View>

        {/* Speed row */}
        <SectionLabel title="SPEED" accent={colors.accent} />
        <View style={styles.cardsRow}>
          <InstrumentCard
            label="STW"
            value={speedDisplay}
            unit={speedUnitLabel}
            updatedAt={waterSpeed?.updatedAt}
            accentColor={colors.accent}
          />
          <InstrumentCard
            label="SOG"
            value={gps ? gps.value.sog.toFixed(1) : null}
            unit="kn"
            updatedAt={gps?.updatedAt}
            accentColor={colors.accent}
          />
        </View>

        {/* Position */}
        <SectionLabel title="POSITION" accent={colors.windTrue} />
        <View style={[styles.positionCard, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          {position ? (
            <>
              <View style={styles.posRow}>
                <Text style={[styles.posLabel, {color: colors.textMuted}]}>LAT</Text>
                <Text style={[styles.posValue, {color: colors.text}]}>{position.latStr}</Text>
              </View>
              <View style={[styles.posDivider, {backgroundColor: colors.border}]} />
              <View style={styles.posRow}>
                <Text style={[styles.posLabel, {color: colors.textMuted}]}>LON</Text>
                <Text style={[styles.posValue, {color: colors.text}]}>{position.lonStr}</Text>
              </View>
            </>
          ) : (
            <Text style={[styles.posNoData, {color: colors.textMuted}]}>No GPS fix</Text>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {
    padding: 16,
    gap: 12,
    alignItems: 'stretch',
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  compassWrapper: {
    alignItems: 'center',
  },

  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },

  positionCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  posDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  posLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    width: 34,
  },
  posValue: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  posNoData: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});
