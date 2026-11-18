import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Fila «Etiqueta — valor >» de la lista de ajustes del asistente (mockup «Crear hábito #3»).
// Sin `onPress` se muestra fija, sin flecha (por ejemplo, la fecha de inicio de un hábito ya
// empezado).

export type SettingsRowProps = {
  label: string;
  value: string;
  onPress?: () => void;
  /** Resalta la fila (la fecha de inicio en el mockup). */
  destacada?: boolean;
  ultima?: boolean;
};

export function SettingsRow({
  label,
  value,
  onPress,
  destacada = false,
  ultima = false,
}: SettingsRowProps) {
  const tono = destacada ? 'acento' : 'ink';
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-between gap-2 px-4 active:bg-accent-claro ${
        ultima ? '' : 'border-b border-divisor'
      }`}
    >
      {/* Con letra grande la etiqueta baja de línea en vez de empujar el valor fuera de la pantalla. */}
      <AppText weight="semibold" tone={tono} className="flex-1">
        {label}
      </AppText>
      <View className="flex-row items-center gap-1">
        <AppText variant="small" weight="semibold" tone={tono}>
          {value}
        </AppText>
        {onPress ? <ChevronRight size={20} color={colors.ink} /> : null}
      </View>
    </Pressable>
  );
}
