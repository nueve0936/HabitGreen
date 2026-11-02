// Fechas de hábitos como texto "YYYY-MM-DD" en la zona del usuario (definición 9). Se calculan
// con mediodía UTC para que sumar días no se desfase con los cambios de horario.

/** Fecha local "YYYY-MM-DD" (las fechas de hábitos van en la zona del usuario, definición 9). */
export function fechaLocal(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function aMediodiaUtc(fecha: string): Date {
  return new Date(`${fecha}T12:00:00Z`);
}

/** Suma (o resta, con n negativo) días a una fecha "YYYY-MM-DD". */
export function sumarDias(fecha: string, n: number): string {
  const d = aMediodiaUtc(fecha);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function diaIso(fecha: string): number {
  return aMediodiaUtc(fecha).getUTCDay() || 7;
}
