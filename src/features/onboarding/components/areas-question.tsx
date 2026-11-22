import { View } from 'react-native';

import { OptionChip } from '@/components/ui/option-chip';
import { es } from '@/i18n/es';
import { AREAS } from '@/schemas/onboarding';

import { useOnboardingStore } from '../onboarding-store';

// Pregunta 1: un área por plan (varios planes por usuario); elegir otra reemplaza a la anterior y
// descarta sus objetivos de la pregunta 2. Las áreas que ya tienen un plan activo salen
// deshabilitadas con «Ya tienes un plan de esta área».

export function AreasQuestion() {
  const t = es.onboarding.formulario;
  const elegidas = useOnboardingStore((s) => s.borrador.areas);
  const alternarArea = useOnboardingStore((s) => s.alternarArea);
  const ocupadas = useOnboardingStore((s) => s.areasOcupadas);

  return (
    <View className="gap-3">
      {AREAS.map((area) => (
        <OptionChip
          key={area}
          label={t.areas[area]}
          description={ocupadas.includes(area) ? t.areaOcupada : undefined}
          disabled={ocupadas.includes(area)}
          selected={elegidas.includes(area)}
          onPress={() => alternarArea(area)}
        />
      ))}
    </View>
  );
}
