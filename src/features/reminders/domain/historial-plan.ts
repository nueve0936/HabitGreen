import { HISTORIALES, type Historial } from '@/schemas/onboarding';

// P3 (historial) de un plan: cada plan guarda el suyo en `plans.respuestas`. Los planes de antes de
// este cambio no lo tienen: se usa el del formulario global.

const esHistorial = (valor: unknown): valor is Historial =>
  (HISTORIALES as readonly unknown[]).includes(valor);

export function historialDelPlan(
  respuestasPlan: unknown,
  historialGlobal: unknown,
): Historial | null {
  const propio =
    typeof respuestasPlan === 'object' && respuestasPlan !== null
      ? (respuestasPlan as { historial?: unknown }).historial
      : undefined;
  if (esHistorial(propio)) return propio;
  return esHistorial(historialGlobal) ? historialGlobal : null;
}
