import { randomUUID } from 'expo-crypto';

import { fechaLocal } from '@/lib/dates';
import { pedirSincronizacion } from '@/sync/sync-engine';

import { actualizarFila, getDb, guardarFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { encolar } from './outbox';

// Check-ins (habit_logs). Se marcan y se deshacen solo para hoy (definición 6). La fila local se
// guarda al momento y la cola llama después a las RPC complete_habit y uncomplete_habit, que son
// la fuente de verdad (y desde la Entrega 4 dan las recompensas).

type HabitoCheck = { id: string; category_id: string };

function revisarQueSeaHoy(fecha: string): void {
  if (fecha !== fechaLocal()) throw new Error('Solo se puede marcar el hábito de hoy');
}

export async function completarHabito(
  userId: string,
  habito: HabitoCheck,
  fecha: string,
): Promise<void> {
  revisarQueSeaHoy(fecha);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    // Si ya hubo un registro ese día (marcado y deshecho), se reutiliza su id.
    const previo = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM habit_logs WHERE habit_id = ? AND fecha = ?',
      [habito.id, fecha],
    );
    const ahora = new Date().toISOString();
    const log = {
      id: previo?.id ?? randomUUID(),
      habit_id: habito.id,
      user_id: userId,
      category_id: habito.category_id,
      fecha,
      estado: 'hecho',
      completado_en: ahora,
      xp_otorgado: false,
      monedas_otorgadas: false,
      updated_at: ahora,
      eliminado_en: null,
    };
    await guardarFilas(db, 'habit_logs', [log]);
    await encolar(db, {
      operacion: 'complete',
      tabla: 'habit_logs',
      clave: `${habito.id}|${fecha}`,
      payload: { log_id: log.id, habit_id: habito.id, fecha },
    });
  });
  avisarCambioLocal();
  pedirSincronizacion();
}

export async function deshacerHabito(habitId: string, fecha: string): Promise<void> {
  revisarQueSeaHoy(fecha);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const ahora = new Date().toISOString();
    await actualizarFila(
      db,
      'habit_logs',
      { habit_id: habitId, fecha },
      { eliminado_en: ahora, updated_at: ahora },
    );
    await encolar(db, {
      operacion: 'uncomplete',
      tabla: 'habit_logs',
      clave: `${habitId}|${fecha}`,
      payload: { habit_id: habitId, fecha },
    });
  });
  avisarCambioLocal();
  pedirSincronizacion();
}
