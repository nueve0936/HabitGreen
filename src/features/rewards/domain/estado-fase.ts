// Cómo se muestra cada fase en el carrusel de Detalles (SDD 9.4). Siempre refleja la fase real: si
// deshacer un hábito regresa la planta de fase, esa fase vuelve a verse bloqueada.

export type EstadoFase = 'actual' | 'alcanzada' | 'bloqueada';

export const FASES = [1, 2, 3] as const;

export function estadoFase(fase: number, faseActual: number): EstadoFase {
  if (fase === faseActual) return 'actual';
  return fase < faseActual ? 'alcanzada' : 'bloqueada';
}
