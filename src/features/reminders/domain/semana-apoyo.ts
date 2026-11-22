import { diasEntre } from '@/lib/dates';
import type { Historial } from '@/schemas/onboarding';

// Apoyo de las semanas 3 y 4 (SDD 7.1): quien suele soltar un hábito a las pocas semanas
// (`semanas_y_suelta`) recibe un mensaje en esas semanas, contadas desde que creó su plan. Con
// varios planes, cada uno cuenta desde su inicio y con su propio historial (P3).

export type SemanaApoyo = 3 | 4;

/** Lo que necesita el apoyo de un plan: su historial (P3) y la fecha local en que empezó. */
export type PlanApoyo = { historial: Historial | null; inicioPlan: string };

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

/** La primera semana de apoyo que toca en alguno de los planes, o null. */
export function semanaDeApoyoEnPlanes(
  planes: readonly PlanApoyo[],
  fecha: string,
): SemanaApoyo | null {
  for (const plan of planes) {
    const semana = semanaDeApoyo(plan.historial, plan.inicioPlan, fecha);
    if (semana !== null) return semana;
  }
  return null;
}
