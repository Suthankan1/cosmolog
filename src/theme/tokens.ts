/**
 * COSMOLOG magazine design tokens — keep aligned with design/tokens.json.
 * Reference Figma: https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N
 * Font-family values are planned asset aliases; load the selected open-license
 * fonts during project scaffolding and verify the aliases on Android/iOS.
 */

export type ThemeMode = 'editorial' | 'night';

export interface ThemeColors {
  ivory: string;
  surface: string;
  forest: string;
  forestDark: string;
  terracotta: string;
  sage: string;
  sageLight: string;
  brass: string;
  ink: string;
  muted: string;
  border: string;
  white: string;
  danger: string;
  background: string;
  cardBg: string;
  cardPressed: string;
  textPrimary: string;
  textSecondary: string;
  statusBar: 'dark' | 'light';
}

export const editorialColors: ThemeColors = {
  ivory: '#F8F4EA',
  surface: '#FFFCF6',
  forest: '#184235',
  forestDark: '#102F26',
  terracotta: '#C1654A',
  sage: '#A8B89A',
  sageLight: '#E3E9DC',
  brass: '#C79B4D',
  ink: '#2C2A27',
  muted: '#62645D',
  border: '#E4DBCF',
  white: '#FFFFFF',
  danger: '#9B473A',
  background: '#F8F4EA',
  cardBg: '#FFFCF6',
  cardPressed: '#E3E9DC',
  textPrimary: '#184235',
  textSecondary: '#62645D',
  statusBar: 'dark',
};

export const nightColors: ThemeColors = {
  ivory: '#0D0B0B',          // dark charcoal/obsidian
  surface: '#1A1414',        // dark muted surface
  forest: '#E64A38',         // high-contrast red for primary headings & active icons
  forestDark: '#B32D20',     // deeper red
  terracotta: '#FF7B6B',     // luminous soft terracotta
  sage: '#8C3830',           // deep wine red
  sageLight: '#2E1C1A',      // dark wine chip background
  brass: '#E6A15C',          // amber brass
  ink: '#F2D6D3',            // soft high-contrast light red-cream text
  muted: '#A8807C',          // muted rose-gray
  border: '#3D2624',         // deep red border
  white: '#1A1414',          // dark surface instead of blinding white
  danger: '#FF6B6B',         // bright warning red
  background: '#0D0B0B',
  cardBg: '#1A1414',
  cardPressed: '#2E1C1A',
  textPrimary: '#E64A38',
  textSecondary: '#A8807C',
  statusBar: 'light',
};

export function getThemeColors(mode: ThemeMode = 'editorial'): ThemeColors {
  return mode === 'night' ? nightColors : editorialColors;
}

export const colors = editorialColors;

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
} as const;

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999,
} as const;

export const typography = {
  displayXL: { fontFamily: 'PlayfairDisplay-Regular', fontSize: 42, lineHeight: 48 },
  display: { fontFamily: 'PlayfairDisplay-Regular', fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: 'PlayfairDisplay-Regular', fontSize: 29, lineHeight: 36 },
  h2: { fontFamily: 'PlayfairDisplay-Regular', fontSize: 24, lineHeight: 30 },
  body: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 21 },
  bodySmall: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 12, lineHeight: 17 },
  meta: { fontFamily: 'Inter-Medium', fontSize: 10, lineHeight: 14 },
} as const;

export const layout = {
  referenceWidth: 390,
  referenceHeight: 844,
  horizontalInset: 24,
  minimumTouchTarget: 48,
  inputHeight: 48,
  primaryButtonHeight: 52,
  dockWidth: 264,
} as const;
