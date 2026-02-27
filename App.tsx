import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {AppNavigator} from './src/navigation/AppNavigator';
import {NMEAService} from './src/services/NMEAService';
import {PypilotService} from './src/services/PypilotService';
import {useBoatStore} from './src/store/useBoatStore';

function AppContent() {
  const {colors, mode} = useTheme();
  const settings = useBoatStore(s => s.settings);
  const loadSettings = useBoatStore(s => s.loadSettings);

  useEffect(() => {
    // Load persisted settings on mount
    loadSettings().then(() => {
      const {settings: loaded} = useBoatStore.getState();
      NMEAService.connect(loaded.nmea.host, loaded.nmea.port);
      PypilotService.connect(loaded.pypilot.host, loaded.pypilot.port);
    });

    return () => {
      NMEAService.disconnect();
      PypilotService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StatusBar
        barStyle={mode === 'night' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
