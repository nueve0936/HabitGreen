import { Coins } from 'lucide-react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/ui/app-text';
import { formatear } from '@/i18n/es';
import { colors } from '@/theme';

// «+10» con una moneda que sube y se desvanece junto al saldo al completar un hábito (SDD 6.1).
// Movimiento corto con ease-out (SDD 9.6); con «reducir movimiento» solo aparece y se va.
// Quien lo usa lo desmonta al terminar (cambiando su key o quitándolo).

const DURACION = 220;
const VISIBLE = 700;

export function CoinBurst({ monedas }: { monedas: number }) {
  const reducirMovimiento = useReducedMotion();
  const opacidad = useSharedValue(0);
  const desplazamiento = useSharedValue(reducirMovimiento ? 0 : 8);

  useEffect(() => {
    const curva = { duration: DURACION, easing: Easing.out(Easing.quad) };
    opacidad.value = withSequence(withTiming(1, curva), withDelay(VISIBLE, withTiming(0, curva)));
    if (!reducirMovimiento) desplazamiento.value = withTiming(-12, curva);
  }, [opacidad, desplazamiento, reducirMovimiento]);

  const estilo = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ translateY: desplazamiento.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={estilo}
      className="absolute -top-6 right-0 flex-row items-center gap-1"
    >
      <Coins size={18} color={colors['accent-oscuro']} />
      <AppText weight="bold">{formatear('+{n}', { n: monedas })}</AppText>
    </Animated.View>
  );
}

/** Tiempo total en pantalla, para que el padre lo quite al terminar. */
export const DURACION_COIN_BURST = DURACION * 2 + VISIBLE + 50;
