export type ThemeMode = 'day' | 'night';

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSecondary: string;
  warning: string;
  danger: string;
  success: string;
  staleWarn: string;
  staleHide: string;
  // Navigation
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  // Instrument-specific
  windApparent: string;
  windTrue: string;
  compassNeedle: string;
  rudderBar: string;
  // Buttons
  buttonPrimary: string;
  buttonDanger: string;
  buttonNeutral: string;
  buttonText: string;
}

export const dayColors: ColorPalette = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',
  border: '#E0E0E0',
  text: '#1A1A1A',
  textSecondary: '#555555',
  textMuted: '#999999',
  accent: '#0066CC',
  accentSecondary: '#0099FF',
  warning: '#FF8C00',
  danger: '#CC0000',
  success: '#00AA44',
  staleWarn: '#FF8C00',
  staleHide: '#999999',
  tabBar: '#FFFFFF',
  tabBarActive: '#0066CC',
  tabBarInactive: '#999999',
  windApparent: '#00BFFF',
  windTrue: '#FF6B35',
  compassNeedle: '#CC0000',
  rudderBar: '#0066CC',
  buttonPrimary: '#0066CC',
  buttonDanger: '#CC0000',
  buttonNeutral: '#666666',
  buttonText: '#FFFFFF',
};

export const nightColors: ColorPalette = {
  background: '#0A0A0A',
  surface: '#1A0000',
  surfaceElevated: '#220000',
  border: '#3A0000',
  text: '#FF3300',
  textSecondary: '#CC2200',
  textMuted: '#661100',
  accent: '#FF4400',
  accentSecondary: '#FF6600',
  warning: '#FF6600',
  danger: '#FF0000',
  success: '#00CC44',
  staleWarn: '#FF6600',
  staleHide: '#661100',
  tabBar: '#0A0000',
  tabBarActive: '#FF3300',
  tabBarInactive: '#661100',
  windApparent: '#00AAFF',
  windTrue: '#FF6B35',
  compassNeedle: '#FF0000',
  rudderBar: '#FF4400',
  buttonPrimary: '#CC2200',
  buttonDanger: '#FF0000',
  buttonNeutral: '#440000',
  buttonText: '#FF3300',
};

export const palettes: Record<ThemeMode, ColorPalette> = {
  day: dayColors,
  night: nightColors,
};
