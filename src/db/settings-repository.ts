import { ajustesTradicionales } from '@/features/plan/domain/plan-rows';
import { supabase } from '@/lib/supabase';

// Ajustes del usuario (`user_settings`). Por ahora directo en Supabase; en la Entrega 3 pasa a
// SQLite. `app_config` se lee del servidor hasta que exista el caché local (SDD 3.2).

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

/** Ajustes por defecto al elegir el modo tradicional (SDD 6.5). */
export async function guardarAjustesTradicionales(userId: string): Promise<void> {
  const ajustes = ajustesTradicionales(userId, await presupuestoTradicional());
  const { error } = await supabase.from('user_settings').upsert(ajustes, { onConflict: 'user_id' });
  if (error) throw error;
}
