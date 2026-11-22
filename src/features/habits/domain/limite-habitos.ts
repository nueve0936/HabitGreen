// Límites de hábitos (varios planes; decisión del usuario del 22 nov, «un solo cupo total» para no
// agobiar):
//   - con al menos un plan activo hay un cupo total de hábitos activos, del plan y propios juntos:
//     empieza en HABITOS_BASE y suma 1 por cada subida de nivel de un hábito de los planes
//     (`user_settings.subidas_plan`; bajar no resta);
//   - sin planes activos no hay límite; con cualquier plan desbloqueado (90 días con 85 % o más)
//     el cupo desaparece y solo cuenta el tiempo diario;
//   - además, cada plan tiene hasta `limite_habitos_plan` hábitos activos (app_config, 3), salvo
//     desbloqueado;
//   - para crear un plan hace falta un lugar libre, también el primero;
//   - solo cuentan los activos: los pausados y los eliminados (archivados) no.

/** Hábitos activos con los que se empieza al tener un plan. */
export const HABITOS_BASE = 3;

export type PlanLimite = { id: string; desbloqueado: boolean; activos: number };

export type EstadoLimites = {
  /** Planes activos con sus hábitos activos. */
  planes: readonly PlanLimite[];
  /** Hábitos propios (sin plan) activos. */
  propiosActivos: number;
  subidas: number;
};

type HabitoLimite = { plan_id: string | null; activo: boolean; archivado_en: string | null };

/** Arma el estado a partir de los planes activos, los hábitos y las subidas. */
export function estadoDesde(
  planes: readonly { id: string; desbloqueado: boolean }[],
  habitos: readonly HabitoLimite[],
  subidas: number,
): EstadoLimites {
  const activos = habitos.filter((h) => h.activo && h.archivado_en === null);
  const ids = new Set(planes.map((p) => p.id));
  return {
    planes: planes.map((p) => ({
      ...p,
      activos: activos.filter((h) => h.plan_id === p.id).length,
    })),
    // Un hábito con el plan ya terminado cuenta como propio.
    propiosActivos: activos.filter((h) => h.plan_id === null || !ids.has(h.plan_id)).length,
    subidas,
  };
}

/** Hábitos activos que cuenta el cupo: los de los planes y los propios. */
export function activosTotales(e: EstadoLimites): number {
  return e.propiosActivos + e.planes.reduce((suma, p) => suma + p.activos, 0);
}

/** Cupo total de hábitos activos, o null si no hay límite. */
export function limiteTotal({ planes, subidas }: EstadoLimites): number | null {
  if (planes.length === 0 || planes.some((p) => p.desbloqueado)) return null;
  return HABITOS_BASE + Math.max(0, subidas);
}

/** Lugares libres en el cupo (nunca menos de 0), o null si no hay límite. */
export function lugaresLibres(e: EstadoLimites): number | null {
  const limite = limiteTotal(e);
  return limite === null ? null : Math.max(0, limite - activosTotales(e));
}

/** Máximo de hábitos activos de un plan, o null si está desbloqueado. */
export function limiteDelPlan(plan: Pick<PlanLimite, 'desbloqueado'>, tope: number): number | null {
  return plan.desbloqueado ? null : tope;
}

/** True si con `activos` todavía cabe otro (null = sin límite). */
export function cabe(activos: number, limite: number | null): boolean {
  return limite === null || activos < limite;
}
