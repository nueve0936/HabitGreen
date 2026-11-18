import type { SQLiteDatabase } from 'expo-sqlite';

import { limiteDuracionPlan, minutosPorDia } from '@/features/habits/domain/presupuesto';
import { ajustesTradicionales } from '@/features/plan/domain/plan-rows';
import {
  AVISOS_POR_DEFECTO,
  HORAS_POR_DEFECTO,
  type ConfigAvisos,
  type HorasAvisos,
  type MomentoAviso,
} from '@/features/reminders/domain/planificar-avisos';
import { supabase } from '@/lib/supabase';
import {
  ACOMPANAMIENTOS,
  OBSTACULOS,
  type Acompanamiento,
  type Obstaculo,
} from '@/schemas/onboarding';
import { pedirSincronizacion } from '@/sync/sync-engine';

import { actualizarFila, enTransaccion, getDb, leerFilas } from './database';
import { avisarCambioLocal } from './db-version-store';
import { leerHabitos } from './habits-repository';
import { encolar } from './outbox';

// Ajustes del usuario (`user_settings`). Los por defecto del modo tradicional se guardan directo
// en Supabase porque elegir el modo ya requiere conexión; al llegar a las pestañas, la
// sincronización los descarga a SQLite junto con `app_config`, y desde ahí se leen. Lo que se
// cambia en Perfil se guarda en el teléfono y se sube con la cola, así que funciona sin conexión.

async function presupuestoTradicional(): Promise<number> {
  const { data, error } = await supabase
    .from('app_config')
    .select('valor')
    .eq('clave', 'presupuestos')
    .single<{ valor: { tradicional_por_defecto?: number } }>();
  if (error) throw error;
  const valor = data.valor.tradicional_por_defecto;
  if (typeof valor !== 'number') throw new Error('Falta presupuestos.tradicional_por_defecto');
  return valor;
}

const MOMENTOS_AVISO = Object.keys(HORAS_POR_DEFECTO) as MomentoAviso[];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Solo las horas válidas de un objeto que llega de la base (puede venir incompleto o nulo). */
function horasValidas(valor: unknown): Partial<HorasAvisos> {
  if (typeof valor !== 'object' || valor === null) return {};
  const fuente = valor as Record<string, unknown>;
  const horas: Partial<HorasAvisos> = {};
  for (const momento of MOMENTOS_AVISO) {
    const hora = fuente[momento];
    if (typeof hora === 'string' && HORA.test(hora.slice(0, 5))) horas[momento] = hora.slice(0, 5);
  }
  return horas;
}

async function leerValorConfig(db: SQLiteDatabase, clave: string): Promise<unknown> {
  const [fila] = await leerFilas<{ valor: unknown }>(db, 'app_config', 'clave = ?', [clave]);
  return fila?.valor ?? null;
}

/** `app_config.notificaciones`, con valores por defecto si aún no se descarga. */
export async function leerConfigAvisos(db: SQLiteDatabase): Promise<ConfigAvisos> {
  const valor = await leerValorConfig(db, 'notificaciones');
  const fuente =
    typeof valor === 'object' && valor !== null ? (valor as Partial<ConfigAvisos>) : {};
  return { ...AVISOS_POR_DEFECTO, ...fuente };
}

export type Ajustes = {
  presupuestoMin: number;
  estilo: Acompanamiento;
  estrategias: Obstaculo[];
  segundoAviso: boolean;
  /** Las horas de Perfil sobre las de `app_config`. */
  horas: HorasAvisos;
};

type FilaAjustes = {
  presupuesto_min: number;
  estilo_notificaciones: string;
  estrategias: unknown;
  segundo_aviso: boolean;
  horas_por_momento: unknown;
};

export async function leerAjustesEn(db: SQLiteDatabase, userId: string): Promise<Ajustes | null> {
  const [fila] = await leerFilas<FilaAjustes>(db, 'user_settings', 'user_id = ?', [userId]);
  if (!fila) return null;
  const base = horasValidas(await leerValorConfig(db, 'horas_por_momento'));
  const estrategias = Array.isArray(fila.estrategias) ? fila.estrategias : [];
  return {
    presupuestoMin: fila.presupuesto_min,
    estilo: (ACOMPANAMIENTOS as readonly string[]).includes(fila.estilo_notificaciones)
      ? (fila.estilo_notificaciones as Acompanamiento)
      : 'recordatorio_suave',
    estrategias: estrategias.filter((e): e is Obstaculo =>
      (OBSTACULOS as readonly string[]).includes(String(e)),
    ),
    segundoAviso: fila.segundo_aviso,
    horas: { ...HORAS_POR_DEFECTO, ...base, ...horasValidas(fila.horas_por_momento) },
  };
}

