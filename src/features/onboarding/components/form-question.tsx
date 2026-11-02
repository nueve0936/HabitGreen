import { es } from '@/i18n/es';
import { ACOMPANAMIENTOS, HISTORIALES, MOMENTOS, OBSTACULOS, TIEMPOS } from '@/schemas/onboarding';

import type { Paso } from '../domain/form-rules';
import { AreasQuestion } from './areas-question';
import { ObjetivosQuestion } from './objetivos-question';
import { SingleChoiceQuestion } from './single-choice-question';

// Elige qué opciones mostrar en cada paso del formulario.

export type FormQuestionProps = {
  paso: Paso;
  /** Recibe true cuando se intentó elegir un tercer elemento en los pasos 1 y 2. */
  onLimite: (alcanzado: boolean) => void;
};

export function FormQuestion({ paso, onLimite }: FormQuestionProps) {
  const t = es.onboarding.formulario;
  switch (paso) {
    case 1:
      return <AreasQuestion onLimite={onLimite} />;
    case 2:
      return <ObjetivosQuestion onLimite={onLimite} />;
    case 3:
      return <SingleChoiceQuestion campo="historial" claves={HISTORIALES} textos={t.historial} />;
    case 4:
      return <SingleChoiceQuestion campo="tiempo" claves={TIEMPOS} textos={t.tiempo} />;
    case 5:
      return <SingleChoiceQuestion campo="momento" claves={MOMENTOS} textos={t.momento} />;
    case 6:
      return <SingleChoiceQuestion campo="obstaculo" claves={OBSTACULOS} textos={t.obstaculo} />;
    case 7:
      return (
        <SingleChoiceQuestion
          campo="acompanamiento"
          claves={ACOMPANAMIENTOS}
          textos={t.acompanamiento}
        />
      );
  }
}
