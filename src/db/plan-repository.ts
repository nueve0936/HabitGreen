import { FunctionsFetchError } from '@supabase/supabase-js';

import { filasDelPlan, fechaLocal, type IdsPlan } from '@/features/plan/domain/plan-rows';
import { supabase } from '@/lib/supabase';
import { AREAS, type Area, type Respuestas } from '@/schemas/onboarding';
import { borradorPlanSchema, type BorradorPlan } from '@/schemas/plan';

// Repositorio del plan. Habla directo con Supabase: crear el plan exige conexión (definición 6),
// así que no pasa por la cola de salida. Al llegar a las pestañas, la sincronización lo descarga
// a SQLite.

export type ResultadoBorrador =
  { ok: true; borrador: BorradorPlan } | { ok: false; motivo: 'sin_conexion' | 'error' };

/** Pide el borrador a la Edge Function generate-plan. No guarda nada (SDD 5.8). */
export async function generarBorrador(respuestas: Respuestas): Promise<ResultadoBorrador> {
  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: { respuestas },
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
): Promise<void> {
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
    () => supabase.from('plans').upsert(filas.plan),
    () => supabase.from('habits').upsert(filas.habits),
    () => supabase.from('habit_schedules').upsert(filas.schedules),
    () => supabase.from('user_settings').upsert(filas.settings, { onConflict: 'user_id' }),
    () => supabase.from('onboarding_answers').upsert(filas.answers, { onConflict: 'user_id' }),
  ];
  for (const paso of pasos) {
    const { error } = await paso();
    if (error) throw error;
  }
}
