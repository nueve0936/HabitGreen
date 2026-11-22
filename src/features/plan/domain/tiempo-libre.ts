// Plan nuevo desde la app (decisión del usuario): se suma a los hábitos que ya tiene. Si en algún
// día la suma pasa del tiempo diario, se avisa cuánto falta; al guardar, el tiempo diario sube solo
// a lo necesario. Los hábitos sin duración no suman.

/** Minutos que pasa del tiempo diario el día más cargado (0 si cabe). Días: lunes … domingo. */
export function excesoDeTiempo(
  ocupado: readonly number[],
  delPlan: readonly number[],
  presupuesto: number,
): number {
  const maximo = Math.max(0, ...delPlan.map((m, i) => m + (ocupado[i] ?? 0)));
  return Math.max(0, maximo - presupuesto);
}
