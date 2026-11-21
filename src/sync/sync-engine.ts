import type { SQLiteDatabase } from 'expo-sqlite';
import * as Network from 'expo-network';

import { avisarCambioLocal } from '@/db/db-version-store';
import { asegurarDuenoBaseLocal, enTransaccion, getDb, guardarFilas } from '@/db/database';
import { claveDeFila, TABLAS, tablaLocal, type TablaLocal } from '@/db/local-schema';
import { leerOutbox, quitarDeOutbox, sumarIntento } from '@/db/outbox';
import { fechaLocal, sumarDias } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { deviceTimeZone } from '@/lib/time-zone';

import {
  clavesPendientes,
  esRechazoDefinitivo,
  filasAplicables,
  idsCompactables,
  siguienteCursor,
  type EntradaOutbox,
} from './domain/sync-rules';
import { useSyncStore } from './sync-store';

// Sincronización con Supabase (SDD 3.4). Cada vuelta:
//   0. Sale si no hay red o no se pudo renovar el token.
//   1. Comprueba que la base local sea de este usuario (si no, la vacía).
//   2. Actualiza la zona horaria del perfil, para que «hoy» nunca llegue como fecha futura.
//   3. Sube la cola de salida en orden. Un rechazo del servidor descarta la operación y
//      refresca esa fila; un error de red detiene la cola hasta la próxima vuelta.
//   4. Descarga lo que cambió desde el último cursor de cada tabla (la primera vez, todo).
// Solo corre una vuelta a la vez; si se pide otra mientras tanto, se hace al terminar.

const PAGINA = 1000;
const DIAS_DE_HISTORIAL = 365;

let usuario: string | null = null;
let enCurso: Promise<void> | null = null;
let otraVuelta = false;
let temporizador: ReturnType<typeof setTimeout> | null = null;

/** Activa la sincronización para el usuario con sesión (o la apaga con null). */
export function configurarSync(userId: string | null): void {
  usuario = userId;
}

/** Sincroniza en cuanto se pueda, agrupando las peticiones seguidas (por ejemplo, varios checks). */
export function pedirSincronizacion(): void {
  if (temporizador) clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    temporizador = null;
    void sincronizarAhora();
  }, 400);
}

export function sincronizarAhora(): Promise<void> {
  if (enCurso) {
    otraVuelta = true;
    return enCurso;
  }
  enCurso = (async () => {
    do {
      otraVuelta = false;
      if (usuario === null) return;
      await unaVuelta(usuario);
    } while (otraVuelta);
  })().finally(() => {
    enCurso = null;
  });
  return enCurso;
}

class SinRed extends Error {}

async function hayRed(): Promise<boolean> {
  try {
    const estado = await Network.getNetworkStateAsync();
    return estado.isConnected !== false && estado.isInternetReachable !== false;
  } catch {
    return true;
  }
}

/**
 * getSession renueva el token si venció. Si no se pudo (sin red de verdad), no se envía nada:
 * sin token el servidor rechazaría las operaciones y se descartarían de la cola.
 */
async function hayTokenValido(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session !== null;
  } catch {
    return false;
  }
}

async function unaVuelta(userId: string): Promise<void> {
  const db = await getDb();
  // Si la base era de otra cuenta y se vació, las pantallas se actualizan ya, sin esperar la vuelta.
  if (await asegurarDuenoBaseLocal(userId)) avisarCambioLocal();
  if (!(await hayRed())) return;
  if (!(await hayTokenValido())) return;

  useSyncStore.setState({ sincronizando: true });
  try {
    await actualizarZonaHoraria(db, userId);
    await subirOutbox(db);
    await descargar(db);
    useSyncStore.setState({ ultima: new Date().toISOString(), error: null });
  } catch (error) {
    // Sin red no es un error: la cola espera a la próxima vuelta.
    const mensaje =
      error instanceof SinRed ? null : error instanceof Error ? error.message : String(error);
    if (mensaje) console.warn('[sync]', mensaje);
    useSyncStore.setState({ error: mensaje });
  } finally {
    useSyncStore.setState({ sincronizando: false });
    avisarCambioLocal();
  }
}

/** Lanza SinRed si la petición no llegó al servidor, o el error si el servidor respondió con uno. */
function revisar(error: { message: string; code?: string | null } | null): void {
  if (!error) return;
  if (!esRechazoDefinitivo(error)) throw new SinRed(error.message);
  throw new Error(`${error.code}: ${error.message}`);
}

async function actualizarZonaHoraria(db: SQLiteDatabase, userId: string): Promise<void> {
  const zona = deviceTimeZone();
  const perfil = await db.getFirstAsync<{ zona_horaria: string }>(
    'SELECT zona_horaria FROM profiles WHERE id = ?',
    [userId],
  );
  if (perfil?.zona_horaria === zona) return;
  const { data, error } = await supabase
    .from('profiles')
    .update({ zona_horaria: zona })
    .eq('id', userId)
    .select(columnas(tablaLocal('profiles')))
    .single<Record<string, unknown>>();
  revisar(error);
  if (data) await guardarFilas(db, 'profiles', [data]);
}

