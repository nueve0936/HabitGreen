import { FunctionsFetchError } from '@supabase/supabase-js';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Habito } from '@/features/habits/domain/habitos-del-dia';

import { filasDelPlan, fechaLocal, type IdsPlan } from '@/features/plan/domain/plan-rows';
import { supabase } from '@/lib/supabase';
import {
  ACOMPANAMIENTOS,
  AREAS,
  MOMENTOS,
  OBSTACULOS,
  TIEMPOS,
  type Area,
  type Respuestas,
} from '@/schemas/onboarding';
import { borradorPlanSchema, type BorradorPlan } from '@/schemas/plan';
import type { OperacionOutbox } from '@/sync/domain/sync-rules';

import { aplicar } from './aplicar-cambio';
import { actualizarFila, getDb, leerFilas } from './database';

// Repositorio del plan. Habla directo con Supabase: crear el plan exige conexión (definición 6),
// así que no pasa por la cola de salida. Al llegar a las pestañas, la sincronización lo descarga
// a SQLite.

export type ResultadoBorrador =
  { ok: true; borrador: BorradorPlan } | { ok: false; motivo: 'sin_conexion' | 'error' };

/**
 * Pide el borrador a la Edge Function generate-plan. No guarda nada (SDD 5.8). Con
 * `minutosOcupados` (planes creados desde la app), el plan se acomoda en el tiempo libre del día.
 */
export async function generarBorrador(
  respuestas: Respuestas,
  minutosOcupados = 0,
): Promise<ResultadoBorrador> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: { respuestas, minutos_ocupados: minutosOcupados },
  });
  if (error) {
    // FunctionsFetchError = la petición no salió del teléfono (sin red o servidor inalcanzable).
    return { ok: false, motivo: error instanceof FunctionsFetchError ? 'sin_conexion' : 'error' };
  }
  const borrador = borradorPlanSchema.safeParse(data);
  return borrador.success ? { ok: true, borrador: borrador.data } : { ok: false, motivo: 'error' };
}

async function categoriasDelSistema(): Promise<Record<Area, string>> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, clave')
    .is('user_id', null)
    .returns<{ id: string; clave: string }[]>();
  if (error) throw error;
  const porClave = new Map(data.map((c) => [c.clave, c.id]));
  const categorias = {} as Record<Area, string>;
  for (const area of AREAS) {
    const id = porClave.get(area);
    if (id === undefined) throw new Error(`Falta la categoría ${area}`);
    categorias[area] = id;
  }
  return categorias;
}

export type OpcionesGuardado = {
  /**
   * El primer plan guarda los ajustes y las respuestas globales (P4 a P7). Un plan siguiente no:
   * esas respuestas ya existen y no se pisan.
   */
  guardarAjustes?: boolean;
  /** Tiempo diario nuevo si el plan no cabía en el actual (sube solo a lo necesario). */
  presupuestoMin?: number;
};

/**
 * Guarda el plan confirmado: plan, hábitos, horarios, ajustes y respuestas. Usa upsert con los
 * UUID del cliente, así que reintentar después de un fallo no duplica nada. El perfil (modo y
 * onboarding completo) lo actualiza después quien llama, cuando todo esto ya quedó guardado.
 */
export async function guardarPlan(
  userId: string,
  borrador: BorradorPlan,
  respuestas: Respuestas,
  ids: IdsPlan,
  /** false si la persona no dio el permiso de avisos: los hábitos quedan sin recordatorio. */
  conRecordatorios = true,
  opciones: OpcionesGuardado = {},
): Promise<void> {
  const guardarAjustes = opciones.guardarAjustes ?? true;
  const filas = filasDelPlan({
    userId,
    borrador,
    respuestas,
    ids,
    categorias: await categoriasDelSistema(),
    hoy: fechaLocal(),
    conRecordatorios,
  });

  // El orden importa: las políticas de RLS revisan que el plan y el hábito ya existan.
  const pasos = [
    () => supabase.from('plans').upsert(filas.plans),
    () => supabase.from('habits').upsert(filas.habits),
    () => supabase.from('habit_schedules').upsert(filas.schedules),
    ...(guardarAjustes
      ? [
          () => supabase.from('user_settings').upsert(filas.settings, { onConflict: 'user_id' }),
          () =>
            supabase.from('onboarding_answers').upsert(filas.answers, { onConflict: 'user_id' }),
        ]
      : []),
    ...(opciones.presupuestoMin !== undefined
      ? [
          () =>
            supabase
              .from('user_settings')
              .update({ presupuesto_min: opciones.presupuestoMin })
              .eq('user_id', userId),
        ]
      : []),
  ];
  for (const paso of pasos) {
    const { error } = await paso();
    if (error) throw error;
  }
}

// --- Mis planes (Perfil) ---------------------------------------------------------------------

export type MiPlan = {
  id: string;
  area: Area;
  /** Hábitos del plan que no se han eliminado (también los pausados). */
  habitos: { id: string; titulo: string; activo: boolean }[];
};

/** Planes activos del usuario, del más antiguo al más nuevo, con sus hábitos. Lee SQLite. */
export async function leerMisPlanes(userId: string): Promise<MiPlan[]> {
  const db = await getDb();
  const planes = await leerFilas<{ id: string; area: string | null }>(
    db,
    'plans',
    'user_id = ? AND activo = 1 ORDER BY creado_en',
    [userId],
  );
  const habitos = await leerFilas<Habito>(
    db,
    'habits',
    'plan_id IS NOT NULL AND archivado_en IS NULL ORDER BY created_at',
  );
  return planes.flatMap((p) =>
    (AREAS as readonly (string | null)[]).includes(p.area)
      ? [
          {
            id: p.id,
            area: p.area as Area,
            habitos: habitos
              .filter((h) => h.plan_id === p.id)
              .map((h) => ({ id: h.id, titulo: h.titulo, activo: h.activo })),
          },
        ]
      : [],
  );
}

