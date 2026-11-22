import { z } from 'zod';

import {
  areaDeObjetivo,
  HISTORIALES,
  objetivoSchema,
  type Area,
  type Respuestas,
} from '@/schemas/onboarding';

// Varios planes por usuario (decisión del usuario): cada plan es de un área y guarda sus propias
// respuestas de área (P2 objetivos y P3 historial) en `plans.respuestas`; las globales (P4 tiempo,
// P5 momento, P6 obstáculo y P7 avisos) siguen en `onboarding_answers`. Las reglas (progresión,
// textos de la IA) reciben las dos juntas, como si el plan tuviera su propio formulario.

const respuestasPlanSchema = z.object({
  objetivos: z.array(objetivoSchema).optional(),
  historial: z.enum(HISTORIALES).nullable().optional(),
});

/** Respuestas que valen para un plan: las globales con el área, objetivos e historial del plan. */
export function respuestasDelPlan(globales: Respuestas, area: Area, propias: unknown): Respuestas {
  const plan = respuestasPlanSchema.safeParse(propias);
  const delArea = (o: Respuestas['objetivos'][number]) => areaDeObjetivo(o) === area;
  const objetivos = plan.success && plan.data.objetivos ? plan.data.objetivos : globales.objetivos;
  return {
    ...globales,
    areas: [area],
    objetivos: objetivos.filter(delArea),
    historial: (plan.success && plan.data.historial) || globales.historial,
  };
}
