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
