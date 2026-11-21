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
import { respuestasDelPlan } from '@/features/plan/domain/respuestas-plan';
import {
  decidir,
  esDelPlan,
  llegoAlLimiteTotal,
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
import { AREAS, respuestasSchema, type Area, type Respuestas } from '@/schemas/onboarding';
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
// Varios planes por usuario (uno por área): cada plan tiene su propia revisión de 7 días, su
// desbloqueo de 90 días y sus tarjetas; el tiempo diario y el contador de subidas son del usuario.

/** Plan activo con lo que necesita su revisión. */
type PlanActivo = {
  id: string;
  area: Area;
  inicio: string;
  respuestas: unknown;
  ultimaEvaluacion: string | null;
  limiteDesbloqueado: boolean;
};

/** Tarjeta guardada en el teléfono, con el plan al que pertenece. */
export type TarjetaGuardada = Tarjeta & { planId?: string };

type FilaPlan = {
  id: string;
  area: string | null;
  creado_en: string | null;
  respuestas: unknown;
  ultima_evaluacion: string | null;
  limite_desbloqueado: boolean | null;
};

type FilaAjustesProgresion = { subidas_plan: number | null };

/** Lo que comparten las revisiones de todos los planes. */
type Comunes = Omit<EntradaProgresion, 'respuestas' | 'limiteDesbloqueado' | 'planId'> & {
  respuestas: Respuestas;
};

async function leerRespuestas(db: SQLiteDatabase, userId: string): Promise<Respuestas | null> {
  const [fila] = await leerFilas<{ respuestas: unknown }>(db, 'onboarding_answers', 'user_id = ?', [
    userId,
  ]);
  const respuestas = respuestasSchema.safeParse(fila?.respuestas);
  return respuestas.success ? respuestas.data : null;
}

/** Planes activos con área, del más antiguo al más nuevo. Sin planes: no hay progresión. */
async function leerPlanesActivos(db: SQLiteDatabase, userId: string): Promise<PlanActivo[]> {
  const filas = await leerFilas<FilaPlan>(
    db,
    'plans',
    'user_id = ? AND activo = 1 ORDER BY creado_en',
    [userId],
  );
  return filas.flatMap((f) =>
    f.creado_en && (AREAS as readonly (string | null)[]).includes(f.area)
      ? [
          {
            id: f.id,
            area: f.area as Area,
            inicio: fechaLocal(new Date(f.creado_en)),
            respuestas: f.respuestas,
            ultimaEvaluacion: f.ultima_evaluacion,
            limiteDesbloqueado: f.limite_desbloqueado === true,
          },
        ]
      : [],
  );
}

/** Datos comunes a todas las revisiones, o null si faltan ajustes o respuestas. */
async function leerComunes(db: SQLiteDatabase, userId: string): Promise<Comunes | null> {
  const [ajustesFila] = await leerFilas<FilaAjustesProgresion>(db, 'user_settings', 'user_id = ?', [
    userId,
  ]);
  const ajustes = await leerAjustesEn(db, userId);
  const respuestas = await leerRespuestas(db, userId);
  if (!ajustesFila || !ajustes || !respuestas) return null;

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
    hoy,
    habitos,
    horarios,
    ocurrencias: historial({ habitos, horarios, ocurrencias, registros, categorias }, hoy),
    catalogo,
    respuestas,
    configPlan: { presupuestos, horas: ajustes.horas },
    presupuestoMin: ajustes.presupuestoMin,
    subidasPlan: ajustesFila.subidas_plan ?? 0,
    config,
  };
}

/** Entrada de las reglas para un plan: sus respuestas de área y su desbloqueo. */
function entradaDelPlan(comunes: Comunes, plan: PlanActivo): EntradaProgresion {
  return {
    ...comunes,
    respuestas: respuestasDelPlan(comunes.respuestas, plan.area, plan.respuestas),
    limiteDesbloqueado: plan.limiteDesbloqueado,
    planId: plan.id,
  };
}

