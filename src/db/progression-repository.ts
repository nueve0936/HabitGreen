import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  horarioDeReferencia,
  type Habito,
  type Horario,
  type Ocurrencia,
  type Registro,
} from '@/features/habits/domain/habitos-del-dia';
import { nuevaVersionHorario } from '@/features/habits/domain/horario';
import type { FilaCatalogo } from '@/features/plan/domain/plan-engine';
import {
  decidir,
  esDelPlan,
  tocaDesbloquear,
  tocaEvaluar,
  type ConfigProgresion,
  type EntradaProgresion,
  type Tarjeta,
  type ValoresNivel,
} from '@/features/progression/domain/progresion';
import { historial } from '@/features/stats/domain/cumplimiento';
import { fechaLocal } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { respuestasSchema, type Respuestas } from '@/schemas/onboarding';
import { respuestaAjusteSchema, type HabitoPlan, type PeticionAjuste } from '@/schemas/plan';
import type { OperacionOutbox } from '@/sync/domain/sync-rules';

import { aplicar } from './aplicar-cambio';
import { actualizarFila, getDb, guardarFilas, leerFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { categoriasPorId, guardarVersionHorario, idCategoria } from './habits-repository';
import { descartarMovidasDelPatron } from './occurrences-repository';
import { leerAjustesEn, leerConfigProgresion, leerPresupuestos } from './settings-repository';

// Progresión (SDD 6.3). Cada 7 días, al abrir la app, se revisan los hábitos del plan: las
// bajadas se aplican solas y las propuestas quedan como tarjetas en Hoy. Todo se escribe en SQLite
// y se sube con la cola, así que funciona sin conexión. Las tarjetas pendientes viven solo en este
// teléfono (`progresion_tarjetas`). La IA (`adjust-plan`) redacta después los textos del nivel
// nuevo; si no responde, se quedan los del catálogo.

type Contexto = {
  entrada: EntradaProgresion;
  ultimaEvaluacion: string | null;
  inicioPlan: string;
  planId: string;
};

type FilaAjustesProgresion = {
  ultima_evaluacion: string | null;
  limite_plan_desbloqueado: boolean;
};

async function leerRespuestas(db: SQLiteDatabase, userId: string): Promise<Respuestas | null> {
  const [fila] = await leerFilas<{ respuestas: unknown }>(db, 'onboarding_answers', 'user_id = ?', [
    userId,
  ]);
  const respuestas = respuestasSchema.safeParse(fila?.respuestas);
  return respuestas.success ? respuestas.data : null;
}

/** Todo lo que necesitan las reglas, o null si no hay plan (modo tradicional) o faltan datos. */
async function leerContexto(db: SQLiteDatabase, userId: string): Promise<Contexto | null> {
  const plan = await db.getFirstAsync<{ id: string; creado_en: string | null }>(
    'SELECT id, creado_en FROM plans WHERE user_id = ? AND activo = 1 ORDER BY creado_en DESC',
    [userId],
  );
  const [ajustesFila] = await leerFilas<FilaAjustesProgresion>(db, 'user_settings', 'user_id = ?', [
    userId,
  ]);
  const ajustes = await leerAjustesEn(db, userId);
  const respuestas = await leerRespuestas(db, userId);
  if (!plan?.creado_en || !ajustesFila || !ajustes || !respuestas) return null;

  const hoy = fechaLocal();
  const habitos = await leerFilas<Habito>(db, 'habits', '1 = 1 ORDER BY created_at');
  const horarios = await leerFilas<Horario>(db, 'habit_schedules');
  const ocurrencias = await leerFilas<Ocurrencia>(db, 'habit_occurrences');
  const registros = await leerFilas<Registro>(db, 'habit_logs', 'eliminado_en IS NULL');
  const categorias = await categoriasPorId(db);
  const catalogo = await leerFilas<FilaCatalogo>(db, 'habit_catalog');
  const config: ConfigProgresion = await leerConfigProgresion(db);
  const presupuestos = await leerPresupuestos(db);

  return {
    ultimaEvaluacion: ajustesFila.ultima_evaluacion,
    inicioPlan: fechaLocal(new Date(plan.creado_en)),
    planId: plan.id,
    entrada: {
      hoy,
      habitos,
      horarios,
      ocurrencias: historial({ habitos, horarios, ocurrencias, registros, categorias }, hoy),
      catalogo,
      respuestas,
      configPlan: { presupuestos, horas: ajustes.horas },
      presupuestoMin: ajustes.presupuestoMin,
      limiteDesbloqueado: ajustesFila.limite_plan_desbloqueado,
      config,
    },
  };
}

/** Fecha de la última revisión y del inicio del plan activo, o null si no hay plan. */
async function fechasDeRevision(
  db: SQLiteDatabase,
  userId: string,
): Promise<{ ultima: string | null; inicio: string } | null> {
  const plan = await db.getFirstAsync<{ creado_en: string | null }>(
    'SELECT creado_en FROM plans WHERE user_id = ? AND activo = 1 ORDER BY creado_en DESC',
    [userId],
  );
  const ajustes = await db.getFirstAsync<{ ultima_evaluacion: string | null }>(
    'SELECT ultima_evaluacion FROM user_settings WHERE user_id = ?',
    [userId],
  );
  if (!plan?.creado_en || !ajustes) return null;
  return { ultima: ajustes.ultima_evaluacion, inicio: fechaLocal(new Date(plan.creado_en)) };
}

/** Cambia el nivel de un hábito: sus textos y duración, y sus días con una versión del horario. */
async function aplicarNivel(
  db: SQLiteDatabase,
  userId: string,
  habitId: string,
  valores: ValoresNivel,
): Promise<OperacionOutbox[]> {
  const cambios = {
    nivel: valores.nivel,
    titulo: valores.titulo,
    descripcion: valores.descripcion,
    duracion_min: valores.duracion_min,
    usa_duracion_reducida: valores.usa_duracion_reducida,
    nivel_desde: valores.nivel_desde,
  };
  await actualizarFila(
    db,
    'habits',
    { id: habitId },
    { ...cambios, updated_at: new Date().toISOString() },
  );
  const operaciones: OperacionOutbox[] = [
    { operacion: 'update', tabla: 'habits', clave: habitId, payload: cambios },
  ];

  // La hora y los avisos se conservan; solo cambian los días si el nivel trae otros.
  const hoy = fechaLocal();
  const horarios = await leerFilas<Horario>(db, 'habit_schedules', 'habit_id = ?', [habitId]);
  const actual = horarioDeReferencia(horarios, hoy);
  if (actual) {
    const version = nuevaVersionHorario(
      actual,
      {
        dias_semana: valores.dias_semana,
        hora: actual.hora,
        notificar: actual.notificar,
        vigente_hasta: actual.vigente_hasta,
      },
      hoy,
      randomUUID(),
    );
    operaciones.push(...(await guardarVersionHorario(db, userId, version)));
  }
  operaciones.push(...(await descartarMovidasDelPatron(db, habitId, valores.dias_semana)));
  return operaciones;
}

async function borrarTarjeta(db: SQLiteDatabase, userId: string, id: string): Promise<void> {
  await db.runAsync('DELETE FROM progresion_tarjetas WHERE user_id = ? AND id = ?', [userId, id]);
}

/** Tarjetas pendientes de la última revisión, en orden. */
export async function leerTarjetas(userId: string): Promise<Tarjeta[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<{ json: string }>(
    'SELECT json FROM progresion_tarjetas WHERE user_id = ? ORDER BY orden',
    [userId],
  );
  return filas.flatMap((f) => {
    try {
      return [JSON.parse(f.json) as Tarjeta];
    } catch {
      return [];
    }
  });
}

export type ResultadoRevision = {
  /** Bajadas aplicadas solas: se les piden textos a la IA. */
  bajadas: Extract<Tarjeta, { tipo: 'bajar' }>[];
};

/**
 * Revisión de cada 7 días. Aplica las bajadas, guarda las tarjetas (reemplaza las de la revisión
 * anterior que quedaran sin contestar), anota `ultima_evaluacion` y, si toca, el desbloqueo.
 */
export async function revisarProgresion(userId: string): Promise<ResultadoRevision> {
  const sinNada: ResultadoRevision = { bajadas: [] };
  // Revisión ligera (solo dos fechas) antes de leer todo: se llama con cada cambio local.
  const db = await getDb();
  const fechas = await fechasDeRevision(db, userId);
  const config = await leerConfigProgresion(db);
  if (!fechas || !tocaEvaluar(fechaLocal(), fechas.ultima, fechas.inicio, config)) return sinNada;

  let resultado = sinNada;
  await aplicar(async (dbEscritura) => {
    const contexto = await leerContexto(dbEscritura, userId);
    if (!contexto) return [];
    const { entrada, inicioPlan, ultimaEvaluacion } = contexto;
    if (!tocaEvaluar(entrada.hoy, ultimaEvaluacion, inicioPlan, entrada.config)) return [];

    const tarjetas = decidir(entrada);
    const operaciones: OperacionOutbox[] = [];
    const bajadas = tarjetas.filter(
      (t): t is Extract<Tarjeta, { tipo: 'bajar' }> => t.tipo === 'bajar',
    );
    for (const t of bajadas) {
      operaciones.push(...(await aplicarNivel(dbEscritura, userId, t.habitId, t.despues)));
    }

    await dbEscritura.runAsync('DELETE FROM progresion_tarjetas WHERE user_id = ?', [userId]);
    for (const [orden, t] of tarjetas.entries()) {
      await dbEscritura.runAsync(
        'INSERT INTO progresion_tarjetas (user_id, id, orden, json) VALUES (?, ?, ?, ?)',
        [userId, t.id, orden, JSON.stringify(t)],
      );
    }

    const desbloquear = tocaDesbloquear(
      entrada.hoy,
      inicioPlan,
      entrada.limiteDesbloqueado,
      entrada.habitos,
      entrada.ocurrencias,
      entrada.config,
    );
    const cambios = {
      ultima_evaluacion: entrada.hoy,
      ...(desbloquear ? { limite_plan_desbloqueado: true } : {}),
    };
    await actualizarFila(
      dbEscritura,
      'user_settings',
      { user_id: userId },
      { ...cambios, updated_at: new Date().toISOString() },
    );
    operaciones.push({
      operacion: 'update',
      tabla: 'user_settings',
      clave: userId,
      payload: cambios,
    });
    resultado = { bajadas };
    return operaciones;
  });
  return resultado;
}

/** El hábito sigue como cuando se hizo la tarjeta (no se archivó ni cambió de nivel). */
async function sigueIgual(db: SQLiteDatabase, habitId: string, nivel: number): Promise<boolean> {
  const [habito] = await leerFilas<Habito>(db, 'habits', 'id = ?', [habitId]);
  return habito !== undefined && habito.archivado_en === null && habito.nivel === nivel;
}

/** «Sí, vamos» de una subida. Devuelve false si el hábito cambió y la tarjeta ya no aplica. */
export async function aceptarSubida(
  userId: string,
  tarjeta: Extract<Tarjeta, { tipo: 'subir' }>,
): Promise<boolean> {
  let aplicada = false;
  await aplicar(async (db) => {
    await borrarTarjeta(db, userId, tarjeta.id);
    if (!(await sigueIgual(db, tarjeta.habitId, tarjeta.antes.nivel))) return [];
    aplicada = true;
    return aplicarNivel(db, userId, tarjeta.habitId, tarjeta.despues);
  });
  return aplicada;
}

/** «Mantenerlo como estaba» de una bajada: regresa los valores anteriores. */
export async function deshacerBajada(
  userId: string,
  tarjeta: Extract<Tarjeta, { tipo: 'bajar' }>,
): Promise<void> {
  await aplicar(async (db) => {
    await borrarTarjeta(db, userId, tarjeta.id);
    if (!(await sigueIgual(db, tarjeta.habitId, tarjeta.despues.nivel))) return [];
    return aplicarNivel(db, userId, tarjeta.habitId, tarjeta.antes);
  });
}

/**
 * «Sí, vamos» de un hábito nuevo: lo crea en el plan (nivel 1) con su horario. Devuelve su id, o
 * null si ya no hay lugar (se llegó al límite de hábitos del plan mientras tanto).
 */
export async function aceptarNuevo(
  userId: string,
  tarjeta: Extract<Tarjeta, { tipo: 'nuevo' }>,
): Promise<string | null> {
  let creado: string | null = null;
  await aplicar(async (db) => {
    await borrarTarjeta(db, userId, tarjeta.id);
    const contexto = await leerContexto(db, userId);
    if (!contexto) return [];
    const { entrada, planId } = contexto;
    const activos = entrada.habitos.filter(
      (h) => esDelPlan(h) && h.activo && h.archivado_en === null,
    );
    const repetido = activos.some((h) => h.objetivo === tarjeta.habito.objetivo);
    const lleno =
      !entrada.limiteDesbloqueado && activos.length >= entrada.config.limite_habitos_plan;
    if (repetido || lleno) return [];

    const h: HabitoPlan = tarjeta.habito;
    const ahora = new Date().toISOString();
    const habito = {
      id: randomUUID(),
      user_id: userId,
      category_id: await idCategoria(db, h.categoria),
      plan_id: planId,
      objetivo: h.objetivo,
      nivel: h.nivel,
      usa_duracion_reducida: h.usa_duracion_reducida,
      nivel_desde: entrada.hoy,
      titulo: h.titulo,
      descripcion: h.descripcion,
      duracion_min: h.duracion_min,
      activo: true,
      archivado_en: null,
    };
    const horario = {
      id: randomUUID(),
      habit_id: habito.id,
      user_id: userId,
      dias_semana: h.dias_semana,
      hora: h.hora,
      flexible: h.flexible,
      notificar: h.notificar,
      vigente_desde: entrada.hoy,
      vigente_hasta: null,
    };
    await guardarFilas(db, 'habits', [{ ...habito, created_at: ahora, updated_at: ahora }]);
    await guardarFilas(db, 'habit_schedules', [{ ...horario, updated_at: ahora }]);
    creado = habito.id;
    // El hábito va primero: la política de RLS del horario revisa que el hábito exista.
    return [
      { operacion: 'upsert', tabla: 'habits', clave: habito.id, payload: habito },
      { operacion: 'upsert', tabla: 'habit_schedules', clave: horario.id, payload: horario },
    ];
  });
  return creado;
}

/** «Más adelante» o «Entendido»: quita la tarjeta sin cambiar nada más. */
export async function cerrarTarjeta(userId: string, id: string): Promise<void> {
  const db = await getDb();
  await borrarTarjeta(db, userId, id);
  avisarCambioLocal();
}

/**
 * Pide a `adjust-plan` el título y la descripción del nivel nuevo y los guarda si el hábito sigue
 * en ese nivel con el título del catálogo (nadie lo cambió mientras tanto). Sin conexión, con la
 * IA caída o sin cuota no pasa nada: se quedan los textos del catálogo.
 */
export async function pedirTextosIa(
  userId: string,
  habitId: string,
  direccion: PeticionAjuste['direccion'],
  valores: Pick<ValoresNivel, 'nivel' | 'titulo' | 'duracion_min' | 'dias_semana'> & {
    objetivo: string;
  },
): Promise<void> {
  try {
    const db = await getDb();
    const respuestas = await leerRespuestas(db, userId);
    if (!respuestas) return;
    const peticion = {
      objetivo: valores.objetivo,
      nivel: valores.nivel,
      direccion,
      sin_recursos: respuestas.obstaculo === 'recursos',
      duracion_min: valores.duracion_min,
      dias_semana: valores.dias_semana,
      historial: respuestas.historial,
      obstaculo: respuestas.obstaculo,
    };
    const { data, error } = await supabase.functions.invoke('adjust-plan', { body: peticion });
    if (error) return;
    const textos = respuestaAjusteSchema.safeParse((data as { textos?: unknown } | null)?.textos);
    if (!textos.success) return;

    await aplicar(async (dbEscritura) => {
      const [habito] = await leerFilas<Habito>(dbEscritura, 'habits', 'id = ?', [habitId]);
      if (!habito || habito.nivel !== valores.nivel || habito.titulo !== valores.titulo) return [];
      const cambios = { titulo: textos.data.titulo, descripcion: textos.data.descripcion };
      await actualizarFila(
        dbEscritura,
        'habits',
        { id: habitId },
        { ...cambios, updated_at: new Date().toISOString() },
      );
      return [{ operacion: 'update', tabla: 'habits', clave: habitId, payload: cambios }];
    });
  } catch (causa) {
    console.warn('adjust-plan: se quedan los textos del catálogo', causa);
  }
}
