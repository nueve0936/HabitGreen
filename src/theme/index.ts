import { colors, fonts, tintes } from './tokens';

export { colors, fonts, tintes };

export type ColorToken = keyof typeof colors;

// Sombra suave de las tarjetas (guía de UX/UI, sección 4). En Android solo cuenta `elevation`.
export const cardShadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;
