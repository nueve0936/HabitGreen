import type { SQLiteDatabase } from 'expo-sqlite';

import type { EntradaOutbox, OperacionOutbox } from '@/sync/domain/sync-rules';

// Cola de salida (SDD 3.4): cada cambio local se guarda aquí en la misma transacción que la fila,
// y la sincronización lo envía en orden cuando hay red.

type FilaOutbox = {
  id: number;
  operacion: OperacionOutbox['operacion'];
  tabla: OperacionOutbox['tabla'];
  clave: string;
  payload: string;
  intentos: number;
};

export async function encolar(db: SQLiteDatabase, operacion: OperacionOutbox): Promise<void> {
  await db.runAsync(
    'INSERT INTO outbox (operacion, tabla, clave, payload, creado_en) VALUES (?, ?, ?, ?, ?)',
    [
      operacion.operacion,
      operacion.tabla,
      operacion.clave,
      JSON.stringify(operacion.payload),
      new Date().toISOString(),
    ],
  );
}

export async function leerOutbox(db: SQLiteDatabase): Promise<EntradaOutbox[]> {
  const filas = await db.getAllAsync<FilaOutbox>(
    'SELECT id, operacion, tabla, clave, payload, intentos FROM outbox ORDER BY id',
  );
  return filas.map((f) => ({ ...f, payload: JSON.parse(f.payload) }) as EntradaOutbox);
}

export async function quitarDeOutbox(db: SQLiteDatabase, ids: readonly number[]): Promise<void> {
  for (const id of ids) await db.runAsync('DELETE FROM outbox WHERE id = ?', [id]);
}

export async function sumarIntento(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE outbox SET intentos = intentos + 1 WHERE id = ?', [id]);
}
