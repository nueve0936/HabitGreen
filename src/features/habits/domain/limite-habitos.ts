// Límite de hábitos del usuario guiado (pulidos antes del APK, decisión del usuario). Cuenta los
// del plan y los propios juntos:
//   - empieza en HABITOS_BASE y suma 1 cada vez que un hábito del plan sube de nivel (bajar no resta);
//   - con el límite del plan desbloqueado (90 días con 85 % o más) ya no hay límite;
//   - solo cuentan los activos: los pausados y los eliminados (archivados) no;
//   - el modo tradicional no tiene límite.
// Lo respetan «+» (crear un hábito propio) y la progresión (proponer un hábito nuevo al plan).

/** Hábitos activos con los que empieza el usuario guiado. Cambia este número para ajustar el límite. */
export const HABITOS_BASE = 3;

export type EntradaLimiteHabitos = {
  modo: 'guiado' | 'tradicional' | null;
  subidas: number;
  desbloqueado: boolean;
};

/** Máximo de hábitos activos (plan y propios), o null si no hay límite. */
export function limiteHabitos({
  modo,
  subidas,
  desbloqueado,
}: EntradaLimiteHabitos): number | null {
  if (modo !== 'guiado' || desbloqueado) return null;
  return HABITOS_BASE + Math.max(0, subidas);
}

/** True si ya no cabe otro hábito activo. */
export function alcanzoLimiteHabitos(activos: number, limite: number | null): boolean {
  return limite !== null && activos >= limite;
}
