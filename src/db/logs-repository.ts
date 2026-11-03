import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  aplicarCompletar,
  aplicarDeshacer,
  RECOMPENSAS_POR_DEFECTO,
  type ConfigRecompensas,
  type EstadoDia,
  type LogDelDia,
  type Planta,
} from '@/features/rewards/domain/recompensas';
import { fechaLocal } from '@/lib/dates';
import { pedirSincronizacion } from '@/sync/sync-engine';

import { actualizarFila, getDb, guardarFilas, leerFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { encolar } from './outbox';

// Check-ins (habit_logs) con sus recompensas (SDD 6.1). Se marcan y se deshacen solo para hoy
// (definición 6). En el teléfono se calcula al momento lo mismo que hará el servidor (XP de la
// planta, monedas y topes) y se guarda junto con la operación en la cola; al sincronizar, las
// RPC complete_habit y uncomplete_habit deciden y sus valores reemplazan a los locales.

type HabitoCheck = { id: string; category_id: string };

export type ResultadoCheckIn = {
  /** Monedas que dio. Al completar, 0 significa que ya se llegó al tope del día. */
  monedas: number;
  /** Fase nueva de la planta, si cambió. */
  cambioFase: number | null;
};

function revisarQueSeaHoy(fecha: string): void {
  if (fecha !== fechaLocal()) throw new Error('Solo se puede marcar el hábito de hoy');
}

async function leerConfig(db: SQLiteDatabase): Promise<ConfigRecompensas> {
  const [fila] = await leerFilas<{ valor: Partial<ConfigRecompensas> }>(
    db,
    'app_config',
    "clave = 'recompensas'",
  );
  return { ...RECOMPENSAS_POR_DEFECTO, ...fila?.valor };
}

async function leerEstado(
  db: SQLiteDatabase,
  userId: string,
  categoryId: string,
  fecha: string,
): Promise<EstadoDia> {
  const planta = await db.getFirstAsync<Planta>(
    'SELECT xp, nivel, fase FROM plant_progress WHERE user_id = ? AND category_id = ?',
    [userId, categoryId],
  );
  const monedero = await db.getFirstAsync<{ saldo: number }>(
    'SELECT saldo FROM wallets WHERE user_id = ?',
    [userId],
  );
  const logs = await leerFilas<LogDelDia>(
    db,
    'habit_logs',
    'user_id = ? AND fecha = ? AND eliminado_en IS NULL',
    [userId, fecha],
  );
  return { planta: planta ?? { xp: 0, nivel: 0, fase: 1 }, saldo: monedero?.saldo ?? 0, logs };
}

async function guardarPlantaYSaldo(
  db: SQLiteDatabase,
  userId: string,
  categoryId: string,
  estado: EstadoDia,
  ahora: string,
): Promise<void> {
  await guardarFilas(db, 'plant_progress', [
    { user_id: userId, category_id: categoryId, ...estado.planta, updated_at: ahora },
  ]);
  await guardarFilas(db, 'wallets', [{ user_id: userId, saldo: estado.saldo, updated_at: ahora }]);
}

export async function completarHabito(
  userId: string,
  habito: HabitoCheck,
  fecha: string,
): Promise<ResultadoCheckIn | null> {
  revisarQueSeaHoy(fecha);
  const db = await getDb();
  // null: ya estaba completado (por ejemplo, un doble toque) y no cambió nada.
  let resultado: ResultadoCheckIn | null = null;
  await db.withTransactionAsync(async () => {
    const estado = await leerEstado(db, userId, habito.category_id, fecha);
    if (estado.logs.some((l) => l.habit_id === habito.id)) return;

    // Si ya hubo un registro ese día (marcado y deshecho), se reutiliza su id.
    const previo = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM habit_logs WHERE habit_id = ? AND fecha = ?',
      [habito.id, fecha],
    );
    const ahora = new Date().toISOString();
    const nuevo: LogDelDia = {
      id: previo?.id ?? randomUUID(),
      habit_id: habito.id,
      category_id: habito.category_id,
      completado_en: ahora,
      xp_otorgado: false,
      monedas_otorgadas: false,
    };
    const r = aplicarCompletar(estado, nuevo, await leerConfig(db));
    const guardado = r.estado.logs.find((l) => l.habit_id === habito.id) ?? nuevo;

    await guardarFilas(db, 'habit_logs', [
      {
        ...guardado,
        user_id: userId,
        fecha,
        estado: 'hecho',
        updated_at: ahora,
        eliminado_en: null,
      },
    ]);
    await guardarPlantaYSaldo(db, userId, habito.category_id, r.estado, ahora);
    await encolar(db, {
      operacion: 'complete',
      tabla: 'habit_logs',
      clave: `${habito.id}|${fecha}`,
      payload: { log_id: nuevo.id, habit_id: habito.id, fecha },
    });
    resultado = { monedas: r.estado.saldo - estado.saldo, cambioFase: r.cambioFase };
  });
  avisarCambioLocal();
  pedirSincronizacion();
  return resultado;
}

export async function deshacerHabito(
  userId: string,
  habito: HabitoCheck,
  fecha: string,
): Promise<void> {
  revisarQueSeaHoy(fecha);
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    const estado = await leerEstado(db, userId, habito.category_id, fecha);
    const r = aplicarDeshacer(estado, habito.id, await leerConfig(db));
    const ahora = new Date().toISOString();

    await actualizarFila(
      db,
      'habit_logs',
      { habit_id: habito.id, fecha },
      { eliminado_en: ahora, updated_at: ahora, xp_otorgado: false, monedas_otorgadas: false },
    );
    // Otros registros del día que recibieron el XP o las monedas que se liberaron.
    for (const log of r.estado.logs) {
      const antes = estado.logs.find((l) => l.id === log.id);
      if (
        antes &&
        (antes.xp_otorgado !== log.xp_otorgado || antes.monedas_otorgadas !== log.monedas_otorgadas)
      ) {
        await actualizarFila(
          db,
          'habit_logs',
          { habit_id: log.habit_id, fecha },
          { xp_otorgado: log.xp_otorgado, monedas_otorgadas: log.monedas_otorgadas },
        );
      }
    }
    await guardarPlantaYSaldo(db, userId, habito.category_id, r.estado, ahora);
    await encolar(db, {
      operacion: 'uncomplete',
      tabla: 'habit_logs',
      clave: `${habito.id}|${fecha}`,
      payload: { habit_id: habito.id, fecha },
    });
  });
  avisarCambioLocal();
  pedirSincronizacion();
}
