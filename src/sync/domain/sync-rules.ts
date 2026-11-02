// Reglas puras de la sincronización (SDD 3.4): qué se compacta en la cola, qué error descarta
// una operación y cómo se mezclan las filas que llegan del servidor.

export type OperacionOutbox =
  | {
      operacion: 'upsert';
      tabla: 'habits' | 'habit_schedules' | 'habit_occurrences';
      clave: string;
      payload: Record<string, unknown>;
    }
  | {
      operacion: 'complete';
      tabla: 'habit_logs';
      clave: string;
      payload: { log_id: string; habit_id: string; fecha: string };
    }
  | {
      operacion: 'uncomplete';
      tabla: 'habit_logs';
      clave: string;
      payload: { habit_id: string; fecha: string };
    };

export type EntradaOutbox = OperacionOutbox & { id: number; intentos: number };

/**
 * Ids de la cola que se pueden quitar sin enviarlos: un `complete` seguido de un `uncomplete`
 * del mismo hábito y fecha se anulan entre sí (el servidor nunca supo del check-in).
 * La cola llega en orden de creación.
 */
export function idsCompactables(cola: readonly EntradaOutbox[]): number[] {
  const quitar: number[] = [];
  // Último `complete` pendiente por clave, si después de él no hubo otra operación de esa clave.
  const ultimoComplete = new Map<string, number>();
  for (const entrada of cola) {
    if (entrada.tabla !== 'habit_logs') continue;
    if (entrada.operacion === 'complete') {
      ultimoComplete.set(entrada.clave, entrada.id);
    } else {
      const completeId = ultimoComplete.get(entrada.clave);
      if (completeId !== undefined) quitar.push(completeId, entrada.id);
      ultimoComplete.delete(entrada.clave);
    }
  }
  return quitar;
}

/**
 * Un error con código (de Postgres o de PostgREST) es un rechazo del servidor: reintentar no lo
 * arregla, así que la operación se descarta. Sin código, la petición no llegó (sin red).
 */
export function esRechazoDefinitivo(error: { code?: string | null } | null | undefined): boolean {
  return typeof error?.code === 'string' && error.code.length > 0;
}

/** Claves `tabla:clave` con operaciones pendientes: esas filas no se pisan al descargar. */
export function clavesPendientes(cola: readonly OperacionOutbox[]): Set<string> {
  return new Set(cola.map((o) => `${o.tabla}:${o.clave}`));
}

/** Filas descargadas que se pueden guardar: gana el servidor, salvo cambios locales pendientes. */
export function filasAplicables<F>(
  tabla: string,
  filas: readonly F[],
  claveDe: (fila: F) => string,
  pendientes: ReadonlySet<string>,
): F[] {
  return filas.filter((fila) => !pendientes.has(`${tabla}:${claveDe(fila)}`));
}

/**
 * Cursor de la siguiente descarga: el `updated_at` más reciente que mandó el servidor (no el
 * reloj del teléfono, que puede estar desfasado). Si no llegó nada, se conserva el anterior.
 */
export function siguienteCursor(
  anterior: string | null,
  filas: readonly { updated_at?: unknown }[],
): string | null {
  let cursor = anterior;
  for (const fila of filas) {
    if (typeof fila.updated_at !== 'string') continue;
    if (cursor === null || microsegundos(fila.updated_at) > microsegundos(cursor)) {
      cursor = fila.updated_at;
    }
  }
  return cursor;
}

/**
 * Postgres manda microsegundos («…12:00:00.123456+00:00») y Date.parse solo entiende
 * milisegundos, así que la fracción se compara aparte.
 */
function microsegundos(marca: string): number {
  const partes = /^(.+T\d{2}:\d{2}:\d{2})(?:\.(\d+))?(.*)$/.exec(marca);
  if (!partes) return Number.NaN;
  const [, base, fraccion = '', zona] = partes;
  return Date.parse(`${base}${zona}`) * 1000 + Number(fraccion.padEnd(6, '0').slice(0, 6));
}
