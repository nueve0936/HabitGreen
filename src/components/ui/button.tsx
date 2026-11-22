import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { colors } from '@/theme';
import { useAccionUnica } from '@/lib/use-accion-unica';

import { AppText } from './app-text';

// Botones con forma de píldora (guía de UX/UI, sección 5).
// - primary: la acción principal de la pantalla, con texto blanco.
// - secondary: transparente con borde.
// - tertiary: enlace de texto subrayado, con área táctil de 48 dp.

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
    'h-12 flex-row items-center justify-center rounded-chip bg-accent px-6 active:bg-accent-oscuro',
  secondary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-borde bg-transparent px-6 active:bg-accent-claro',
  tertiary: 'min-h-12 flex-row items-center justify-center px-2 active:opacity-70',
};

const DISABLED_CLASS: Record<ButtonVariant, string> = {
  primary: 'h-12 flex-row items-center justify-center rounded-chip bg-divisor px-6',
  secondary:
    'h-12 flex-row items-center justify-center rounded-chip border-2 border-divisor bg-transparent px-6',
  tertiary: 'min-h-12 flex-row items-center justify-center px-2',
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className = '',
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;
  // Un toque doble rápido no manda la acción dos veces.
  const unaVez = useAccionUnica(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={`${isDisabled ? DISABLED_CLASS[variant] : CONTAINER_CLASS[variant]} ${className}`}
      {...props}
      onPress={unaVez}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <AppText
            variant={variant === 'tertiary' ? 'body' : 'button'}
            weight={variant === 'tertiary' ? 'semibold' : 'bold'}
            tone={isDisabled ? 'ink-soft' : variant === 'primary' ? 'blanco' : 'ink'}
            className={variant === 'tertiary' ? 'underline' : ''}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}
