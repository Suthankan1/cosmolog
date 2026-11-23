/**
 * COSMOLOG v2 design tokens — keep aligned with design/tokens.json.
 * Reference Figma: https://www.figma.com/design/TSztxI5A8AxSFqOpHftL4N
 * Font-family values are planned asset aliases; load the selected open-license
 * fonts during project scaffolding and verify the aliases on Android/iOS.
 */
export const colors = {
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
} as const;

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
  floatingInset: 12,
} as const;
