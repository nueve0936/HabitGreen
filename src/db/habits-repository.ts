import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import {
  estaVisible,
  habitosDelDia,
  horarioVigente,
  type Habito,
  type HabitoDelDia,
  type Horario,
  type Ocurrencia,
  type Registro,
} from '@/features/habits/domain/habitos-del-dia';
import { nuevaVersionHorario } from '@/features/habits/domain/horario';
import { ajustePresupuesto, minutosPorDia } from '@/features/habits/domain/presupuesto';
import { fechaLocal } from '@/lib/dates';
import { AREAS, type Area } from '@/schemas/onboarding';
import type { HabitoFormValues } from '@/schemas/habit';
import type { OperacionOutbox } from '@/sync/domain/sync-rules';
import { pedirSincronizacion } from '@/sync/sync-engine';

import { actualizarFila, getDb, guardarFilas, leerFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { encolar } from './outbox';

// Repositorio de hábitos (SDD 3.4). Todo se lee y se escribe en SQLite, así que funciona sin
// conexión. Cada cambio guarda la fila local y su operación en la cola de salida dentro de la
// misma transacción; después se avisa a la UI y se pide sincronizar.

export type HabitoConHorario = {
  habito: Habito;
  /** Horario vigente hoy (puede faltar si el hábito todavía no tiene uno descargado). */
  horario: Horario | undefined;
  categoria: Area;
};

export type HoyLocal = {
  fecha: string;
  items: (HabitoDelDia & { categoria: Area })[];
  /** Hay al menos un hábito visible (para distinguir «sin hábitos» de «nada hoy»). */
  tieneHabitos: boolean;
};

async function categoriasPorId(db: SQLiteDatabase): Promise<Map<string, Area>> {
  const filas = await db.getAllAsync<{ id: string; clave: string }>(
    'SELECT id, clave FROM categories',
  );
  const areas = new Set<string>(AREAS);
  return new Map(
    filas.filter((f) => areas.has(f.clave)).map((f) => [f.id, f.clave as Area] as const),
  );
}

async function idCategoria(db: SQLiteDatabase, area: Area): Promise<string> {
  const fila = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM categories WHERE clave = ? AND user_id IS NULL',
    [area],
  );
  if (!fila) throw new Error(`Falta la categoría ${area} en la base local`);
  return fila.id;
}

/** Hábitos sin archivar, con su horario vigente hoy y la clave de su categoría. */
export async function leerHabitos(): Promise<HabitoConHorario[]> {
  const db = await getDb();
  const hoy = fechaLocal();
  const [habitos, horarios, categorias] = await Promise.all([
    leerFilas<Habito>(db, 'habits', 'archivado_en IS NULL ORDER BY created_at'),
    leerFilas<Horario>(db, 'habit_schedules'),
    categoriasPorId(db),
  ]);
  return habitos.flatMap((habito) => {
    const categoria = categorias.get(habito.category_id);
    if (categoria === undefined) return [];
    const propios = horarios.filter((h) => h.habit_id === habito.id);
    return [{ habito, categoria, horario: horarioVigente(propios, hoy) }];
  });
}

export async function leerHabito(id: string): Promise<HabitoConHorario | null> {
  return (await leerHabitos()).find((h) => h.habito.id === id) ?? null;
}

/** Hábitos de hoy para la pantalla Hoy. */
export async function leerHoy(): Promise<HoyLocal> {
  const db = await getDb();
  const fecha = fechaLocal();
  const [habitos, horarios, ocurrencias, registros, categorias] = await Promise.all([
    leerFilas<Habito>(db, 'habits', 'archivado_en IS NULL'),
    leerFilas<Horario>(db, 'habit_schedules'),
    leerFilas<Ocurrencia>(db, 'habit_occurrences', 'fecha_original = ? OR fecha_nueva = ?', [
      fecha,
      fecha,
    ]),
    leerFilas<Registro>(db, 'habit_logs', 'fecha = ?', [fecha]),
    categoriasPorId(db),
  ]);
  const items = habitosDelDia(fecha, habitos, horarios, ocurrencias, registros).flatMap((item) => {
    const categoria = categorias.get(item.habito.category_id);
    return categoria === undefined ? [] : [{ ...item, categoria }];
  });
  return { fecha, items, tieneHabitos: habitos.some(estaVisible) };
}

