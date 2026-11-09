import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { cardShadow, colors } from '@/theme';

// Botón cuadrado de la acción principal en el encabezado de una pestaña: «+» en Hábitos y la bolsa
// de la Tienda en Jardín.

export type ActionSquareProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

export function ActionSquare({ label, icon: Icon, onPress }: ActionSquareProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={cardShadow}
      className="h-12 w-12 items-center justify-center rounded-accion bg-accent active:bg-accent-oscuro"
    >
      <Icon size={26} color={colors.blanco} strokeWidth={2.25} />
    </Pressable>
  );
}
