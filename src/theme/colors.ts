export type ThemeMode = 'day' | 'light' | 'night';

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
  background: '#060C18',
  surface: '#0A1628',
  surfaceElevated: '#112240',
  border: '#1A3260',
  text: '#E8F3FF',
  textSecondary: '#8AAFD0',
  textMuted: '#3D6080',
  accent: '#00D4FF',
  accentSecondary: '#0099CC',
  warning: '#FF9500',
  danger: '#FF3B30',
  success: '#30D158',
  staleWarn: '#FF9500',
  staleHide: '#3D6080',
  tabBar: '#060C18',
  tabBarActive: '#00D4FF',
  tabBarInactive: '#3D6080',
  windApparent: '#00D4FF',
  windTrue: '#FF9A3C',
  compassNeedle: '#FF3B30',
  rudderBar: '#00D4FF',
  buttonPrimary: '#0A5FD6',
  buttonDanger: '#FF3B30',
  buttonNeutral: '#1A3260',
  buttonText: '#FFFFFF',
};

export const lightColors: ColorPalette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#EEF2F7',
  border: '#C8D6E5',
  text: '#0A1628',
  textSecondary: '#2D5080',
  textMuted: '#7A99BB',
  accent: '#0066CC',
  accentSecondary: '#0050A0',
  warning: '#D97000',
  danger: '#CC2200',
  success: '#1A8C3A',
  staleWarn: '#D97000',
  staleHide: '#7A99BB',
  tabBar: '#FFFFFF',
  tabBarActive: '#0066CC',
  tabBarInactive: '#7A99BB',
  windApparent: '#0066CC',
  windTrue: '#CC5500',
  compassNeedle: '#CC2200',
  rudderBar: '#0066CC',
  buttonPrimary: '#0066CC',
  buttonDanger: '#CC2200',
  buttonNeutral: '#C8D6E5',
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
  light: lightColors,
  night: nightColors,
};
