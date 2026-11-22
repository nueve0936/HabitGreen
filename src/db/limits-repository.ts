import type { SQLiteDatabase } from 'expo-sqlite';

import {
  activosTotales,
  cabe,
  estadoDesde,
  type EstadoLimites,
  limiteDelPlan,
  limiteTotal,
  lugaresLibres,
} from '@/features/habits/domain/limite-habitos';

import { getDb, leerFilas } from './database';
import { leerConfigProgresion } from './settings-repository';

// Límites de hábitos leídos de SQLite (un solo cupo total; ver `limite-habitos`). Aquí solo se
// cuentan los planes y hábitos activos. Quien llama no bloquea si la lectura falla: el límite nunca
// debe impedir usar la app por un error.

export type CupoHabitos = { limite: number | null; alcanzado: boolean };

/** Planes activos con su desbloqueo, hábitos activos (del plan y propios) y subidas. */
export async function leerEstadoLimites(
  db: SQLiteDatabase,
  userId: string,
): Promise<EstadoLimites> {
  const planes = await leerFilas<{ id: string; limite_desbloqueado: boolean | null }>(
    db,
    'plans',
    'user_id = ? AND activo = 1',
    [userId],
  );
  const habitos = await leerFilas<{
    plan_id: string | null;
    activo: boolean;
    archivado_en: string | null;
  }>(db, 'habits', 'archivado_en IS NULL AND activo = 1');
  const ajustes = await db.getFirstAsync<{ subidas_plan: number | null }>(
    'SELECT subidas_plan FROM user_settings WHERE user_id = ?',
    [userId],
  );
  return estadoDesde(
    planes.map((p) => ({ id: p.id, desbloqueado: p.limite_desbloqueado === true })),
    habitos,
    ajustes?.subidas_plan ?? 0,
  );
}

const cupoTotal = (estado: EstadoLimites): CupoHabitos => {
  const limite = limiteTotal(estado);
  return { limite, alcanzado: !cabe(activosTotales(estado), limite) };
};

/** ¿Cabe otro hábito? Cupo total, del plan y propios juntos (sin planes no hay límite). */
export async function cupoHabitos(userId: string): Promise<CupoHabitos> {
  return cupoTotal(await leerEstadoLimites(await getDb(), userId));
}

/**
 * ¿Puede crear otro plan? Hace falta un lugar libre en el cupo, también para el primero. `libres`
 * dice cuántos hábitos caben en el plan nuevo (null = sin límite).
 */
export async function cupoPlanes(userId: string): Promise<CupoHabitos & { libres: number | null }> {
  const estado = await leerEstadoLimites(await getDb(), userId);
  // Contando el plan nuevo: aunque hoy no haya planes, el cupo empieza a regir con él.
  const conPlanNuevo: EstadoLimites = {
    ...estado,
    planes: [...estado.planes, { id: 'nuevo', desbloqueado: false, activos: 0 }],
  };
  const libres = lugaresLibres(conPlanNuevo);
  return { limite: limiteTotal(conPlanNuevo), alcanzado: libres === 0, libres };
}

/**
 * ¿Se puede reanudar este hábito en pausa? Uno de un plan activo necesita lugar en su plan y en el
 * cupo total; uno propio, solo en el cupo. `plan` dice que el que se llenó es su plan.
 */
export async function cupoReanudar(
  userId: string,
  habitId: string,
): Promise<CupoHabitos & { plan: boolean }> {
  const db = await getDb();
  const [habito] = await leerFilas<{ plan_id: string | null }>(db, 'habits', 'id = ?', [habitId]);
  const estado = await leerEstadoLimites(db, userId);
  const plan = estado.planes.find((p) => p.id === habito?.plan_id);
  if (plan) {
    const tope = limiteDelPlan(plan, (await leerConfigProgresion(db)).limite_habitos_plan);
    if (!cabe(plan.activos, tope)) return { limite: tope, alcanzado: true, plan: true };
  }
  return { ...cupoTotal(estado), plan: false };
}
