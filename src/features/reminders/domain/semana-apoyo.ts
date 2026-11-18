import { diasEntre } from '@/lib/dates';
import type { Historial } from '@/schemas/onboarding';

// Apoyo de las semanas 3 y 4 (SDD 7.1): quien suele soltar un hábito a las pocas semanas
// (`semanas_y_suelta`) recibe un mensaje en esas semanas, contadas desde que creó su plan.

export type SemanaApoyo = 3 | 4;

export function semanaDeApoyo(
  historial: Historial | null,
  /** Fecha local en que se creó el plan activo. */
  inicioPlan: string | null,
  fecha: string,
): SemanaApoyo | null {
  if (historial !== 'semanas_y_suelta' || inicioPlan === null || fecha < inicioPlan) return null;
  const semana = Math.floor(diasEntre(inicioPlan, fecha) / 7) + 1;
  return semana === 3 || semana === 4 ? semana : null;
}