async function leerTarjetasGuardadas(
  db: SQLiteDatabase,
  userId: string,
): Promise<TarjetaGuardada[]> {
  const filas = await db.getAllAsync<{ json: string }>(
    'SELECT json FROM progresion_tarjetas WHERE user_id = ? ORDER BY orden',
    [userId],
  );
  return filas.flatMap((f) => {
    try {
      return [JSON.parse(f.json) as TarjetaGuardada];
    } catch {
      return [];
    }
  });
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

/** Tarjetas pendientes de las revisiones, en orden. */
export async function leerTarjetas(userId: string): Promise<TarjetaGuardada[]> {
  return leerTarjetasGuardadas(await getDb(), userId);
}

export type ResultadoRevision = {
  /** Bajadas aplicadas solas: se les piden textos a la IA. */
  bajadas: Extract<Tarjeta, { tipo: 'bajar' }>[];
};

/**
 * Revisión de cada 7 días, plan por plan: solo se revisan los planes a los que ya les toca. Aplica
 * sus bajadas, reemplaza sus tarjetas (las de los otros planes se quedan) y anota en cada plan su
 * `ultima_evaluacion` y, si toca, su desbloqueo.
 */
export async function revisarProgresion(userId: string): Promise<ResultadoRevision> {
  const sinNada: ResultadoRevision = { bajadas: [] };
  // Revisión ligera (solo fechas) antes de leer todo: se llama con cada cambio local.
  const db = await getDb();
  const config = await leerConfigProgresion(db);
  const hoy = fechaLocal();
  const toca = (p: PlanActivo) => tocaEvaluar(hoy, p.ultimaEvaluacion, p.inicio, config);
  if (!(await leerPlanesActivos(db, userId)).some(toca)) return sinNada;

  let resultado = sinNada;
  await aplicar(async (dbEscritura) => {
    const comunes = await leerComunes(dbEscritura, userId);
    if (!comunes) return [];
    const planes = (await leerPlanesActivos(dbEscritura, userId)).filter((p) =>
      tocaEvaluar(comunes.hoy, p.ultimaEvaluacion, p.inicio, comunes.config),
    );
    if (planes.length === 0) return [];

    const operaciones: OperacionOutbox[] = [];
    const bajadas: Extract<Tarjeta, { tipo: 'bajar' }>[] = [];
    const revisados = new Set(planes.map((p) => p.id));
    // Las tarjetas de los planes que no se revisan hoy se quedan como estaban.
    const tarjetas: TarjetaGuardada[] = (await leerTarjetasGuardadas(dbEscritura, userId)).filter(
      (t) => t.planId !== undefined && !revisados.has(t.planId),
    );

    for (const plan of planes) {
      const entrada = entradaDelPlan(comunes, plan);
      for (const t of decidir(entrada)) {
        // «Sin espacio» no tiene hábito ni objetivo: su id lleva el plan para no repetirse.
        const id = t.tipo === 'sin_espacio' ? `sin_espacio-${plan.id}` : t.id;
        tarjetas.push({ ...t, id, planId: plan.id });
        if (t.tipo === 'bajar') {
          bajadas.push(t);
          operaciones.push(...(await aplicarNivel(dbEscritura, userId, t.habitId, t.despues)));
        }
      }

      const desbloquear = tocaDesbloquear(
        entrada.hoy,
        plan.inicio,
        plan.limiteDesbloqueado,
        entrada.habitos.filter((h) => h.plan_id === plan.id),
        entrada.ocurrencias,
        entrada.config,
      );
      const cambios = {
        ultima_evaluacion: entrada.hoy,
        ...(desbloquear ? { limite_desbloqueado: true } : {}),
      };
      await actualizarFila(
        dbEscritura,
        'plans',
        { id: plan.id },
        { ...cambios, updated_at: new Date().toISOString() },
      );
      operaciones.push({ operacion: 'update', tabla: 'plans', clave: plan.id, payload: cambios });
    }

    await dbEscritura.runAsync('DELETE FROM progresion_tarjetas WHERE user_id = ?', [userId]);
    for (const [orden, t] of tarjetas.entries()) {
      await dbEscritura.runAsync(
        'INSERT INTO progresion_tarjetas (user_id, id, orden, json) VALUES (?, ?, ?, ?)',
        [userId, t.id, orden, JSON.stringify(t)],
      );
    }
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
    return [
      ...(await aplicarNivel(db, userId, tarjeta.habitId, tarjeta.despues)),
      ...(await sumarSubida(db, userId)),
    ];
  });
  return aplicada;
}

/** Cuenta una subida de nivel del plan: cada una da 1 lugar más en el límite total de hábitos. */
async function sumarSubida(db: SQLiteDatabase, userId: string): Promise<OperacionOutbox[]> {
  const fila = await db.getFirstAsync<{ subidas_plan: number | null }>(
    'SELECT subidas_plan FROM user_settings WHERE user_id = ?',
    [userId],
  );
  if (!fila) return [];
  const cambios = { subidas_plan: (fila.subidas_plan ?? 0) + 1 };
  await actualizarFila(
    db,
    'user_settings',
    { user_id: userId },
    { ...cambios, updated_at: new Date().toISOString() },
  );
  return [{ operacion: 'update', tabla: 'user_settings', clave: userId, payload: cambios }];
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
  tarjeta: Extract<Tarjeta, { tipo: 'nuevo' }> & { planId?: string },
): Promise<string | null> {
  let creado: string | null = null;
  await aplicar(async (db) => {
    await borrarTarjeta(db, userId, tarjeta.id);
    const comunes = await leerComunes(db, userId);
    // El plan de la tarjeta o, en tarjetas viejas sin plan, el del área del hábito propuesto.
    const plan = (await leerPlanesActivos(db, userId)).find((p) =>
      tarjeta.planId ? p.id === tarjeta.planId : p.area === tarjeta.habito.categoria,
    );
    if (!comunes || !plan) return [];
    const entrada = entradaDelPlan(comunes, plan);
    const planId = plan.id;
    const activos = entrada.habitos.filter(
      (h) => esDelPlan(h) && h.activo && h.archivado_en === null,
    );
    const repetido = activos.some((h) => h.objetivo === tarjeta.habito.objetivo);
    // Límite de hábitos de este plan (4) y límite total de hábitos: el usuario pudo crear uno
    // propio mientras tanto.
    const delPlan = activos.filter((h) => h.plan_id === planId).length;
    const lleno =
      (!plan.limiteDesbloqueado && delPlan >= entrada.config.limite_habitos_plan) ||
      llegoAlLimiteTotal(entrada);
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
    const globales = await leerRespuestas(db, userId);
    if (!globales) return;
    // El historial (P3) es del plan del hábito.
    const [habitoActual] = await leerFilas<Habito>(db, 'habits', 'id = ?', [habitId]);
    const plan = (await leerPlanesActivos(db, userId)).find((p) => p.id === habitoActual?.plan_id);
    const respuestas = plan ? respuestasDelPlan(globales, plan.area, plan.respuestas) : globales;
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
