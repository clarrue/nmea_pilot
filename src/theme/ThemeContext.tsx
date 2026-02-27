import React, {createContext, useCallback, useContext, useMemo} from 'react';
import {ColorPalette, ThemeMode, palettes} from './colors';
import {useBoatStore} from '../store/useBoatStore';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorPalette;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'day',
  colors: palettes.day,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const theme = useBoatStore(s => s.settings.theme);
  const setTheme = useBoatStore(s => s.setTheme);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'day' ? 'night' : 'day');
  }, [theme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: theme,
      colors: palettes[theme],
      toggleTheme,
    }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);