export async function leerAjustes(userId: string): Promise<Ajustes | null> {
  return leerAjustesEn(await getDb(), userId);
}

export type AjustesPerfil = {
  ajustes: Ajustes | null;
  /** Minutos del día con más hábitos, para avisar si el tiempo diario queda corto. */
  minutosDiaMasCargado: number;
};

/** Lo que muestra Perfil. */
export async function leerAjustesPerfil(userId: string): Promise<AjustesPerfil> {
  const [ajustes, habitos] = await Promise.all([leerAjustes(userId), leerHabitos()]);
  const minutos = minutosPorDia(
    habitos
      .filter((h) => h.habito.activo && h.horario !== undefined)
      .map((h) => ({
        duracion_min: h.habito.duracion_min,
        dias_semana: h.horario?.dias_semana ?? [],
      })),
  );
  return { ajustes, minutosDiaMasCargado: Math.max(0, ...minutos) };
}

/**
 * Duración máxima de un hábito del plan (tiempo diario entre los hábitos activos del plan), o
 * null si el hábito es propio: esos no tienen límite (SDD 6.5).
 */
export async function leerLimiteDuracion(userId: string, habitId: string): Promise<number | null> {
  const [ajustes, habitos] = await Promise.all([leerAjustes(userId), leerHabitos()]);
  const habito = habitos.find((h) => h.habito.id === habitId)?.habito;
  if (!ajustes || !habito || habito.plan_id === null) return null;
  const delPlan = habitos.filter((h) => h.habito.plan_id !== null && h.habito.activo).length;
  return limiteDuracionPlan(ajustes.presupuestoMin, delPlan, habito.duracion_min);
}

export type CambiosAjustes = Partial<{
  presupuesto_min: number;
  estilo_notificaciones: Acompanamiento;
  segundo_aviso: boolean;
  horas_por_momento: HorasAvisos;
}>;

/** Cambia ajustes desde Perfil: se guardan en el teléfono y se suben con la cola (SDD 3.4). */
export async function guardarAjustes(userId: string, cambios: CambiosAjustes): Promise<void> {
  const db = await getDb();
  await enTransaccion(db, async () => {
    await actualizarFila(
      db,
      'user_settings',
      { user_id: userId },
      { ...cambios, updated_at: new Date().toISOString() },
    );
    await encolar(db, {
      operacion: 'update',
      tabla: 'user_settings',
      clave: userId,
      payload: cambios,
    });
  });
  avisarCambioLocal();
  pedirSincronizacion();
}

export type AjustesLocales = {
  estiloNotificaciones: string | null;
  /** Hora de «Mañana» en Perfil: con ella empiezan los hábitos nuevos. */
  horaManana: string;
  /** Saldo del monedero; 0 hasta que lleguen las recompensas (Entrega 4). */
  saldo: number;
};

/** Ajustes y saldo desde SQLite, para Hoy y el formulario de hábito (funciona sin conexión). */
export async function leerAjustesLocales(userId: string): Promise<AjustesLocales> {
  const db = await getDb();
  const ajustes = await leerAjustesEn(db, userId);
  const monedero = await db.getFirstAsync<{ saldo: number }>(
    'SELECT saldo FROM wallets WHERE user_id = ?',
    [userId],
  );
  return {
    estiloNotificaciones: ajustes?.estilo ?? null,
    horaManana: ajustes?.horas.manana ?? HORAS_POR_DEFECTO.manana,
    saldo: monedero?.saldo ?? 0,
  };
}

/** Ajustes por defecto al elegir el modo tradicional (SDD 6.5). */
export async function guardarAjustesTradicionales(userId: string): Promise<void> {
  const ajustes = ajustesTradicionales(userId, await presupuestoTradicional());
  const { error } = await supabase.from('user_settings').upsert(ajustes, { onConflict: 'user_id' });
  if (error) throw error;
}