/** Escribe filas locales y sus operaciones juntas, y avisa a la UI y a la sincronización. */
async function aplicar(pasos: (db: SQLiteDatabase) => Promise<OperacionOutbox[]>): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const operacion of await pasos(db)) await encolar(db, operacion);
  });
  avisarCambioLocal();
  pedirSincronizacion();
}

/**
 * Si los hábitos visibles (con el cambio aplicado) superan el presupuesto en algún día, lo sube
 * a esa suma (SDD 6.5). Devuelve el presupuesto nuevo, o null si no cambió o no se conoce.
 */
async function subirPresupuestoSiHaceFalta(
  db: SQLiteDatabase,
  userId: string,
  cargas: { habitId: string; duracion_min: number; dias_semana: number[] },
): Promise<{ presupuesto: number; operacion: OperacionOutbox } | null> {
  const ajustes = await db.getFirstAsync<{ presupuesto_min: number }>(
    'SELECT presupuesto_min FROM user_settings WHERE user_id = ?',
    [userId],
  );
  if (!ajustes) return null;

  const otros = (await leerHabitosEn(db)).filter(
    (h) => h.habito.id !== cargas.habitId && estaVisible(h.habito) && h.horario !== undefined,
  );
  const minutos = minutosPorDia([
    ...otros.map((h) => ({
      duracion_min: h.habito.duracion_min,
      dias_semana: h.horario?.dias_semana ?? [],
    })),
    { duracion_min: cargas.duracion_min, dias_semana: cargas.dias_semana },
  ]);
  const { excede, nuevoPresupuesto } = ajustePresupuesto(ajustes.presupuesto_min, minutos);
  if (!excede) return null;

  const cambios = { presupuesto_min: nuevoPresupuesto, updated_at: new Date().toISOString() };
  await actualizarFila(db, 'user_settings', { user_id: userId }, cambios);
  return {
    presupuesto: nuevoPresupuesto,
    operacion: {
      operacion: 'update',
      tabla: 'user_settings',
      clave: userId,
      payload: { presupuesto_min: nuevoPresupuesto },
    },
  };
}

// leerHabitos dentro de una transacción ya abierta (misma conexión).
async function leerHabitosEn(db: SQLiteDatabase): Promise<{ habito: Habito; horario?: Horario }[]> {
  const hoy = fechaLocal();
  const habitos = await leerFilas<Habito>(db, 'habits', 'archivado_en IS NULL');
  const horarios = await leerFilas<Horario>(db, 'habit_schedules');
  return habitos.map((habito) => ({
    habito,
    horario: horarioVigente(
      horarios.filter((h) => h.habit_id === habito.id),
      hoy,
    ),
  }));
}

export type ResultadoGuardar = { presupuestoNuevo: number | null };

/** Crea un hábito manual (sin plan ni progresión, SDD 6.5) con su primer horario. */
export async function crearHabito(
  userId: string,
  valores: HabitoFormValues,
): Promise<ResultadoGuardar> {
  let presupuestoNuevo: number | null = null;
  await aplicar(async (db) => {
    const ahora = new Date().toISOString();
    const habito = {
      id: randomUUID(),
      user_id: userId,
      category_id: await idCategoria(db, valores.categoria),
      plan_id: null,
      objetivo: null,
      nivel: null,
      usa_duracion_reducida: false,
      titulo: valores.nombre,
      descripcion: valores.descripcion,
      duracion_min: valores.duracion,
      activo: true,
      archivado_en: null,
    };
    const horario = {
      id: randomUUID(),
      habit_id: habito.id,
      user_id: userId,
      dias_semana: valores.dias_semana,
      hora: valores.hora,
      flexible: valores.hora === null,
      notificar: valores.avisarme,
      vigente_desde: fechaLocal(),
      vigente_hasta: null,
    };
    await guardarFilas(db, 'habits', [{ ...habito, created_at: ahora, updated_at: ahora }]);
    await guardarFilas(db, 'habit_schedules', [{ ...horario, updated_at: ahora }]);

    const presupuesto = await subirPresupuestoSiHaceFalta(db, userId, {
      habitId: habito.id,
      duracion_min: habito.duracion_min,
      dias_semana: horario.dias_semana,
    });
    presupuestoNuevo = presupuesto?.presupuesto ?? null;

    // El hábito va primero: la política de RLS del horario revisa que el hábito exista.
    return [
      { operacion: 'upsert', tabla: 'habits', clave: habito.id, payload: habito },
      { operacion: 'upsert', tabla: 'habit_schedules', clave: horario.id, payload: horario },
      ...(presupuesto ? [presupuesto.operacion] : []),
    ];
  });
  return { presupuestoNuevo };
}

