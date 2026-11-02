import * as SQLite from 'expo-sqlite';

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
const ESQUEMA_VERSION = 1;

let abierta: Promise<SQLite.SQLiteDatabase> | null = null;

async function prepararEsquema(db: SQLite.SQLiteDatabase): Promise<void> {
  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;
  if (version === ESQUEMA_VERSION) return;

  await db.execAsync("PRAGMA journal_mode = 'wal';");
  await db.withTransactionAsync(async () => {
    for (const tabla of TABLAS) await db.execAsync(`DROP TABLE IF EXISTS ${tabla.nombre};`);
    await db.execAsync('DROP TABLE IF EXISTS sync_state;');
    await db.execAsync(sqlTablasEspejo());
    await db.execAsync(SQL_TABLAS_PROPIAS);
  });
  await db.execAsync(`PRAGMA user_version = ${ESQUEMA_VERSION}`);
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
  await db.withTransactionAsync(async () => {
    for (const tabla of TABLAS) await db.runAsync(`DELETE FROM ${tabla.nombre}`);
    await db.runAsync('DELETE FROM outbox');
    await db.runAsync('DELETE FROM sync_state');
  });
}
