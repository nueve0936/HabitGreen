import { z } from 'zod';

import {
  ACOMPANAMIENTOS,
  AREAS,
  HISTORIALES,
  OBJETIVOS,
  OBSTACULOS,
  objetivoSchema,
} from './onboarding';

// Esquemas del plan (SDD 5.8–5.9). Los comparten la app y la Edge Function generate-plan: la
// función valida con ellos lo que devuelve la IA y la app valida el borrador que recibe. Igual que
// onboarding.ts, solo puede importar zod y archivos de esta carpeta.

/** Hora "HH:MM" de 00:00 a 23:59. */
export const horaSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const nivelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type Nivel = z.infer<typeof nivelSchema>;

export const habitoPlanSchema = z.object({
  objetivo: objetivoSchema,
  categoria: z.enum(AREAS),
  nivel: nivelSchema,
  variante: z.enum(['base', 'sin_recursos']),
  titulo: z.string().min(1),
  descripcion: z.string().nullable(),
  /** 0 = sin duración: un recordatorio que no gasta tiempo del día. */
  duracion_min: z.number().int().nonnegative(),
  usa_duracion_reducida: z.boolean(),
  dias_semana: z.array(z.number().int().min(1).max(7)).min(1),
  /** null si el recordatorio es flexible (momento `varia`). */
  hora: horaSchema.nullable(),
  flexible: z.boolean(),
  notificar: z.boolean(),
});
export type HabitoPlan = z.infer<typeof habitoPlanSchema>;

export const ajustesPlanSchema = z.object({
  presupuesto_min: z.number().int().positive(),
  estilo_notificaciones: z.enum(ACOMPANAMIENTOS),
  estrategias: z.array(z.enum(OBSTACULOS)),
  segundo_aviso: z.boolean(),
});
export type AjustesPlan = z.infer<typeof ajustesPlanSchema>;

/**
 * Lo que devuelve generate-plan: el plan sin guardar. `alternativas` trae, por objetivo, las
 * versiones de niveles más bajos (con textos del catálogo) para el botón «Bajar nivel».
 */
export const borradorPlanSchema = z.object({
  origen: z.enum(['ia', 'catalogo']),
  /** Resumen redactado por la IA; null si se usó el catálogo (la app muestra su texto). */
  resumen: z.string().nullable(),
  habitos: z.array(habitoPlanSchema).min(1),
  ajustes: ajustesPlanSchema,
  alternativas: z.partialRecord(objetivoSchema, z.array(habitoPlanSchema)),
  /**
   * Hábitos de nivel 1 de los objetivos no elegidos, para «Agregar otro hábito» en la revisión:
   * primero los de las áreas elegidas. Textos del catálogo.
   */
  sugerencias: z.array(habitoPlanSchema).default([]),
  /** Horas de los dos avisos de un hábito flexible (`app_config.horas_por_momento`). */
  ventana_flexible: z.object({ inicio: horaSchema, fin: horaSchema }),
});
export type BorradorPlan = z.infer<typeof borradorPlanSchema>;

// ---------------------------------------------------------------------------
// Respuesta de la IA (SDD 5.9): solo textos. Los números los pone el motor.
// ---------------------------------------------------------------------------

export const textoHabitoSchema = z.object({
  objetivo: z.enum(OBJETIVOS),
  titulo: z.string().min(3).max(30),
  descripcion: z.string().max(200),
});

export const respuestaIaSchema = z.object({
  resumen: z.string().max(300),
  habitos: z.array(textoHabitoSchema).min(1).max(2),
});
export type RespuestaIa = z.infer<typeof respuestaIaSchema>;

/**
 * Valida el JSON de la IA y que traiga exactamente los objetivos pedidos, una vez cada uno.
 * Devuelve null si no sirve (la función reintenta o usa el catálogo).
 */
export function leerRespuestaIa(json: unknown, objetivos: readonly string[]): RespuestaIa | null {
  const resultado = respuestaIaSchema.safeParse(json);
  if (!resultado.success) return null;
  const recibidos = resultado.data.habitos.map((h) => h.objetivo);
  const iguales =
    recibidos.length === objetivos.length &&
    new Set(recibidos).size === recibidos.length &&
    recibidos.every((o) => objetivos.includes(o));
  return iguales ? resultado.data : null;
}

// ---------------------------------------------------------------------------
// adjust-plan (SDD 6.3): la IA solo redacta el título y la descripción de un nivel nuevo o de un
// hábito que se agrega. El título base sale del catálogo en la Edge Function, no de la app.
// ---------------------------------------------------------------------------

export const peticionAjusteSchema = z.object({
  objetivo: objetivoSchema,
  nivel: nivelSchema,
  direccion: z.enum(['subir', 'bajar', 'nuevo']),
  /** Variante sin equipo ni espacio especial (P6 `recursos`). */
  sin_recursos: z.boolean(),
  duracion_min: z.number().int().nonnegative(),
  dias_semana: z.array(z.number().int().min(1).max(7)).min(1),
  historial: z.enum(HISTORIALES),
  obstaculo: z.enum(OBSTACULOS),
});
export type PeticionAjuste = z.infer<typeof peticionAjusteSchema>;

export const respuestaAjusteSchema = z.object({
  titulo: z.string().min(3).max(30),
  descripcion: z.string().max(200),
});
export type RespuestaAjuste = z.infer<typeof respuestaAjusteSchema>;
