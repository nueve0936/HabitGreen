import {
  estaVisible,
  horarioVigente,
  type Habito,
  type Horario,
} from '@/features/habits/domain/habitos-del-dia';
import { cabe as cabeEnLimite, limiteDelPlan } from '@/features/habits/domain/limite-habitos';
import { minutosPorDia, type CargaHabito } from '@/features/habits/domain/presupuesto';
import {
  elegirFilaCatalogo,
  habitoParaNivel,
  type ConfigPlan,
  type FilaCatalogo,
} from '@/features/plan/domain/plan-engine';
import {
  contar,
  type Conteo,
  type OcurrenciaEstadistica,
} from '@/features/stats/domain/cumplimiento';
import { diasEntre, sumarDias } from '@/lib/dates';
import { areaDeObjetivo, OBJETIVOS, type Objetivo, type Respuestas } from '@/schemas/onboarding';
import type { HabitoPlan, Nivel } from '@/schemas/plan';

// Progresión (SDD 6.3). Funciones puras: reciben lo que ya está en SQLite y deciden qué proponer.
// Solo entran los hábitos del plan (`objetivo` y `nivel`); los manuales nunca suben ni bajan.
//
// Decisiones del usuario (Entrega 8):
// - El cumplimiento se mide desde el último cambio de nivel (`nivel_desde`), como mucho en la
//   ventana normal (14 días, o 28 si el hábito es de 1 o 2 días por semana), hasta ayer.
// - Bajar es automático (con «Mantenerlo como estaba»); subir y el hábito nuevo se proponen.
// - El hábito nuevo es uno solo: el primer objetivo que aún no tienes, primero de tus áreas.
// Detalles: como mucho una propuesta de hábito nuevo (o «sin espacio») por revisión; con el límite
// de hábitos del plan alcanzado no se propone ninguno; quien está en su versión corta primero
// vuelve a la duración normal (salvo con `poco_tiempo`, donde la corta es la normal).

export type ConfigProgresion = {
  umbral_subir: number;
  umbral_bajar: number;
  ventana_dias: number;
  ventana_dias_baja_frecuencia: number;
  dias_por_semana_baja_frecuencia: number;
  minimo_ocurrencias: number;
  dias_entre_evaluaciones: number;
  limite_habitos_plan: number;
  dias_para_desbloqueo: number;
  ventana_desbloqueo_dias: number;
};

/** Los valores de `app_config.progresion`, por si todavía no se descargan. */
export const PROGRESION_POR_DEFECTO: ConfigProgresion = {
  umbral_subir: 0.85,
  umbral_bajar: 0.5,
  ventana_dias: 14,
  ventana_dias_baja_frecuencia: 28,
  dias_por_semana_baja_frecuencia: 2,
  minimo_ocurrencias: 4,
  dias_entre_evaluaciones: 7,
  limite_habitos_plan: 3,
  dias_para_desbloqueo: 90,
  ventana_desbloqueo_dias: 28,
};

/** Lo que cambia de un hábito al moverse de nivel (sale del catálogo). */
export type ValoresNivel = {
  nivel: Nivel;
  titulo: string;
  descripcion: string | null;
  duracion_min: number;
  usa_duracion_reducida: boolean;
  dias_semana: number[];
  nivel_desde: string | null;
};

export type Tarjeta =
  | {
      id: string;
      tipo: 'subir';
      habitId: string;
      objetivo: Objetivo;
      antes: ValoresNivel;
      despues: ValoresNivel;
    }
  | {
      id: string;
      tipo: 'bajar';
      habitId: string;
      objetivo: Objetivo;
      antes: ValoresNivel;
      despues: ValoresNivel;
    }
  | { id: string; tipo: 'apoyo'; habitId: string; titulo: string }
  | { id: string; tipo: 'nuevo'; habito: HabitoPlan }
  | { id: string; tipo: 'sin_espacio' };

