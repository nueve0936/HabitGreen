import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { es } from '@/i18n/es';
import { colors } from '@/theme';
import { navegar } from '@/lib/navegar';

// Botón circular de regresar de los mockups (48 × 48).

export type BackButtonProps = {
  onPress?: () => void;
};

export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={es.comun.volver}
      onPress={onPress ?? (() => navegar.back())}
      className="h-12 w-12 items-center justify-center rounded-chip border border-divisor bg-campo active:bg-accent-claro"
    >
      <ArrowLeft size={24} color={colors.ink} strokeWidth={2} />
    </Pressable>
  );
}
