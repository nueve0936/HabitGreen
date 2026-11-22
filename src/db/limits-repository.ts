import type { SQLiteDatabase } from 'expo-sqlite';

import {
  cabe,
  type EstadoLimites,
  limiteDelPlan,
  limitePlanes,
  limitePropios,
} from '@/features/habits/domain/limite-habitos';

import { getDb, leerFilas } from './database';
import { leerConfigProgresion } from './settings-repository';

// Límites de hábitos y de planes leídos de SQLite (varios planes, fase 5). Las reglas están en
// `limite-habitos`; aquí solo se cuentan los planes y hábitos activos. Quien llama no bloquea si
// la lectura falla: el límite nunca debe impedir usar la app por un error.

export type CupoHabitos = { limite: number | null; alcanzado: boolean };

type EstadoLimitesLeido = EstadoLimites & { topePlan: number };

/**
 * Lo que necesitan los límites (fase 5, ver `limite-habitos`): planes activos con su desbloqueo y
 * sus hábitos activos, hábitos propios activos y subidas. Los pausados y archivados no cuentan.
 */
async function leerEstadoLimites(db: SQLiteDatabase, userId: string): Promise<EstadoLimitesLeido> {
  const planes = await leerFilas<{ id: string; limite_desbloqueado: boolean | null }>(
    db,
    'plans',
    'user_id = ? AND activo = 1',
    [userId],
  );
  const activos = await leerFilas<{ plan_id: string | null }>(
    db,
    'habits',
    'archivado_en IS NULL AND activo = 1',
  );
  const ajustes = await db.getFirstAsync<{ subidas_plan: number | null }>(
    'SELECT subidas_plan FROM user_settings WHERE user_id = ?',
    [userId],
  );
  const config = await leerConfigProgresion(db);
  return {
    planes: planes.map((p) => ({
      id: p.id,
      desbloqueado: p.limite_desbloqueado === true,
      activos: activos.filter((h) => h.plan_id === p.id).length,
    })),
    propiosActivos: activos.filter((h) => h.plan_id === null).length,
    subidas: ajustes?.subidas_plan ?? 0,
    topePlan: config.limite_habitos_plan,
  };
}

const cupo = (activos: number, limite: number | null): CupoHabitos => ({
  limite,
  alcanzado: !cabe(activos, limite),
});

/** ¿Cabe otro hábito propio? Sin planes activos, o con alguno desbloqueado, no hay límite. */
export async function cupoPropios(userId: string): Promise<CupoHabitos> {
  const estado = await leerEstadoLimites(await getDb(), userId);
  return cupo(estado.propiosActivos, limitePropios(estado));
}

/** ¿Puede crear otro plan? Empieza con 1 y gana otro con cada subida, hasta uno por área. */
export async function cupoPlanes(userId: string): Promise<CupoHabitos> {
  const estado = await leerEstadoLimites(await getDb(), userId);
  return cupo(estado.planes.length, limitePlanes(estado.subidas));
}

/**
 * ¿Se puede reanudar este hábito en pausa? Si es de un plan activo cuenta el tope de ese plan; si
 * es propio, el límite de los propios.
 */
export async function cupoReanudar(userId: string, habitId: string): Promise<CupoHabitos> {
  const db = await getDb();
  const [habito] = await leerFilas<{ plan_id: string | null }>(db, 'habits', 'id = ?', [habitId]);
  const estado = await leerEstadoLimites(db, userId);
  const plan = estado.planes.find((p) => p.id === habito?.plan_id);
  if (plan) return cupo(plan.activos, limiteDelPlan(plan, estado.topePlan));
  return cupo(estado.propiosActivos, limitePropios(estado));
}
