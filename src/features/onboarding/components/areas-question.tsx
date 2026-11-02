import { View } from 'react-native';

import { OptionChip } from '@/components/ui/option-chip';
import { es } from '@/i18n/es';
import { AREAS } from '@/schemas/onboarding';

import { useOnboardingStore } from '../onboarding-store';

// Pregunta 1: hasta 2 áreas. Al quitar un área se descartan sus objetivos de la pregunta 2.

export type AreasQuestionProps = {
  /** Recibe true cuando se intentó elegir una tercera área. */
  onLimite: (alcanzado: boolean) => void;
};

export function AreasQuestion({ onLimite }: AreasQuestionProps) {
  const t = es.onboarding.formulario;
  const elegidas = useOnboardingStore((s) => s.borrador.areas);
  const alternarArea = useOnboardingStore((s) => s.alternarArea);

  return (
    <View className="gap-3">
      {AREAS.map((area) => (
        <OptionChip
          key={area}
          kind="checkbox"
          label={t.areas[area]}
          selected={elegidas.includes(area)}
          onPress={() => onLimite(alternarArea(area))}
        />
      ))}
    </View>
  );
}
