import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  Habito,
  Horario,
  Ocurrencia,
  Registro,
} from '@/features/habits/domain/habitos-del-dia';
import {
  DIAS_ADELANTE,
  DIAS_ATRAS,
  propuestasDeReprogramacion,
  type Propuesta,
} from '@/features/reschedule/domain/reprogramar';
import { diaIso, fechaLocal, sumarDias } from '@/lib/dates';
import type { OperacionOutbox } from '@/sync/domain/sync-rules';

import { aplicar } from './aplicar-cambio';
import { guardarFilas, getDb, leerFilas } from './database';
import { leerAjustesEn } from './settings-repository';

// Reprogramación (SDD 6.2): qué ofrecer mover al abrir la app y cómo se guarda la decisión en
// `habit_occurrences`. Todo en SQLite, así que funciona sin conexión.

export type Reprogramacion = {
  propuestas: Propuesta[];
  /** Con `desanimo` se mueve solo y únicamente se muestra un aviso suave. */
  silenciosa: boolean;
};

/** Propuestas de hoy, o ninguna si todavía no llegan los ajustes. */
export async function leerReprogramacion(userId: string): Promise<Reprogramacion> {
  const db = await getDb();
  const ajustes = await leerAjustesEn(db, userId);
  if (!ajustes) return { propuestas: [], silenciosa: false };
  const hoy = fechaLocal();
  const desde = sumarDias(hoy, -DIAS_ATRAS);
  const hasta = sumarDias(hoy, DIAS_ADELANTE);
  const [habitos, horarios, ocurrencias, registros] = await Promise.all([
    leerFilas<Habito>(db, 'habits', 'archivado_en IS NULL'),
    leerFilas<Horario>(db, 'habit_schedules'),
    leerFilas<Ocurrencia>(
      db,
      'habit_occurrences',
      '(fecha_original BETWEEN ? AND ?) OR (fecha_nueva BETWEEN ? AND ?)',
      [desde, hasta, desde, hasta],
    ),
    leerFilas<Registro>(db, 'habit_logs', 'fecha BETWEEN ? AND ?', [desde, hoy]),
  ]);
  return {
    propuestas: propuestasDeReprogramacion(
      { habitos, horarios, ocurrencias, registros, presupuesto: ajustes.presupuestoMin },
      hoy,
    ),
    silenciosa: ajustes.estrategias.includes('desanimo'),
  };
}

type FilaOcurrencia = {
  id: string;
  habit_id: string;
  user_id: string;
  fecha_original: string;
  fecha_nueva: string | null;
  estado: 'movida' | 'descartada';
};

/** Guarda las ocurrencias y devuelve sus operaciones de la cola. */
async function guardarOcurrencias(
  db: SQLiteDatabase,
  filas: readonly FilaOcurrencia[],
): Promise<OperacionOutbox[]> {
  const ahora = new Date().toISOString();
  await guardarFilas(
    db,
    'habit_occurrences',
    filas.map((f) => ({ ...f, creado_en: ahora, updated_at: ahora })),
  );
  return filas.map((f) => ({
    operacion: 'upsert',
    tabla: 'habit_occurrences',
    clave: f.id,
    payload: f,
  }));
}

/** Los días anteriores sin hacer del mismo hábito se dejan pasar: quedan «descartada». */
function filasDe(
  userId: string,
  propuesta: Propuesta,
  fechaNueva: string | null,
): FilaOcurrencia[] {
  const fila = (fecha_original: string, fecha_nueva: string | null): FilaOcurrencia => ({
    id: randomUUID(),
    habit_id: propuesta.habito.id,
    user_id: userId,
    fecha_original,
    fecha_nueva,
    estado: fecha_nueva === null ? 'descartada' : 'movida',
  });
  return [
    ...propuesta.anteriores.map((fecha) => fila(fecha, null)),
    fila(propuesta.fechaOriginal, fechaNueva),
  ];
}

/** Mueve el hábito a `fecha` (un día libre). */
export function moverOcurrencia(userId: string, propuesta: Propuesta, fecha: string) {
  return aplicar((db) => guardarOcurrencias(db, filasDe(userId, propuesta, fecha)));
}

/** «Dejarlo» o «La dejamos para la próxima»: no se vuelve a ofrecer. */
export function descartarOcurrencia(userId: string, propuesta: Propuesta) {
  return aplicar((db) => guardarOcurrencias(db, filasDe(userId, propuesta, null)));
}

/**
 * Con `desanimo`: mueve cada propuesta a su día, o la descarta si no hay ninguno, en una sola
 * escritura. Devuelve las que se movieron, para el aviso suave.
 */
export async function reprogramarEnSilencio(
  userId: string,
  propuestas: readonly Propuesta[],
): Promise<Propuesta[]> {
  await aplicar((db) =>
    guardarOcurrencias(
      db,
      propuestas.flatMap((p) => filasDe(userId, p, p.diaPropuesto)),
    ),
  );
  return propuestas.filter((p) => p.diaPropuesto !== null);
}

/**
 * Al editar el horario: una ocurrencia movida pendiente cuya fecha nueva ahora es de su patrón ya
 * no hace falta (ese día tiene la ocurrencia normal), así que queda «descartada» (SDD 6.2).
 */
export async function descartarMovidasDelPatron(
  db: SQLiteDatabase,
  habitId: string,
  diasSemana: readonly number[],
): Promise<OperacionOutbox[]> {
  const movidas = await leerFilas<FilaOcurrencia>(
    db,
    'habit_occurrences',
    "habit_id = ? AND estado = 'movida' AND fecha_nueva >= ?",
    [habitId, fechaLocal()],
  );
  const chocan = movidas.filter((o) => o.fecha_nueva && diasSemana.includes(diaIso(o.fecha_nueva)));
  return guardarOcurrencias(
    db,
    chocan.map((o) => ({
      id: o.id,
      habit_id: o.habit_id,
      user_id: o.user_id,
      fecha_original: o.fecha_original,
      fecha_nueva: null,
      estado: 'descartada',
    })),
  );
}
