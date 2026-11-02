import { ajustesTradicionales } from '@/features/plan/domain/plan-rows';
import { supabase } from '@/lib/supabase';

// Ajustes por defecto del modo tradicional (`user_settings`). Se guardan directo en Supabase
// porque elegir el modo ya requiere conexión; al llegar a las pestañas, la sincronización los
// descarga a SQLite junto con `app_config`.

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
