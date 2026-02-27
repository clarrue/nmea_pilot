import React from 'react';
import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WindRose} from '../components/WindRose';
import {InstrumentCard} from '../components/InstrumentCard';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

export function WindScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const windApparent = useBoatStore(s => s.windApparent);
  const windTrue = useBoatStore(s => s.windTrue);

  const roseSize = Math.min(width, height) * 0.7;

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={styles.roseContainer}>
        <WindRose
          apparentAngle={windApparent?.value.angle}
          apparentSpeed={windApparent?.value.speed}
          trueAngle={windTrue?.value.angle}
          trueSpeed={windTrue?.value.speed}
          size={roseSize}
        />
      </View>

      <View style={styles.dataRow}>
        <InstrumentCard
          label="AWS"
          value={windApparent ? windApparent.value.speed.toFixed(1) : null}
          unit="kn"
          updatedAt={windApparent?.updatedAt}
        />
        <InstrumentCard
          label="AWA"
          value={
            windApparent
              ? `${windApparent.value.angle > 180 ? '-' : '+'}${Math.min(
                  windApparent.value.angle,
                  360 - windApparent.value.angle,
                ).toFixed(0)}`
              : null
          }
          unit="°"
          updatedAt={windApparent?.updatedAt}
        />
        <InstrumentCard
          label="TWS"
          value={windTrue ? windTrue.value.speed.toFixed(1) : null}
          unit="kn"
          updatedAt={windTrue?.updatedAt}
        />
        <InstrumentCard
          label="TWA"
          value={
            windTrue
              ? `${windTrue.value.angle > 180 ? '-' : '+'}${Math.min(
                  windTrue.value.angle,
                  360 - windTrue.value.angle,
                ).toFixed(0)}`
              : null
          }
          unit="°"
          updatedAt={windTrue?.updatedAt}
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.windApparent}]} />
          <Text style={[styles.legendText, {color: colors.textSecondary}]}>
            Apparent
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, {backgroundColor: colors.windTrue}]} />
          <Text style={[styles.legendText, {color: colors.textSecondary}]}>
            True
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  roseContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 12,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
});
