import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/theme';

// «‹  16–22 nov  ›»: cambia de periodo. La flecha derecha se apaga en el periodo actual y la
// izquierda antes del primer horario. El nombre del periodo se anuncia al cambiar.

export type PeriodNavProps = {
  etiqueta: string;
  anteriorLabel: string;
  siguienteLabel: string;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  /** Algo al final de la fila, como el selector Mes / Año. */
  extra?: ReactNode;
};

function Flecha({
  icon: Icon,
  label,
  activa,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  activa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !activa }}
      disabled={!activa}
      onPress={onPress}
      // 48 dp exactos: en NativeWind `h-12` mide 42 dp (1 rem = 14 dp en nativo).
      style={{ width: 48, height: 48 }}
      className="items-center justify-center rounded-chip active:bg-accent-claro"
    >
      <Icon size={24} color={activa ? colors.ink : colors.divisor} />
    </Pressable>
  );
}

export function PeriodNav({
  etiqueta,
  anteriorLabel,
  siguienteLabel,
  puedeAnterior,
  puedeSiguiente,
  onAnterior,
  onSiguiente,
  extra,
}: PeriodNavProps) {
  return (
    <View className="flex-row items-center justify-between">
      <Flecha
        icon={ChevronLeft}
        label={anteriorLabel}
        activa={puedeAnterior}
        onPress={onAnterior}
      />
      <AppText weight="semibold" accessibilityLiveRegion="polite" className="flex-1 text-center">
        {etiqueta}
      </AppText>
      <Flecha
        icon={ChevronRight}
        label={siguienteLabel}
        activa={puedeSiguiente}
        onPress={onSiguiente}
      />
      {extra}
    </View>
  );
}
