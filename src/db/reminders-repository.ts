import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';
import type { DatosAvisos } from '@/features/reminders/domain/planificar-avisos';
import { historialDelPlan } from '@/features/reminders/domain/historial-plan';
import {
  semanaDeApoyoEnPlanes,
  type PlanApoyo,
  type SemanaApoyo,
} from '@/features/reminders/domain/semana-apoyo';
import { fechaLocal, sumarDias } from '@/lib/dates';
import { MOMENTOS, type Momento } from '@/schemas/onboarding';

import { getDb, leerFilas } from './database';
import { leerAjustesEn, leerConfigAvisos } from './settings-repository';

// Lo que necesitan los avisos (SDD 7.1), leído de SQLite: funciona sin conexión.

type Contexto = { momento: Momento | null; planes: PlanApoyo[] };

/**
 * P5 (global) y, de cada plan activo, su historial (P3) y su inicio. Sin formulario ni planes:
 * momento null y sin planes.
 */
async function leerContexto(db: SQLiteDatabase, userId: string): Promise<Contexto> {
  const [respuestas] = await leerFilas<{ respuestas: Record<string, unknown> | null }>(
    db,
    'onboarding_answers',
    'user_id = ?',
    [userId],
  );
  const planes = await leerFilas<{ creado_en: string | null; respuestas: unknown }>(
    db,
    'plans',
    'user_id = ? AND activo = 1 ORDER BY creado_en',
    [userId],
  );
  const momento = respuestas?.respuestas?.momento;
  const historialGlobal = respuestas?.respuestas?.historial;
  return {
    momento: (MOMENTOS as readonly unknown[]).includes(momento) ? (momento as Momento) : null,
    planes: planes.flatMap((p) =>
      p.creado_en
        ? [
            {
              historial: historialDelPlan(p.respuestas, historialGlobal),
              inicioPlan: fechaLocal(new Date(p.creado_en)),
            },
          ]
        : [],
    ),
  };
}

/** Todo lo que necesita `planificarAvisos`, o null si todavía no llegan los ajustes. */
export async function leerDatosAvisos(userId: string): Promise<DatosAvisos | null> {
  const db = await getDb();
  const ajustes = await leerAjustesEn(db, userId);
  if (!ajustes) return null;
  const hoy = fechaLocal();
  const [config, contexto, habitos, horarios, ocurrencias, registros] = await Promise.all([
    leerConfigAvisos(db),
    leerContexto(db, userId),
    leerFilas<Habito>(db, 'habits', 'archivado_en IS NULL'),
    leerFilas<Horario>(db, 'habit_schedules'),
    leerFilas<Ocurrencia>(db, 'habit_occurrences', 'fecha_original >= ? OR fecha_nueva >= ?', [
      hoy,
      hoy,
    ]),
    // Solo pueden estar hechos los de hoy (y mañana, si el reloj se adelantó).
    leerFilas<Registro>(db, 'habit_logs', 'fecha IN (?, ?)', [hoy, sumarDias(hoy, 1)]),
  ]);
  return {
    estilo: ajustes.estilo,
    estrategias: ajustes.estrategias,
    segundoAviso: ajustes.segundoAviso,
    horas: ajustes.horas,
    config,
    ...contexto,
    habitos,
    horarios,
    ocurrencias,
    registros,
  };
}

/** Semana de apoyo que toca hoy (3 o 4), para el mensaje en Hoy. */
export async function leerSemanaApoyo(userId: string): Promise<SemanaApoyo | null> {
  const db = await getDb();
  const { planes } = await leerContexto(db, userId);
  return semanaDeApoyoEnPlanes(planes, fechaLocal());
}
