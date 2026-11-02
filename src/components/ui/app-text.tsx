import { Text, type TextProps } from 'react-native';

// Texto base de la app: Lexend Deca, color ink y escala del SDD 9.2.
// El escalado del sistema se limita a 1.3× (definición 8).

export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'button';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TextTone = 'ink' | 'ink-soft';

const VARIANT_CLASS: Record<TextVariant, string> = {
  h1: 'text-h1',
  h2: 'text-h2',
  h3: 'text-h3',
  body: 'text-body',
  small: 'text-small',
  button: 'text-button',
};

const DEFAULT_WEIGHT: Record<TextVariant, TextWeight> = {
  h1: 'bold',
  h2: 'semibold',
  h3: 'semibold',
  body: 'regular',
  small: 'regular',
  button: 'semibold',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-sans',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const TONE_CLASS: Record<TextTone, string> = {
  ink: 'text-ink',
  // ink-soft solo sobre el fondo bg o crema, nunca sobre tarjetas surface (SDD 9.6).
  'ink-soft': 'text-ink-soft',
};

export type AppTextProps = TextProps & {
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  className?: string;
};

export function AppText({
  variant = 'body',
  weight,
  tone = 'ink',
  className = '',
  maxFontSizeMultiplier = 1.3,
  ...props
}: AppTextProps) {
  const isHeading = variant === 'h1' || variant === 'h2' || variant === 'h3';
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      className={`${VARIANT_CLASS[variant]} ${WEIGHT_CLASS[weight ?? DEFAULT_WEIGHT[variant]]} ${TONE_CLASS[tone]} ${className}`}
      {...props}
    />
  );
}
