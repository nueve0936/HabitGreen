import { ChevronRight, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useAccionUnica } from '@/lib/use-accion-unica';
import { colors } from '@/theme';

import { AppText } from './app-text';

// Fila del índice de Perfil: icono verde en un círculo verde claro, título, un resumen (a la
// derecha o debajo) y ›. Con `alerta`, el resumen lleva un icono de alerta: el estado nunca se dice
// solo con color. Un toque doble rápido no abre la pantalla dos veces.

export type MenuRowProps = {
  icono: LucideIcon;
  titulo: string;
  /** Valor corto a la derecha («40 min», «2 planes»). */
  valor?: string;
  /** Resumen debajo del título («Recordatorio suave»). */
  resumen?: string;
  alerta?: boolean;
  onPress: () => void;
  ultima?: boolean;
};

export function MenuRow({
  icono: Icono,
  titulo,
  valor,
  resumen,
  alerta = false,
  onPress,
  ultima = false,
}: MenuRowProps) {
  const unaVez = useAccionUnica(onPress);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[titulo, valor, resumen].filter(Boolean).join(', ')}
      onPress={unaVez}
      className={`min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-accent-claro ${
        ultima ? '' : 'border-b border-divisor'
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-chip bg-accent-claro">
        <Icono size={22} color={colors.accent} />
      </View>
      <View className="flex-1 gap-1">
        <AppText weight="semibold">{titulo}</AppText>
        {resumen ? (
          <View className="flex-row items-center gap-1">
            {alerta ? <TriangleAlert size={16} color={colors['alerta-advertencia-borde']} /> : null}
            <AppText variant="small" tone="ink-soft" className="flex-shrink">
              {resumen}
            </AppText>
          </View>
        ) : null}
      </View>
      {valor ? (
        <AppText variant="small" weight="semibold">
          {valor}
        </AppText>
      ) : null}
      <ChevronRight size={20} color={colors.ink} />
    </Pressable>
  );
}
