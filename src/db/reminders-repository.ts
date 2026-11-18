import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';
import type { DatosAvisos } from '@/features/reminders/domain/planificar-avisos';
import { semanaDeApoyo, type SemanaApoyo } from '@/features/reminders/domain/semana-apoyo';
import { fechaLocal, sumarDias } from '@/lib/dates';
import { HISTORIALES, MOMENTOS, type Historial, type Momento } from '@/schemas/onboarding';

import { getDb, leerFilas } from './database';
import { leerAjustesEn, leerConfigAvisos } from './settings-repository';

// Lo que necesitan los avisos (SDD 7.1), leído de SQLite: funciona sin conexión.

type Contexto = { momento: Momento | null; historial: Historial | null; inicioPlan: string | null };

/** P5, P3 y la fecha del plan activo. En modo tradicional no hay formulario: todo es null. */
async function leerContexto(db: SQLiteDatabase, userId: string): Promise<Contexto> {
  const [respuestas] = await leerFilas<{ respuestas: Record<string, unknown> | null }>(
    db,
    'onboarding_answers',
    'user_id = ?',
    [userId],
  );
  const plan = await db.getFirstAsync<{ creado_en: string | null }>(
    'SELECT creado_en FROM plans WHERE user_id = ? AND activo = 1 ORDER BY creado_en DESC',
    [userId],
  );
  const momento = respuestas?.respuestas?.momento;
  const historial = respuestas?.respuestas?.historial;
  return {
    momento: (MOMENTOS as readonly unknown[]).includes(momento) ? (momento as Momento) : null,
    historial: (HISTORIALES as readonly unknown[]).includes(historial)
      ? (historial as Historial)
      : null,
    inicioPlan: plan?.creado_en ? fechaLocal(new Date(plan.creado_en)) : null,
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
  const { historial, inicioPlan } = await leerContexto(db, userId);
  return semanaDeApoyo(historial, inicioPlan, fechaLocal());
}