export type EntradaProgresion = {
  hoy: string;
  /** Todos los hábitos (también manuales y archivados). */
  habitos: readonly Habito[];
  horarios: readonly Horario[];
  /** Ocurrencias de `historial` (reglas de 6.2). */
  ocurrencias: readonly OcurrenciaEstadistica[];
  catalogo: readonly FilaCatalogo[];
  respuestas: Respuestas;
  /** Para la hora del hábito nuevo (`habitoParaNivel`). */
  configPlan: ConfigPlan;
  presupuestoMin: number;
  limiteDesbloqueado: boolean;
  /** Queda lugar en el cupo total de hábitos (plan y propios juntos; ver `limite-habitos`). */
  hayLugarTotal: boolean;
  /**
   * Plan que se revisa (varios planes por usuario, uno por área): solo se evalúan sus hábitos y el
   * hábito nuevo se busca solo en su área. Sin él se revisan todos los hábitos del plan juntos.
   */
  planId?: string;
  config: ConfigProgresion;
};

const NIVELES: readonly Nivel[] = [1, 2, 3];
const esNivel = (n: unknown): n is Nivel => NIVELES.includes(n as Nivel);
const esObjetivo = (o: unknown): o is Objetivo => (OBJETIVOS as readonly unknown[]).includes(o);

/** Hábito del plan con nivel válido. */
export function esDelPlan(h: Habito): h is Habito & { objetivo: Objetivo; nivel: Nivel } {
  return esObjetivo(h.objetivo) && esNivel(h.nivel);
}

/** Pasaron los días entre revisiones desde la última (o desde que empezó el plan). */
export function tocaEvaluar(
  hoy: string,
  ultimaEvaluacion: string | null,
  inicioPlan: string | null,
  config: ConfigProgresion,
): boolean {
  const desde = ultimaEvaluacion ?? inicioPlan;
  return desde !== null && diasEntre(desde, hoy) >= config.dias_entre_evaluaciones;
}

/**
 * Hechos y programados de un hábito en su ventana: desde el cambio de nivel, como mucho los
 * últimos 14 días (28 con 1 o 2 días por semana), hasta ayer. Null si hay muy pocas ocurrencias.
 */
export function cumplimientoDe(
  habito: Pick<Habito, 'id' | 'nivel_desde'>,
  diasPorSemana: number,
  ocurrencias: readonly OcurrenciaEstadistica[],
  hoy: string,
  config: ConfigProgresion,
): Conteo | null {
  const dias =
    diasPorSemana <= config.dias_por_semana_baja_frecuencia
      ? config.ventana_dias_baja_frecuencia
      : config.ventana_dias;
  const inicioVentana = sumarDias(hoy, -dias);
  const desde =
    habito.nivel_desde && habito.nivel_desde > inicioVentana ? habito.nivel_desde : inicioVentana;
  const hasta = sumarDias(hoy, -1);
  const conteo = contar(
    ocurrencias.filter((o) => o.habitId === habito.id && o.fecha >= desde && o.fecha <= hasta),
  );
  return conteo.total < config.minimo_ocurrencias ? null : conteo;
}

/** Valores de un nivel del catálogo, con o sin la versión corta. */
export function valoresDeNivel(
  catalogo: readonly FilaCatalogo[],
  respuestas: Respuestas,
  objetivo: Objetivo,
  nivel: Nivel,
  reducida: boolean,
  nivelDesde: string | null,
): ValoresNivel {
  const fila = elegirFilaCatalogo(catalogo, objetivo, nivel, respuestas.obstaculo === 'recursos');
  return {
    nivel,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    duracion_min: reducida ? fila.duracion_reducida_min : fila.duracion_min,
    usa_duracion_reducida: reducida,
    dias_semana: [...fila.dias_semana],
    nivel_desde: nivelDesde,
  };
}

function valoresActuales(habito: Habito & { nivel: Nivel }, horario: Horario): ValoresNivel {
  return {
    nivel: habito.nivel,
    titulo: habito.titulo,
    descripcion: habito.descripcion,
    duracion_min: habito.duracion_min,
    usa_duracion_reducida: habito.usa_duracion_reducida ?? false,
    dias_semana: [...horario.dias_semana],
    nivel_desde: habito.nivel_desde ?? null,
  };
}

