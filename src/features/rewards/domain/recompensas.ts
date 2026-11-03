// Recompensas en el teléfono (SDD 6.1): replica lo que hacen las RPC complete_habit y
// uncomplete_habit para responder al instante sin conexión. El servidor es la fuente de verdad:
// al sincronizar, sus valores reemplazan a estos. Funciones puras, sin acceso a la base.

export type ConfigRecompensas = {
  xp_por_habito: number;
  xp_por_nivel: number;
  nivel_maximo: number;
  nivel_inicio_fase_2: number;
  nivel_inicio_fase_3: number;
  tope_habitos_con_xp_por_planta_dia: number;
  monedas_por_habito: number;
  tope_habitos_con_monedas_dia: number;
};

/** Los mismos valores de la semilla de app_config, por si todavía no se descargó. */
export const RECOMPENSAS_POR_DEFECTO: ConfigRecompensas = {
  xp_por_habito: 2,
  xp_por_nivel: 4,
  nivel_maximo: 30,
  nivel_inicio_fase_2: 15,
  nivel_inicio_fase_3: 30,
  tope_habitos_con_xp_por_planta_dia: 1,
  monedas_por_habito: 10,
  tope_habitos_con_monedas_dia: 5,
};

export type Planta = { xp: number; nivel: number; fase: number };

/** Registro activo (no deshecho) de la fecha. */
export type LogDelDia = {
  id: string;
  habit_id: string;
  category_id: string;
  completado_en: string;
  xp_otorgado: boolean;
  monedas_otorgadas: boolean;
};

/** Lo que cambia con un check-in: la planta de la categoría del hábito, el saldo y los logs. */
export type EstadoDia = { planta: Planta; saldo: number; logs: LogDelDia[] };

export type ResultadoRecompensa = {
  estado: EstadoDia;
  /** Este check-in dio monedas (si es falso al completar, se llegó al tope del día). */
  monedas: boolean;
  /** Fase nueva si la planta cambió de fase. */
  cambioFase: number | null;
};

export function faseDeNivel(nivel: number, c: ConfigRecompensas): number {
  if (nivel >= c.nivel_inicio_fase_3) return 3;
  if (nivel >= c.nivel_inicio_fase_2) return 2;
  return 1;
}

export function plantaConXp(planta: Planta, delta: number, c: ConfigRecompensas): Planta {
  const xp = Math.max(0, planta.xp + delta);
  const nivel = Math.min(c.nivel_maximo, Math.floor(xp / c.xp_por_nivel));
  return { xp, nivel, fase: faseDeNivel(nivel, c) };
}

function porHora(a: LogDelDia, b: LogDelDia): number {
  return a.completado_en.localeCompare(b.completado_en);
}

function resultado(antes: EstadoDia, despues: EstadoDia, monedas: boolean): ResultadoRecompensa {
  const cambio = despues.planta.fase !== antes.planta.fase ? despues.planta.fase : null;
  return { estado: despues, monedas, cambioFase: cambio };
}

/** Completar: `nuevo` llega sin marcas; se le dan XP y monedas si los topes lo permiten. */
export function aplicarCompletar(
  estado: EstadoDia,
  nuevo: LogDelDia,
  c: ConfigRecompensas,
): ResultadoRecompensa {
  const conXp = estado.logs.filter(
    (l) => l.category_id === nuevo.category_id && l.xp_otorgado,
  ).length;
  const conMonedas = estado.logs.filter((l) => l.monedas_otorgadas).length;

  const darXp =
    estado.planta.nivel < c.nivel_maximo && conXp < c.tope_habitos_con_xp_por_planta_dia;
  const darMonedas = conMonedas < c.tope_habitos_con_monedas_dia;

  const despues: EstadoDia = {
    planta: darXp ? plantaConXp(estado.planta, c.xp_por_habito, c) : estado.planta,
    saldo: estado.saldo + (darMonedas ? c.monedas_por_habito : 0),
    logs: [
      ...estado.logs.filter((l) => l.habit_id !== nuevo.habit_id),
      { ...nuevo, xp_otorgado: darXp, monedas_otorgadas: darMonedas },
    ],
  };
  return resultado(estado, despues, darMonedas);
}

/**
 * Deshacer: revierte lo que dio ese registro y, si otro del mismo día se había quedado sin XP o
 * sin monedas por el tope, ahora los recibe. El saldo nunca baja de 0.
 */
export function aplicarDeshacer(
  estado: EstadoDia,
  habitId: string,
  c: ConfigRecompensas,
): ResultadoRecompensa {
  const log = estado.logs.find((l) => l.habit_id === habitId);
  if (log === undefined) return { estado, monedas: false, cambioFase: null };

  let planta = estado.planta;
  let saldo = estado.saldo;
  const logs = estado.logs
    .filter((l) => l.habit_id !== habitId)
    .sort(porHora)
    .map((l) => ({ ...l }));

  if (log.xp_otorgado) {
    planta = plantaConXp(planta, -c.xp_por_habito, c);
    const otro = logs.find((l) => l.category_id === log.category_id && !l.xp_otorgado);
    if (otro) {
      planta = plantaConXp(planta, c.xp_por_habito, c);
      otro.xp_otorgado = true;
    }
  }

  if (log.monedas_otorgadas) {
    saldo -= Math.min(saldo, c.monedas_por_habito);
    const otro = logs.find((l) => !l.monedas_otorgadas);
    if (otro) {
      saldo += c.monedas_por_habito;
      otro.monedas_otorgadas = true;
    }
  }

  return resultado(estado, { planta, saldo, logs }, log.monedas_otorgadas);
}
