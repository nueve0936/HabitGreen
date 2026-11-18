// Presupuesto diario (SDD 6.5): no limita crear hábitos. Si un día suma más minutos que el
// presupuesto, se avisa con suavidad y el presupuesto sube a esa suma.

export type CargaHabito = { duracion_min: number; dias_semana: readonly number[] };

/** Minutos de cada día de la semana: posición 0 = lunes … 6 = domingo. */
export function minutosPorDia(habitos: readonly CargaHabito[]): number[] {
  const minutos = [0, 0, 0, 0, 0, 0, 0];
  for (const h of habitos) {
    for (const dia of h.dias_semana) minutos[dia - 1] += h.duracion_min;
  }
  return minutos;
}

export function ajustePresupuesto(
  presupuesto: number,
  minutos: readonly number[],
): { excede: boolean; nuevoPresupuesto: number } {
  const maximo = Math.max(0, ...minutos);
  return maximo > presupuesto
    ? { excede: true, nuevoPresupuesto: maximo }
    : { excede: false, nuevoPresupuesto: presupuesto };
}

/**
 * Duración máxima de un hábito del plan: el tiempo diario entre los hábitos activos del plan
 * (definición 5, P4). Nunca baja de lo que el hábito ya tiene, para no obligar a recortarlo.
 */
export function limiteDuracionPlan(
  presupuesto: number,
  habitosDelPlan: number,
  actual: number,
): number {
  return Math.max(actual, Math.floor(presupuesto / Math.max(1, habitosDelPlan)));
}

/** Tiempo diario máximo que se elige en Perfil: 8 h. */
export const TIEMPO_DIARIO_MAX = 8 * 60;

/**
 * Máximo del selector de tiempo diario. Si el tiempo ya subió solo por encima de 8 h al crear
 * hábitos (SDD 6.5), ese valor se respeta para no obligar a bajarlo.
 */
export function limiteTiempoDiario(actual: number): number {
  return Math.max(TIEMPO_DIARIO_MAX, actual);
}
