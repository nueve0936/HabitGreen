import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { OptionChip } from '@/components/ui/option-chip';
import { es } from '@/i18n/es';

import { objetivosPorAreaElegida } from '../domain/form-rules';
import { useOnboardingStore } from '../onboarding-store';

// Pregunta 2: hasta 2 objetivos (un tercero reemplaza al primero elegido), solo de las áreas
// elegidas, agrupados con un encabezado por área.

export function ObjetivosQuestion() {
  const t = es.onboarding.formulario;
  const areas = useOnboardingStore((s) => s.borrador.areas);
  const elegidos = useOnboardingStore((s) => s.borrador.objetivos);
  const alternarObjetivo = useOnboardingStore((s) => s.alternarObjetivo);

  return (
    <View className="gap-6">
      {objetivosPorAreaElegida(areas).map(({ area, objetivos }) => (
        <View key={area} className="gap-3">
          <AppText variant="h3" accessibilityRole="header">
            {t.areas[area]}
          </AppText>
          {objetivos.map((objetivo) => (
            <OptionChip
              key={objetivo}
              kind="checkbox"
              label={t.objetivos[objetivo]}
              selected={elegidos.includes(objetivo)}
              onPress={() => alternarObjetivo(objetivo)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