async function enviar(entrada: EntradaOutbox) {
  switch (entrada.operacion) {
    case 'upsert':
      return (await supabase.from(entrada.tabla).upsert(entrada.payload)).error;
    case 'update':
      return (
        await supabase
          .from(entrada.tabla)
          .update(entrada.payload)
          .match(claveComoFiltro(tablaLocal(entrada.tabla), entrada.clave))
      ).error;
    case 'archive':
      return (
        await supabase.rpc('archivar_habito', {
          p_habit_id: entrada.payload.habit_id,
          p_fecha: entrada.payload.fecha,
        })
      ).error;
    case 'complete':
      return (
        await supabase.rpc('complete_habit', {
          p_log_id: entrada.payload.log_id,
          p_habit_id: entrada.payload.habit_id,
          p_fecha: entrada.payload.fecha,
        })
      ).error;
    case 'uncomplete':
      return (
        await supabase.rpc('uncomplete_habit', {
          p_habit_id: entrada.payload.habit_id,
          p_fecha: entrada.payload.fecha,
        })
      ).error;
  }
}

async function subirOutbox(db: SQLiteDatabase): Promise<void> {
  let cola = await leerOutbox(db);
  const compactables = idsCompactables(cola);
  if (compactables.length > 0) {
    await quitarDeOutbox(db, compactables);
    cola = cola.filter((e) => !compactables.includes(e.id));
  }

  for (const entrada of cola) {
    const error = await enviar(entrada);
    if (!error) {
      await quitarDeOutbox(db, [entrada.id]);
    } else if (esRechazoDefinitivo(error)) {
      console.warn(
        '[sync] operación rechazada',
        entrada.operacion,
        entrada.tabla,
        error.code,
        error.message,
      );
      await quitarDeOutbox(db, [entrada.id]);
      await refrescarFila(db, entrada);
      if (entrada.operacion !== 'upsert' && entrada.operacion !== 'update') {
        await refrescarRecompensas(db);
      }
    } else {
      await sumarIntento(db, entrada.id);
      throw new SinRed(error.message);
    }
  }
}

/** outbox.clave ("valor1|valor2") como filtro { columna: valor } de la clave primaria. */
function claveComoFiltro(tabla: TablaLocal, clave: string): Record<string, string> {
  const valores = clave.split('|');
  return Object.fromEntries(tabla.clave.map((columna, i) => [columna, valores[i] ?? '']));
}

/** Después de un rechazo, la fila local vuelve a quedar como está en el servidor. */
async function refrescarFila(db: SQLiteDatabase, entrada: EntradaOutbox): Promise<void> {
  const tabla = tablaLocal(entrada.tabla);
  const valores = entrada.clave.split('|');
  const { data, error } = await supabase
    .from(tabla.nombre)
    .select(columnas(tabla))
    .match(claveComoFiltro(tabla, entrada.clave))
    .maybeSingle<Record<string, unknown>>();
  revisar(error);
  if (data) {
    await guardarFilas(db, entrada.tabla, [data]);
  } else {
    const condicion = tabla.clave.map((c) => `${c} = ?`).join(' AND ');
    await db.runAsync(`DELETE FROM ${tabla.nombre} WHERE ${condicion}`, valores);
  }
}

/**
 * Tras rechazar un check-in, el saldo y las plantas locales pueden traer un cálculo optimista que
 * el servidor nunca aplicó; como no cambiaron allá, la descarga incremental no los corregiría.
 */
async function refrescarRecompensas(db: SQLiteDatabase): Promise<void> {
  for (const nombre of ['wallets', 'plant_progress'] as const) {
    const tabla = tablaLocal(nombre);
    const { data, error } = await supabase
      .from(nombre)
      .select(columnas(tabla))
      .returns<Record<string, unknown>[]>();
    revisar(error);
    if (data) await guardarFilas(db, nombre, data);
  }
}

function columnas(tabla: TablaLocal): string {
  return Object.keys(tabla.columnas).join(', ');
}

async function descargar(db: SQLiteDatabase): Promise<void> {
  const pendientes = clavesPendientes(await leerOutbox(db));

  for (const tabla of TABLAS as readonly TablaLocal[]) {
    const guardado = await db.getFirstAsync<{ cursor: string | null }>(
      'SELECT cursor FROM sync_state WHERE tabla = ?',
      [tabla.nombre],
    );
    const cursor = guardado?.cursor ?? null;
    let nuevoCursor = cursor;

    for (let desde = 0; ; desde += PAGINA) {
      let consulta = supabase
        .from(tabla.nombre)
        .select(columnas(tabla))
        .order('updated_at')
        .order(tabla.clave[0])
        .range(desde, desde + PAGINA - 1);
      if (cursor !== null) {
        consulta = consulta.gt('updated_at', cursor);
      } else if (tabla.filtroFecha) {
        consulta = consulta.gte(tabla.filtroFecha, sumarDias(fechaLocal(), -DIAS_DE_HISTORIAL));
      }
      const { data, error } = await consulta.returns<Record<string, unknown>[]>();
      revisar(error);
      const filas = data ?? [];

      const aplicables = filasAplicables(
        tabla.nombre,
        filas,
        (f) => claveDeFila(tabla, f),
        pendientes,
      );
      await enTransaccion(db, () => guardarFilas(db, tabla, aplicables));
      nuevoCursor = siguienteCursor(nuevoCursor, filas);
      if (filas.length < PAGINA) break;
    }

    if (nuevoCursor !== cursor) {
      await db.runAsync('INSERT OR REPLACE INTO sync_state (tabla, cursor) VALUES (?, ?)', [
        tabla.nombre,
        nuevoCursor,
      ]);
    }
  }
}
