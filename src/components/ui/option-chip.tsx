import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cardShadow, colors } from '@/theme';

import { AppText } from './app-text';
import { StableBoldText } from './stable-bold-text';

// Opción del formulario (mockup «Encuesta inicial #1.1»). Sin elegir: tarjeta con borde suave y
// sombra, para separarse del fondo. Elegida: relleno verde claro, borde `accent`, texto en negrita e
// icono de verificación, para no depender solo del color.

export type OptionChipProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** checkbox para preguntas de varias respuestas; radio para una sola. */
  kind?: 'radio' | 'checkbox';
  disabled?: boolean;
  /** Icono a la izquierda (categorías del asistente de hábito). */
  icon?: ReactNode;
};

export function OptionChip({
  label,
  description,
  selected,
  onPress,
  kind = 'radio',
  disabled = false,
  icon,
}: OptionChipProps) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked: selected, selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      style={cardShadow}
      className={`min-h-12 flex-row items-center gap-3 rounded-card border-2 px-4 py-3 ${
        selected
          ? 'border-accent bg-accent-claro'
          : 'border-divisor bg-campo active:bg-accent-claro'
      }`}
    >
      {icon}
      <View className={`flex-1 ${icon ? 'items-start' : 'items-center'}`}>
        <StableBoldText variant="h3" bold={selected} className="text-center">
          {label}
        </StableBoldText>
        {description ? (
          <AppText variant="small" tone="ink-soft" className="text-center">
            {description}
          </AppText>
        ) : null}
      </View>
      <View
        className={`h-7 w-7 items-center justify-center rounded-chip border-2 ${
          selected ? 'border-accent bg-accent' : 'border-borde bg-transparent'
        }`}
      >
        {selected ? <Check size={18} color={colors.blanco} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
