import { diasEntre, sumarDias } from '@/lib/dates';

// Detalle del plan (decisión del usuario): «Cómo vas» y «Próxima revisión». Son reglas puras para
// poder probarlas sin la app. Nunca se muestran niveles ni XP: solo hechos y días.

/** Días que cuenta «Cómo vas»: las últimas 2 semanas, hasta ayer (hoy todavía puede hacerse). */
export const DIAS_AVANCE = 14;

export type Avance = { hechos: number; total: number };

/**
 * Hechos y programados de los hábitos del plan en las últimas 2 semanas. Con menos de `minimo`
 * días programados es pronto para medir: devuelve null y se muestra un mensaje de ánimo.
 */
export function avanceDelPlan(
  ocurrencias: readonly { habitId: string; fecha: string; hecho: boolean }[],
  habitos: ReadonlySet<string>,
  hoy: string,
  minimo: number,
): Avance | null {
  const desde = sumarDias(hoy, -DIAS_AVANCE);
  const hasta = sumarDias(hoy, -1);
  const delPlan = ocurrencias.filter(
    (o) => habitos.has(o.habitId) && o.fecha >= desde && o.fecha <= hasta,
  );
  if (delPlan.length < minimo) return null;
  return { hechos: delPlan.filter((o) => o.hecho).length, total: delPlan.length };
}

/** Días que faltan para la próxima revisión del plan (0 = hoy). */
export function diasParaRevision(
  hoy: string,
  ultimaEvaluacion: string | null,
  inicio: string,
  diasEntreRevisiones: number,
): number {
  const desde = ultimaEvaluacion ?? inicio;
  return Math.max(0, diasEntreRevisiones - diasEntre(desde, hoy));
}