/** Cabe en el presupuesto: ningún día pasa de `presupuesto_min` con esta carga. */
export function cabe(otros: readonly CargaHabito[], carga: CargaHabito, presupuesto: number) {
  return Math.max(0, ...minutosPorDia([...otros, carga])) <= presupuesto;
}

/**
 * El hábito nuevo que se propone: el nivel 1 del primer objetivo que el usuario no tiene en el
 * plan (sin contar los archivados), primero de sus áreas, que quepa en el presupuesto.
 */
export function sugerenciaNueva(
  entrada: Pick<EntradaProgresion, 'catalogo' | 'respuestas' | 'configPlan' | 'planId'>,
  ocupados: ReadonlySet<string>,
  entraEnPresupuesto: (h: HabitoPlan) => boolean,
): HabitoPlan | null {
  const { catalogo, respuestas, configPlan } = entrada;
  const objetivos = [...new Set(catalogo.map((f) => f.objetivo))].filter((o) => !ocupados.has(o));
  const deSusAreas = (o: Objetivo) => respuestas.areas.includes(areaDeObjetivo(o));
  // Con un plan por área, otra área es otro plan: solo se sugiere de la misma área.
  const ordenados = entrada.planId
    ? objetivos.filter(deSusAreas)
    : [...objetivos.filter(deSusAreas), ...objetivos.filter((o) => !deSusAreas(o))];
  for (const objetivo of ordenados) {
    try {
      const habito = habitoParaNivel(respuestas, catalogo, configPlan, objetivo, 1);
      if (entraEnPresupuesto(habito)) return habito;
    } catch {
      // Objetivo sin fila de nivel 1: se salta.
    }
  }
  return null;
}

/** Siguiente paso hacia arriba: de la versión corta a la normal, o el siguiente nivel. */
function siguiente(
  habito: Habito & { objetivo: Objetivo; nivel: Nivel },
  entrada: EntradaProgresion,
): ValoresNivel | null {
  const pocoTiempo = entrada.respuestas.obstaculo === 'poco_tiempo';
  const { catalogo, respuestas, hoy } = entrada;
  if (habito.usa_duracion_reducida && !pocoTiempo) {
    return valoresDeNivel(catalogo, respuestas, habito.objetivo, habito.nivel, false, hoy);
  }
  if (habito.nivel >= 3) return null;
  const nivel = (habito.nivel + 1) as Nivel;
  return valoresDeNivel(catalogo, respuestas, habito.objetivo, nivel, pocoTiempo, hoy);
}

/**
 * Paso hacia abajo: el nivel anterior o, en el nivel 1, la versión corta. Null si ya no hay. Lo
 * usan la revisión (bajar) y «Hacerlo más ligero» del detalle del plan.
 */
export function pasoHaciaAbajo(
  habito: Habito & { objetivo: Objetivo; nivel: Nivel },
  entrada: EntradaProgresion,
): ValoresNivel | null {
  const pocoTiempo = entrada.respuestas.obstaculo === 'poco_tiempo';
  const { catalogo, respuestas, hoy } = entrada;
  if (habito.nivel > 1) {
    const nivel = (habito.nivel - 1) as Nivel;
    return valoresDeNivel(catalogo, respuestas, habito.objetivo, nivel, pocoTiempo, hoy);
  }
  // Sin duración no hay versión corta: en el nivel 1 solo queda el apoyo.
  if (habito.usa_duracion_reducida || habito.duracion_min === 0) return null;
  return valoresDeNivel(catalogo, respuestas, habito.objetivo, 1, true, hoy);
}

