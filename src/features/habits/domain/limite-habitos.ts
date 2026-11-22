import { AREAS } from '@/schemas/onboarding';

// Límites de hábitos y de planes (varios planes, fase 5; decisiones del usuario del 20 y 22 nov):
//   - cada plan tiene hasta `limite_habitos_plan` hábitos activos (app_config, 3); desbloqueado
//     (90 días con 85 % o más) ya no tiene tope y solo cuenta el tiempo diario;
//   - empiezas con 1 plan y ganas otro con cada subida de nivel de un hábito de tus planes, hasta
//     uno por área;
//   - los hábitos propios tienen su límite aparte: 3 + 1 por subida, contando solo los propios.
//     Sin planes activos, o con alguno desbloqueado, no tienen límite;
//   - solo cuentan los activos: los pausados y los eliminados (archivados) no.
// Las subidas (`user_settings.subidas_plan`) dan a la vez un plan más y un propio más; bajar no resta.

/** Hábitos propios activos con los que se empieza al tener un plan. */
export const HABITOS_PROPIOS_BASE = 3;

/** Planes con los que se empieza. */
export const PLANES_BASE = 1;

export type PlanLimite = { id: string; desbloqueado: boolean; activos: number };

export type EstadoLimites = {
  /** Planes activos con sus hábitos activos. */
  planes: readonly PlanLimite[];
  /** Hábitos propios (sin plan) activos. */
  propiosActivos: number;
  subidas: number;
};

/** Máximo de hábitos propios activos, o null si no hay límite. */
export function limitePropios({ planes, subidas }: EstadoLimites): number | null {
  if (planes.length === 0 || planes.some((p) => p.desbloqueado)) return null;
  return HABITOS_PROPIOS_BASE + Math.max(0, subidas);
}

/** Máximo de planes activos: 1 más 1 por subida, hasta uno por área. */
export function limitePlanes(subidas: number): number {
  return Math.min(AREAS.length, PLANES_BASE + Math.max(0, subidas));
}

/** Máximo de hábitos activos de un plan, o null si está desbloqueado. */
export function limiteDelPlan(plan: Pick<PlanLimite, 'desbloqueado'>, tope: number): number | null {
  return plan.desbloqueado ? null : tope;
}

/** True si con `activos` todavía cabe otro (null = sin límite). */
export function cabe(activos: number, limite: number | null): boolean {
  return limite === null || activos < limite;
}
