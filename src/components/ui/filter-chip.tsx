import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { StableBoldText } from './stable-bold-text';

// Chip compacto (radio 999, SDD 9.3) para filtros y días de la semana. Elegido: fondo surface,
// texto en negrita e icono de verificación, para no depender solo del color.

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  kind?: 'radio' | 'checkbox';
  icon?: ReactNode;
  accessibilityLabel?: string;
};

export function FilterChip({
  label,
  selected,
  onPress,
  kind = 'radio',
  icon,
  accessibilityLabel,
}: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      className={`min-h-11 flex-row items-center gap-2 rounded-chip border-2 px-4 py-2 ${
        selected ? 'border-ink bg-surface' : 'border-bg-oscuro bg-campo active:bg-bg-claro'
      }`}
    >
      {/* Espacio fijo para el icono: el chip no crece al elegirse ni empuja a los de al lado. */}
      <View className="h-[18px] w-[18px] items-center justify-center">
        {selected ? <Check size={16} color={colors.ink} strokeWidth={3} /> : icon}
      </View>
      <StableBoldText variant="small" bold={selected}>
        {label}
      </StableBoldText>
    </Pressable>
  );
}
