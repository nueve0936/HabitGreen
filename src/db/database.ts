import * as SQLite from 'expo-sqlite';

import { accionDueno } from '@/sync/domain/dueno-base';

import {
  aValoresLocales,
  desdeValoresLocales,
  sqlTablasEspejo,
  sqlUpsert,
  SQL_TABLAS_PROPIAS,
  TABLAS,
  tablaLocal,
  valorLocal,
  type NombreTabla,
  type TablaLocal,
} from './local-schema';

// Base de datos local (SDD 3.4). Se abre una sola vez y la comparten todos los repositorios.
//
// Las tablas espejo son una caché del servidor: si cambia su forma (ESQUEMA_VERSION), se borran
// y se vuelven a descargar completas en la siguiente sincronización. La cola de salida (outbox)
// no se borra, para no perder lo que se hizo sin conexión.

const NOMBRE = 'habitgreen.db';
// 3: se agrega onboarding_answers (Entrega 5). 4: habits.nivel_desde (Entrega 8).
// 5: user_settings.subidas_plan. 6: user_accessories.categorias_equipadas (pulidos antes del APK).
// 7: plans.area, respuestas, ultima_evaluacion y limite_desbloqueado (un plan por área).
const ESQUEMA_VERSION = 7;

let abierta: Promise<SQLite.SQLiteDatabase> | null = null;

async function prepararEsquema(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;
  if (version === ESQUEMA_VERSION) return;

  await db.execAsync("PRAGMA journal_mode = 'wal';");
  await enTransaccion(db, async () => {
    for (const tabla of TABLAS) await db.execAsync(`DROP TABLE IF EXISTS ${tabla.nombre};`);
    await db.execAsync('DROP TABLE IF EXISTS sync_state;');
    await db.execAsync(sqlTablasEspejo());
    await db.execAsync(SQL_TABLAS_PROPIAS);
  });
  await db.execAsync(`PRAGMA user_version = ${ESQUEMA_VERSION}`);
}

// expo-sqlite no admite dos transacciones a la vez en la misma conexión: la segunda falla con
// «cannot start a transaction within a transaction». Pasa al volver a la app, cuando la
// sincronización escribe justo cuando la persona guarda un hábito. Por eso todas las transacciones
// de la app esperan su turno aquí. Dentro de una transacción no se abre otra (se trabaría).
let turno: Promise<unknown> = Promise.resolve();

export function enTransaccion(
  db: SQLite.SQLiteDatabase,
  tarea: () => Promise<void>,
): Promise<void> {
  const esta = turno.then(() => db.withTransactionAsync(tarea));
  turno = esta.catch(() => {});
  return esta;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  abierta ??= SQLite.openDatabaseAsync(NOMBRE).then(async (db) => {
    await prepararEsquema(db);
    return db;
  });
  // Si falla al abrir, el siguiente intento vuelve a probar en vez de quedarse con el error.
  abierta.catch(() => {
    abierta = null;
  });
  return abierta;
}

/** Guarda filas (del servidor o armadas por la app) en su tabla espejo. */
export async function guardarFilas(
  db: SQLite.SQLiteDatabase,
  destino: NombreTabla | TablaLocal,
  filas: readonly Record<string, unknown>[],
): Promise<void> {
  const tabla = typeof destino === 'string' ? tablaLocal(destino) : destino;
  const sql = sqlUpsert(tabla);
  for (const fila of filas) await db.runAsync(sql, aValoresLocales(tabla, fila));
}

/** Cambia algunas columnas de una fila local, buscándola por su clave primaria. */
export async function actualizarFila(
  db: SQLite.SQLiteDatabase,
  nombre: NombreTabla,
  clave: Record<string, string>,
  cambios: Record<string, unknown>,
): Promise<void> {
  const tabla = tablaLocal(nombre);
  const columnas = Object.keys(cambios).filter((c) => c in tabla.columnas);
  const asignaciones = columnas.map((c) => `${c} = ?`).join(', ');
  const condicion = tabla.clave.map((c) => `${c} = ?`).join(' AND ');
  await db.runAsync(`UPDATE ${tabla.nombre} SET ${asignaciones} WHERE ${condicion}`, [
    ...columnas.map((c) => valorLocal(tabla.columnas[c] ?? 'texto', cambios[c])),
    ...tabla.clave.map((c) => clave[c] ?? ''),
  ]);
}

/** Lee filas de una tabla espejo con los booleanos y el JSON ya convertidos. */
export async function leerFilas<T>(
  db: SQLite.SQLiteDatabase,
  nombre: NombreTabla,
  donde = '1 = 1',
  parametros: (string | number)[] = [],
): Promise<T[]> {
  const tabla = tablaLocal(nombre);
  const filas = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM ${tabla.nombre} WHERE ${donde}`,
    parametros,
  );
  return filas.map((f) => desdeValoresLocales<T>(tabla, f));
}

/** Borra todos los datos locales: al cerrar sesión o si entra otra cuenta en el teléfono. */
export async function vaciarBaseLocal(): Promise<void> {
  const db = await getDb();
  await enTransaccion(db, async () => {
    for (const tabla of TABLAS) await db.runAsync(`DELETE FROM ${tabla.nombre}`);
    await db.runAsync('DELETE FROM outbox');
    await db.runAsync('DELETE FROM sync_state');
    await db.runAsync('DELETE FROM progresion_tarjetas');
  });
}

// Fila de sync_state donde se anota de qué cuenta son los datos locales.
const DUENO = '__usuario';

/**
 * Deja la base local lista para `userId`: si era de otra cuenta, la vacía (SDD 3.4). Se llama al
 * entrar, antes de mostrar las pestañas, y en cada sincronización. Devuelve true si la vació.
 */
export async function asegurarDuenoBaseLocal(userId: string): Promise<boolean> {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ cursor: string }>(
    'SELECT cursor FROM sync_state WHERE tabla = ?',
    [DUENO],
  );
  const accion = accionDueno(fila?.cursor ?? null, userId);
  if (accion === 'mantener') return false;
  if (accion === 'vaciar') await vaciarBaseLocal();
  await db.runAsync('INSERT OR REPLACE INTO sync_state (tabla, cursor) VALUES (?, ?)', [
    DUENO,
    userId,
  ]);
  return accion === 'vaciar';
}