/** Edita nombre, descripción, duración y horario. La categoría no cambia (definición 6). */
export async function editarHabito(
  userId: string,
  id: string,
  valores: HabitoFormValues,
): Promise<ResultadoGuardar> {
  let presupuestoNuevo: number | null = null;
  await aplicar(async (db) => {
    const ahora = new Date().toISOString();
    const operaciones: OperacionOutbox[] = [];

    const cambiosHabito = {
      titulo: valores.nombre,
      descripcion: valores.descripcion,
      duracion_min: valores.duracion,
    };
    await actualizarFila(db, 'habits', { id }, { ...cambiosHabito, updated_at: ahora });
    operaciones.push({ operacion: 'update', tabla: 'habits', clave: id, payload: cambiosHabito });

    const horarios = await leerFilas<Horario>(db, 'habit_schedules', 'habit_id = ?', [id]);
    const actual = horarioVigente(horarios, fechaLocal());
    if (actual) {
      const version = nuevaVersionHorario(
        actual,
        { dias_semana: valores.dias_semana, hora: valores.hora, notificar: valores.avisarme },
        fechaLocal(),
        randomUUID(),
      );
      if (version?.cerrar) {
        const { id: cerrarId, vigente_hasta } = version.cerrar;
        await actualizarFila(db, 'habit_schedules', { id: cerrarId }, { vigente_hasta });
        operaciones.push({
          operacion: 'update',
          tabla: 'habit_schedules',
          clave: cerrarId,
          payload: { vigente_hasta },
        });
      }
      if (version) {
        const horario = { ...version.guardar, user_id: userId };
        await guardarFilas(db, 'habit_schedules', [{ ...horario, updated_at: ahora }]);
        operaciones.push({
          operacion: 'upsert',
          tabla: 'habit_schedules',
          clave: horario.id,
          payload: horario,
        });
      }
    }

    const presupuesto = await subirPresupuestoSiHaceFalta(db, userId, {
      habitId: id,
      duracion_min: valores.duracion,
      dias_semana: valores.dias_semana,
    });
    presupuestoNuevo = presupuesto?.presupuesto ?? null;
    if (presupuesto) operaciones.push(presupuesto.operacion);
    return operaciones;
  });
  return { presupuestoNuevo };
}

async function cambiarHabito(id: string, cambios: Record<string, unknown>): Promise<void> {
  await aplicar(async (db) => {
    await actualizarFila(
      db,
      'habits',
      { id },
      { ...cambios, updated_at: new Date().toISOString() },
    );
    return [{ operacion: 'update', tabla: 'habits', clave: id, payload: cambios }];
  });
}

/** Pausar (activo = falso) o reanudar. Un hábito pausado no aparece en Hoy. */
export function cambiarActivo(id: string, activo: boolean): Promise<void> {
  return cambiarHabito(id, { activo });
}

/** «Eliminar» archiva: se oculta y su historial se conserva (definición 6). */
export function archivarHabito(id: string): Promise<void> {
  return cambiarHabito(id, { archivado_en: new Date().toISOString() });
}
