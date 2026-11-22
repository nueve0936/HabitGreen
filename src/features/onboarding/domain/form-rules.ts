import {
  areaDeObjetivo,
  MAX_AREAS_POR_PLAN,
  MAX_OBJETIVOS,
  OBJETIVOS_POR_AREA,
  respuestasSchema,
  type Area,
  type Objetivo,
  type Respuestas,
} from '@/schemas/onboarding';

// Reglas del formulario de 7 pasos (SDD 5.3), separadas de las pantallas para poder probarlas.

export const TOTAL_PASOS = 7;
export type Paso = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Respuestas a medio llenar: las listas empiezan vacías y las preguntas únicas, sin valor. */
export type Borrador = {
  areas: Area[];
  objetivos: Objetivo[];
  historial?: Respuestas['historial'];
  tiempo?: Respuestas['tiempo'];
  momento?: Respuestas['momento'];
  obstaculo?: Respuestas['obstaculo'];
  acompanamiento?: Respuestas['acompanamiento'];
};

export const BORRADOR_VACIO: Borrador = { areas: [], objetivos: [] };

/**
 * Marca o desmarca un valor en una pregunta de «hasta N». Si ya hay N elegidos, el nuevo entra y
 * sale el primero que se eligió (decisión del usuario: sin advertencia, la selección se recorre).
 */
export function alternarSeleccion<T>(lista: readonly T[], valor: T, max: number): T[] {
  if (lista.includes(valor)) return lista.filter((v) => v !== valor);
  return [...lista, valor].slice(-max);
}

/** Elige o quita un área y descarta los objetivos que ya no pertenecen a las áreas elegidas. */
export function alternarArea(
  borrador: Borrador,
  area: Area,
): { areas: Area[]; objetivos: Objetivo[] } {
  const areas = alternarSeleccion(borrador.areas, area, MAX_AREAS_POR_PLAN);
  const objetivos = borrador.objetivos.filter((o) => areas.includes(areaDeObjetivo(o)));
  return { areas, objetivos };
}

export function alternarObjetivo(borrador: Borrador, objetivo: Objetivo): Objetivo[] {
  return alternarSeleccion(borrador.objetivos, objetivo, MAX_OBJETIVOS);
}

/** Objetivos que se muestran en la pregunta 2, agrupados por las áreas elegidas. */
export function objetivosPorAreaElegida(
  areas: readonly Area[],
): { area: Area; objetivos: readonly Objetivo[] }[] {
  return areas.map((area) => ({ area, objetivos: OBJETIVOS_POR_AREA[area] }));
}

/**
 * Pasos del formulario: el primer plan pregunta las 7; los planes siguientes solo las del área
 * (P1 área, P2 objetivos y P3 historial) y reusan las globales (P4 a P7) ya guardadas.
 */
export const PASOS_PLAN_ADICIONAL = 3;

export function totalPasos(adicional: boolean): number {
  return adicional ? PASOS_PLAN_ADICIONAL : TOTAL_PASOS;
}

/** Verdadero si la respuesta del paso permite continuar. */
export function pasoCompleto(paso: Paso, b: Borrador): boolean {
  switch (paso) {
    case 1:
      return b.areas.length > 0;
    case 2:
      return b.objetivos.length > 0;
    case 3:
      return b.historial !== undefined;
    case 4:
      return b.tiempo !== undefined;
    case 5:
      return b.momento !== undefined;
    case 6:
      return b.obstaculo !== undefined;
    case 7:
      return b.acompanamiento !== undefined;
  }
}

/** Convierte el borrador en respuestas válidas, o null si falta algo o no cumple las reglas. */
export function respuestasCompletas(b: Borrador): Respuestas | null {
  const resultado = respuestasSchema.safeParse(b);
  return resultado.success ? resultado.data : null;
}

/** Lee el número de paso de la ruta; cualquier valor raro vuelve al paso 1. */
export function leerPaso(valor: string | string[] | undefined): Paso {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(n) && n >= 1 && n <= TOTAL_PASOS ? (n as Paso) : 1;
}
