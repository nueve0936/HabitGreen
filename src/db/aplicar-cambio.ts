import type { SQLiteDatabase } from 'expo-sqlite';

import type { OperacionOutbox } from '@/sync/domain/sync-rules';
import { pedirSincronizacion } from '@/sync/sync-engine';

import { enTransaccion, getDb } from './database';
import { avisarCambioLocal } from './db-version-store';
import { encolar } from './outbox';

/**
 * Escribe filas locales y sus operaciones de la cola juntas (una transacción), y avisa a la UI y a
 * la sincronización. `pasos` guarda las filas y devuelve las operaciones a encolar.
 */
export async function aplicar(
  pasos: (db: SQLiteDatabase) => Promise<OperacionOutbox[]>,
): Promise<void> {
  const db = await getDb();
  await enTransaccion(db, async () => {
    for (const operacion of await pasos(db)) await encolar(db, operacion);
  });
  avisarCambioLocal();
  pedirSincronizacion();
}