/** Las tarjetas de una revisión, en el orden de los hábitos. */
export function decidir(entrada: EntradaProgresion): Tarjeta[] {
  const { hoy, habitos, horarios, ocurrencias, config, presupuestoMin } = entrada;
  const conHorario = habitos.flatMap((habito) => {
    const horario = horarioVigente(
      horarios.filter((h) => h.habit_id === habito.id),
      hoy,
    );
    return horario && estaVisible(habito) ? [{ habito, horario }] : [];
  });
  const carga = (duracion: number, dias: readonly number[]): CargaHabito => ({
    duracion_min: duracion,
    dias_semana: dias,
  });
  const cargasSin = (id: string | null) =>
    conHorario
      .filter((c) => c.habito.id !== id)
      .map((c) => carga(c.habito.duracion_min ?? 0, c.horario.dias_semana));

  const delPlan = conHorario.filter(
    (c): c is { habito: Habito & { objetivo: Objetivo; nivel: Nivel }; horario: Horario } =>
      esDelPlan(c.habito) && (entrada.planId === undefined || c.habito.plan_id === entrada.planId),
  );

  const tarjetas: Tarjeta[] = [];
  let quiereNuevo = false;

  for (const { habito, horario } of delPlan) {
    const conteo = cumplimientoDe(habito, horario.dias_semana.length, ocurrencias, hoy, config);
    if (conteo === null) continue;
    const proporcion = conteo.hechos / conteo.total;

    if (proporcion >= config.umbral_subir) {
      const despues = siguiente(habito, entrada);
      if (
        despues &&
        cabe(cargasSin(habito.id), carga(despues.duracion_min, despues.dias_semana), presupuestoMin)
      ) {
        tarjetas.push({
          id: `subir-${habito.id}`,
          tipo: 'subir',
          habitId: habito.id,
          objetivo: habito.objetivo,
          antes: valoresActuales(habito, horario),
          despues,
        });
      } else {
        quiereNuevo = true;
      }
    } else if (proporcion < config.umbral_bajar) {
      const despues = pasoHaciaAbajo(habito, entrada);
      tarjetas.push(
        despues
          ? {
              id: `bajar-${habito.id}`,
              tipo: 'bajar',
              habitId: habito.id,
              objetivo: habito.objetivo,
              antes: valoresActuales(habito, horario),
              despues,
            }
          : { id: `apoyo-${habito.id}`, tipo: 'apoyo', habitId: habito.id, titulo: habito.titulo },
      );
    }
  }

  if (quiereNuevo) {
    // Tiene que caber en este plan y en el cupo total (plan y propios juntos).
    const hayLugar =
      entrada.hayLugarTotal &&
      cabeEnLimite(
        delPlan.length,
        limiteDelPlan({ desbloqueado: entrada.limiteDesbloqueado }, config.limite_habitos_plan),
      );
    if (hayLugar) {
      // No se repite un objetivo que ya está en el plan (aunque esté en pausa).
      const ocupados = new Set(
        habitos
          .filter((h) => esDelPlan(h) && h.archivado_en === null)
          .map((h) => String(h.objetivo)),
      );
      const otros = cargasSin(null);
      const nuevo = sugerenciaNueva(entrada, ocupados, (h) =>
        cabe(otros, carga(h.duracion_min, h.dias_semana), presupuestoMin),
      );
      tarjetas.push(
        nuevo
          ? { id: `nuevo-${nuevo.objetivo}`, tipo: 'nuevo', habito: nuevo }
          : { id: 'sin_espacio', tipo: 'sin_espacio' },
      );
    }
  }
  return tarjetas;
}

/**
 * Desbloqueo del límite de hábitos del plan: a los 90 días del plan, con 85 % o más de
 * cumplimiento de los hábitos del plan en los últimos 28 días.
 */
export function tocaDesbloquear(
  hoy: string,
  inicioPlan: string | null,
  yaDesbloqueado: boolean,
  habitos: readonly Habito[],
  ocurrencias: readonly OcurrenciaEstadistica[],
  config: ConfigProgresion,
): boolean {
  if (yaDesbloqueado || inicioPlan === null) return false;
  if (diasEntre(inicioPlan, hoy) < config.dias_para_desbloqueo) return false;
  const delPlan = new Set(habitos.filter(esDelPlan).map((h) => h.id));
  const desde = sumarDias(hoy, -config.ventana_desbloqueo_dias);
  const hasta = sumarDias(hoy, -1);
  const conteo = contar(
    ocurrencias.filter((o) => delPlan.has(o.habitId) && o.fecha >= desde && o.fecha <= hasta),
  );
  return conteo.total > 0 && conteo.hechos / conteo.total >= config.umbral_subir;
}
