import { CircleCheck, Clock } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Pasos de «Estamos preparando algo único…» (mockup «Encuesta Inicial: Preparando»): cada paso
// cambia de reloj a verificación cuando termina. El estado también se dice con texto para el
// lector de pantalla.

export function PreparingSteps({ listos }: { listos: number }) {
  const t = es.onboarding.generando;

  return (
    <View className="gap-2 self-center" accessibilityLiveRegion="polite">
      {t.pasos.map((paso, i) => {
        const listo = i < listos;
        return (
          <View
            key={paso}
            accessible
            accessibilityLabel={`${paso}: ${listo ? t.pasoListo : t.pasoEnCurso}`}
            className="flex-row items-center gap-2"
          >
            {listo ? (
              <CircleCheck
                size={20}
                color={colors.campo}
                fill={colors.confirmar}
                strokeWidth={2.5}
              />
            ) : (
              <Clock size={20} color={colors['ink-soft']} />
            )}
            <AppText variant="small" tone="ink-soft">
              {paso}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
