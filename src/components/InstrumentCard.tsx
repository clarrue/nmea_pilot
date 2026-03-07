import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

interface InstrumentCardProps {
  label: string;
  value: string | null; // null → show "---"
  unit?: string;
  updatedAt?: number | null;
  compact?: boolean;
  accentColor?: string; // optional label color override
  children?: React.ReactNode; // For embedding SVG instruments
}

function InstrumentCardInner({
  label,
  value,
  unit,
  updatedAt,
  compact = false,
  accentColor,
  children,
}: InstrumentCardProps) {
  const {colors} = useTheme();
  const staleness = useBoatStore(s => s.settings.staleness);

  const now = Date.now();
  const age = updatedAt ? now - updatedAt : null;
  const isStaleWarn = age !== null && age > staleness.warnAfterMs;
  const isStaleHide = age !== null && age > staleness.hideAfterMs;

  const displayValue = isStaleHide ? '---' : value ?? '---';
  const valueColor = isStaleHide
    ? colors.staleHide
    : isStaleWarn
    ? colors.staleWarn
    : colors.text;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        compact && styles.compact,
      ]}>
      <Text
        style={[styles.label, {color: accentColor ?? colors.textSecondary}]}
        numberOfLines={1}>
        {label}
      </Text>

      {children ? (
        <View style={styles.childrenContainer}>{children}</View>
      ) : (
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.value,
              {color: valueColor},
              compact && styles.valueCompact,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {displayValue}
          </Text>
          {unit && !isStaleHide && (
            <Text style={[styles.unit, {color: colors.textMuted}]}>
              {unit}
            </Text>
          )}
        </View>
      )}

      {isStaleWarn && !isStaleHide && (
        <View style={[styles.staleBadge, {backgroundColor: colors.staleWarn}]}>
          <Text style={styles.staleBadgeText}>STALE</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    margin: 4,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 2,
  },
  compact: {
    padding: 6,
    margin: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  valueCompact: {
    fontSize: 22,
  },
  unit: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '500',
  },
  childrenContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  staleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  staleBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
});

export const InstrumentCard = memo(InstrumentCardInner);
