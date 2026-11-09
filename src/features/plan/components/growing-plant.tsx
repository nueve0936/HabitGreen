import { Sprout } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

// Planta que crece mientras se prepara el plan (SDD 9.4). Movimiento sobrio y suave; si el
// teléfono tiene «reducir movimiento», la planta se queda quieta.

export function GrowingPlant({ label }: { label: string }) {
  const reducirMovimiento = useReducedMotion();
  const escala = useSharedValue(0.85);

  useEffect(() => {
    if (reducirMovimiento) return;
    escala.value = withRepeat(
      withTiming(1.1, { duration: 900, easing: Easing.out(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(escala);
  }, [reducirMovimiento, escala]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      className="h-32 w-32 items-center justify-center rounded-card bg-accent-claro"
    >
      <Animated.View style={estilo}>
        <Sprout size={64} color={colors.ink} strokeWidth={2} />
      </Animated.View>
    </View>
  );
}
