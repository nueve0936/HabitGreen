import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Botones del SDD 9.3 con la forma de píldora de los mockups.
// - primary: el único CTA coral de la pantalla. Texto ink (no blanco) por contraste (SDD 9.6).
// - secondary: transparente con borde ink.
// - tertiary: enlace de texto subrayado, con área táctil de 44 px.

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
};

const CONTAINER_CLASS: Record<ButtonVariant, string> = {
  primary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-ink bg-accent px-6 active:bg-accent-oscuro',
  secondary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-ink bg-transparent px-6 active:bg-bg-claro',
  tertiary: 'min-h-11 flex-row items-center justify-center px-2 active:opacity-70',
};

const DISABLED_CLASS: Record<ButtonVariant, string> = {
  primary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-ink bg-bg-oscuro px-6',
  secondary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-ink-soft bg-transparent px-6',
  tertiary: 'min-h-11 flex-row items-center justify-center px-2',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`${isDisabled ? DISABLED_CLASS[variant] : CONTAINER_CLASS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <AppText
            variant={variant === 'tertiary' ? 'body' : 'button'}
            weight={variant === 'tertiary' ? 'semibold' : 'bold'}
            tone={isDisabled ? 'ink-soft' : 'ink'}
            className={variant === 'tertiary' ? 'underline' : ''}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