type Globales = Pick<Respuestas, 'tiempo' | 'momento' | 'obstaculo' | 'acompanamiento'>;

/**
 * Respuestas globales del formulario (P4 a P7) para un plan siguiente, o null si nunca hizo el
 * formulario (empezó creando sus hábitos): entonces su primer plan pregunta los 7 pasos.
 */
export async function leerGlobalesFormulario(userId: string): Promise<Globales | null> {
  const db = await getDb();
  const [fila] = await leerFilas<{ respuestas: Partial<Record<keyof Globales, unknown>> | null }>(
    db,
    'onboarding_answers',
    'user_id = ?',
    [userId],
  );
  const r = fila?.respuestas;
  const valido = <T extends string>(lista: readonly T[], valor: unknown): valor is T =>
    (lista as readonly unknown[]).includes(valor);
  if (
    !r ||
    !valido(TIEMPOS, r.tiempo) ||
    !valido(MOMENTOS, r.momento) ||
    !valido(OBSTACULOS, r.obstaculo) ||
    !valido(ACOMPANAMIENTOS, r.acompanamiento)
  ) {
    return null;
  }
  return {
    tiempo: r.tiempo,
    momento: r.momento,
    obstaculo: r.obstaculo,
    acompanamiento: r.acompanamiento,
  };
}

/** Un hábito del plan pasa a ser propio. Objetivo y nivel van juntos: la base los pide a los dos. */
const COMO_PROPIO = {
  plan_id: null,
  objetivo: null,
  nivel: null,
  nivel_desde: null,
  usa_duracion_reducida: false,
};

async function volverPropio(
  db: SQLiteDatabase,
  habitId: string,
  ahora: string,
): Promise<OperacionOutbox> {
  await actualizarFila(db, 'habits', { id: habitId }, { ...COMO_PROPIO, updated_at: ahora });
  return { operacion: 'update', tabla: 'habits', clave: habitId, payload: COMO_PROPIO };
}

/** Quita las tarjetas de progresión pendientes de un plan (o las de un hábito, con `habitId`). */
async function quitarTarjetas(
  db: SQLiteDatabase,
  userId: string,
  planId: string,
  habitId?: string,
): Promise<void> {
  const tarjetas = await db.getAllAsync<{ id: string; json: string }>(
    'SELECT id, json FROM progresion_tarjetas WHERE user_id = ?',
    [userId],
  );
  for (const t of tarjetas) {
    try {
      const datos = JSON.parse(t.json) as { planId?: string; habitId?: string };
      if (datos.planId !== planId) continue;
      if (habitId !== undefined && datos.habitId !== habitId) continue;
    } catch {
      // Tarjeta ilegible: se quita también.
    }
    await db.runAsync('DELETE FROM progresion_tarjetas WHERE user_id = ? AND id = ?', [
      userId,
      t.id,
    ]);
  }
}

/**
 * «Sacar del plan» (decisión del usuario): el hábito pasa a ser propio, con su historial, y ya no
 * sube ni baja de nivel. Si era el último hábito del plan, el plan se termina. Funciona sin conexión.
 */
export async function sacarDelPlan(userId: string, habitId: string): Promise<void> {
  await aplicar(async (db) => {
    const ahora = new Date().toISOString();
    const [habito] = await leerFilas<Habito>(db, 'habits', 'id = ?', [habitId]);
    const planId = habito?.plan_id;
    if (!planId) return [];
    const operaciones: OperacionOutbox[] = [await volverPropio(db, habitId, ahora)];
    await quitarTarjetas(db, userId, planId, habitId);
    const quedan = await leerFilas<Habito>(db, 'habits', 'plan_id = ? AND archivado_en IS NULL', [
      planId,
    ]);
    if (quedan.length === 0) {
      await actualizarFila(db, 'plans', { id: planId }, { activo: false, updated_at: ahora });
      operaciones.push({
        operacion: 'update',
        tabla: 'plans',
        clave: planId,
        payload: { activo: false },
      });
      await quitarTarjetas(db, userId, planId);
    }
    return operaciones;
  });
}

/**
 * «Terminar plan» (decisión del usuario): el plan queda inactivo y sus hábitos pasan a ser propios,
 * con su historial, racha y planta. Ya no suben ni bajan de nivel. Funciona sin conexión: se
 * guarda en SQLite y se sube con la cola. Sus tarjetas de progresión pendientes se quitan.
 */
export async function terminarPlan(userId: string, planId: string): Promise<void> {
  await aplicar(async (db) => {
    const ahora = new Date().toISOString();
    const habitos = await leerFilas<Habito>(db, 'habits', 'plan_id = ?', [planId]);
    const operaciones: OperacionOutbox[] = [];
    for (const h of habitos) operaciones.push(await volverPropio(db, h.id, ahora));
    await actualizarFila(db, 'plans', { id: planId }, { activo: false, updated_at: ahora });
    operaciones.push({
      operacion: 'update',
      tabla: 'plans',
      clave: planId,
      payload: { activo: false },
    });
    await quitarTarjetas(db, userId, planId);
    return operaciones;
  });
}
