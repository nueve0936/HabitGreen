import { ajustesTradicionales } from '@/features/plan/domain/plan-rows';
import { supabase } from '@/lib/supabase';

import { getDb } from './database';

// Ajustes del usuario (`user_settings`). Los por defecto del modo tradicional se guardan directo
// en Supabase porque elegir el modo ya requiere conexión; al llegar a las pestañas, la
// sincronización los descarga a SQLite junto con `app_config`, y desde ahí se leen.

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

export type AjustesLocales = {
  estiloNotificaciones: string | null;
  /** Saldo del monedero; 0 hasta que lleguen las recompensas (Entrega 4). */
  saldo: number;
};

/** Ajustes y saldo desde SQLite, para Hoy y el formulario de hábito (funciona sin conexión). */
export async function leerAjustesLocales(userId: string): Promise<AjustesLocales> {
  const db = await getDb();
  const ajustes = await db.getFirstAsync<{ estilo_notificaciones: string }>(
    'SELECT estilo_notificaciones FROM user_settings WHERE user_id = ?',
    [userId],
  );
  const monedero = await db.getFirstAsync<{ saldo: number }>(
    'SELECT saldo FROM wallets WHERE user_id = ?',
    [userId],
  );
  return {
    estiloNotificaciones: ajustes?.estilo_notificaciones ?? null,
    saldo: monedero?.saldo ?? 0,
  };
}

/** Ajustes por defecto al elegir el modo tradicional (SDD 6.5). */
export async function guardarAjustesTradicionales(userId: string): Promise<void> {
  const ajustes = ajustesTradicionales(userId, await presupuestoTradicional());
  const { error } = await supabase.from('user_settings').upsert(ajustes, { onConflict: 'user_id' });
  if (error) throw error;
}
