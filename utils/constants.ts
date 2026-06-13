export const COLORS = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#0f3460',
  gold: '#d4af37',
  lightGold: '#f4e4c1',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  gray: '#666666',
  darkGray: '#333333',
  success: '#4caf50',
  error: '#f44336',
  darkBackground: '#121212',
  darkSurface: '#1e1e1e',
  darkBorder: '#333333',
};

export const LIGHT_THEME = {
  dark: false,
  colors: {
    background: COLORS.lightGray,
    card: COLORS.white,
    text: COLORS.darkGray,
    subText: COLORS.gray,
    border: COLORS.lightGray,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    accent: COLORS.accent,
    gold: COLORS.gold,
    error: COLORS.error,
    success: COLORS.success,
    white: COLORS.white,
    inputBackground: COLORS.white,
    tabBar: COLORS.white,
    header: COLORS.primary,
    headerText: COLORS.white,
  },
};

export const DARK_THEME = {
  dark: true,
  colors: {
    background: COLORS.darkBackground,
    card: COLORS.darkSurface,
    text: COLORS.white,
    subText: '#aaaaaa',
    border: COLORS.darkBorder,
    primary: COLORS.gold,
    secondary: COLORS.secondary,
    accent: COLORS.accent,
    gold: COLORS.gold,
    error: COLORS.error,
    success: COLORS.success,
    white: COLORS.white,
    inputBackground: COLORS.darkSurface,
    tabBar: COLORS.darkSurface,
    header: COLORS.darkSurface,
    headerText: COLORS.white,
  },
};

export type Theme = typeof LIGHT_THEME;


export const CONTACT = {
  phone1: '403 467 8100',
  phone2: '403 467 7367',
  serviceArea: 'Calgary and nearby regions',
  email: 'info@myroadtrip.ca',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};