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
  background: '#0A1628',
  surface: '#112240',
  surfaceElevated: '#1A3355',
  border: '#2A4A7F',
  text: '#FFFFFF',
  textSecondary: '#A8C4E0',
  textMuted: '#5A7FA8',
  accent: '#00D4FF',
  accentSecondary: '#0099CC',
  warning: '#FF8C00',
  danger: '#FF4444',
  success: '#00DD66',
  staleWarn: '#FF8C00',
  staleHide: '#5A7FA8',
  tabBar: '#0D1F3D',
  tabBarActive: '#00D4FF',
  tabBarInactive: '#5A7FA8',
  windApparent: '#00D4FF',
  windTrue: '#FF8C35',
  compassNeedle: '#FF4444',
  rudderBar: '#00D4FF',
  buttonPrimary: '#0066CC',
  buttonDanger: '#FF4444',
  buttonNeutral: '#2A4A7F',
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
