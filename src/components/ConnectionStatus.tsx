import React, {memo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {ConnectionStatus as Status} from '../store/slices/connection.slice';

interface ConnectionStatusProps {
  label: string;
  status: Status;
}

const STATUS_COLOR: Record<Status, string> = {
  disconnected: '#666666',
  connecting: '#FF8C00',
  connected: '#00AA44',
  error: '#CC0000',
};

function ConnectionStatusInner({label, status}: ConnectionStatusProps) {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {backgroundColor: STATUS_COLOR[status]},
        ]}
      />
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export const ConnectionStatus = memo(ConnectionStatusInner);
