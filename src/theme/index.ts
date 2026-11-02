import { colors, fonts } from './tokens';

export { colors, fonts };

export type ColorToken = keyof typeof colors;

// Sombra suave de las tarjetas `surface` (SDD 9.3). En Android solo cuenta `elevation`.
export const cardShadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.18,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

export const gradientBackground = [colors.crema, colors.bg] as const;
