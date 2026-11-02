import { z } from 'zod';

// Claves estables del formulario inicial (SDD 5.1–5.3). En la base de datos solo se guardan estas
// claves; los textos visibles viven en i18n. Este archivo se comparte con las Edge Functions, así
// que solo puede importar zod (nada de React Native ni de Expo).

export const VERSION_FORMULARIO = 3;
export const MAX_AREAS = 2;
export const MAX_OBJETIVOS = 2;

export const AREAS = ['salud_fisica', 'trabajo', 'salud_mental', 'finanzas', 'social'] as const;
export type Area = (typeof AREAS)[number];

export const OBJETIVOS_POR_AREA = {
  salud_fisica: ['mover_mas', 'dormir_mejor', 'comer_mejor', 'tomar_agua'],
  trabajo: ['organizar_dia', 'procrastinar_menos', 'aprender_algo'],
  salud_mental: ['manejar_estres', 'desconectar_pantallas', 'tiempo_para_mi'],
  finanzas: ['saber_gastos', 'empezar_ahorrar', 'evitar_impulsivas'],
  social: ['mantener_contacto', 'tiempo_de_calidad', 'conocer_gente'],
} as const satisfies Record<Area, readonly string[]>;

export const OBJETIVOS = [
  'mover_mas',
  'dormir_mejor',
  'comer_mejor',
  'tomar_agua',
  'organizar_dia',
  'procrastinar_menos',
  'aprender_algo',
  'manejar_estres',
  'desconectar_pantallas',
  'tiempo_para_mi',
  'saber_gastos',
  'empezar_ahorrar',
  'evitar_impulsivas',
  'mantener_contacto',
  'tiempo_de_calidad',
  'conocer_gente',
] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const HISTORIALES = [
  'primera_vez',
  'empieza_y_deja',
  'semanas_y_suelta',
  'mantiene',
] as const;
export type Historial = (typeof HISTORIALES)[number];

export const TIEMPOS = ['menos_10', '10_20', '20_40', 'mas_40'] as const;
export type Tiempo = (typeof TIEMPOS)[number];

export const MOMENTOS = ['manana', 'mediodia', 'tarde', 'noche', 'varia'] as const;
export type Momento = (typeof MOMENTOS)[number];
/** Momentos con hora concreta (todos menos `varia`); es lo que puede traer `momento_fijo`. */
export type MomentoConHora = Exclude<Momento, 'varia'>;

export const OBSTACULOS = [
  'poco_tiempo',
  'olvido',
  'motivacion',
  'desanimo',
  'distraccion',
  'recursos',
] as const;
export type Obstaculo = (typeof OBSTACULOS)[number];

export const ACOMPANAMIENTOS = [
  'resumen_nocturno',
  'recordatorio_suave',
  'recordatorio_y_animo',
  'minimo',
] as const;
export type Acompanamiento = (typeof ACOMPANAMIENTOS)[number];

export const areaSchema = z.enum(AREAS);
export const objetivoSchema = z.enum(OBJETIVOS);

/** Área a la que pertenece un objetivo. */
export function areaDeObjetivo(objetivo: Objetivo): Area {
  const area = AREAS.find((a) => (OBJETIVOS_POR_AREA[a] as readonly string[]).includes(objetivo));
  // Cada objetivo está en exactamente un área; si no, el catálogo de claves está mal escrito.
  if (area === undefined) throw new Error(`Objetivo sin área: ${objetivo}`);
  return area;
}

function sinRepetidos(lista: readonly string[]): boolean {
  return new Set(lista).size === lista.length;
}

export const respuestasSchema = z
  .object({
    areas: z.array(areaSchema).min(1).max(MAX_AREAS).refine(sinRepetidos),
    objetivos: z.array(objetivoSchema).min(1).max(MAX_OBJETIVOS).refine(sinRepetidos),
    historial: z.enum(HISTORIALES),
    tiempo: z.enum(TIEMPOS),
    momento: z.enum(MOMENTOS),
    obstaculo: z.enum(OBSTACULOS),
    acompanamiento: z.enum(ACOMPANAMIENTOS),
  })
  .refine((r) => r.objetivos.every((o) => r.areas.includes(areaDeObjetivo(o))), {
    message: 'Cada objetivo debe pertenecer a un área elegida.',
    path: ['objetivos'],
  });

export type Respuestas = z.infer<typeof respuestasSchema>;
