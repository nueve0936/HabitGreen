import { View } from 'react-native';

import { OptionChip } from '@/components/ui/option-chip';

import type { Borrador } from '../domain/form-rules';
import { useOnboardingStore } from '../onboarding-store';

// Pregunta de una sola respuesta (pasos 3 a 7). Elegir otra opción reemplaza la anterior.

type PreguntaUnica = Exclude<keyof Borrador, 'areas' | 'objetivos'>;

export type SingleChoiceQuestionProps<K extends PreguntaUnica> = {
  campo: K;
  claves: readonly NonNullable<Borrador[K]>[];
  textos: Record<NonNullable<Borrador[K]>, string>;
};

export function SingleChoiceQuestion<K extends PreguntaUnica>({
  campo,
  claves,
  textos,
}: SingleChoiceQuestionProps<K>) {
  const elegida = useOnboardingStore((s) => s.borrador[campo]);
  const responder = useOnboardingStore((s) => s.responder);

  return (
    <View accessibilityRole="radiogroup" className="gap-3">
      {claves.map((clave) => (
        <OptionChip
          key={clave}
          label={textos[clave]}
          selected={elegida === clave}
          onPress={() => responder(campo, clave)}
        />
      ))}
    </View>
  );
}
