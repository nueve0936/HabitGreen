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
  /** Ya pagó monedas hoy y no se devolvieron completas (o se eliminó): no vuelve a pagar. */
  monedas_sin_devolver: boolean;
};

/** Lo que cambia con un check-in: la planta de la categoría del hábito, el saldo y los logs. */
export type EstadoDia = {
  planta: Planta;
  saldo: number;
  logs: LogDelDia[];
  /** Hábitos desmarcados hoy cuyo pago no se devolvió: siguen contando para el tope. */
  deshechosSinDevolver: string[];
};

export type ResultadoRecompensa = {
  estado: EstadoDia;
  /** Este check-in dio monedas. */
  monedas: boolean;
  /** Por qué no dio monedas al completar. */
  sinMonedas: 'tope' | 'ya_pagado' | null;
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

function resultado(
  antes: EstadoDia,
  despues: EstadoDia,
  monedas: boolean,
  sinMonedas: ResultadoRecompensa['sinMonedas'] = null,
): ResultadoRecompensa {
  const cambio = despues.planta.fase !== antes.planta.fase ? despues.planta.fase : null;
  return { estado: despues, monedas, sinMonedas, cambioFase: cambio };
}

/** Pagos que cuentan para el tope del día: los activos y los que no se devolvieron. */
function pagosDelDia(estado: EstadoDia, sinContar: string): number {
  const activos = estado.logs.filter(
    (l) => l.habit_id !== sinContar && (l.monedas_otorgadas || l.monedas_sin_devolver),
  ).length;
  const deshechos = estado.deshechosSinDevolver.filter((id) => id !== sinContar).length;
  return activos + deshechos;
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
  const darXp =
    estado.planta.nivel < c.nivel_maximo && conXp < c.tope_habitos_con_xp_por_planta_dia;

  const yaPagado = nuevo.monedas_sin_devolver;
  const hayLugar = pagosDelDia(estado, nuevo.habit_id) < c.tope_habitos_con_monedas_dia;
  const darMonedas = !yaPagado && hayLugar;

  const despues: EstadoDia = {
    planta: darXp ? plantaConXp(estado.planta, c.xp_por_habito, c) : estado.planta,
    saldo: estado.saldo + (darMonedas ? c.monedas_por_habito : 0),
    logs: [
      ...estado.logs.filter((l) => l.habit_id !== nuevo.habit_id),
      { ...nuevo, xp_otorgado: darXp, monedas_otorgadas: darMonedas },
    ],
    deshechosSinDevolver: estado.deshechosSinDevolver.filter((id) => id !== nuevo.habit_id),
  };
  const motivo = darMonedas ? null : yaPagado ? 'ya_pagado' : 'tope';
  return resultado(estado, despues, darMonedas, motivo);
}

/**
 * Deshacer: revierte lo que dio ese registro. Las monedas se devuelven hasta donde alcance el
 * saldo (nunca baja de 0). Si se devolvieron completas, el lugar queda libre para otro registro
 * del día que se quedó sin ellas; si no, ese pago sigue contando y el hábito no vuelve a pagar hoy.
 */
export function aplicarDeshacer(
  estado: EstadoDia,
  habitId: string,
  c: ConfigRecompensas,
): ResultadoRecompensa {
  const log = estado.logs.find((l) => l.habit_id === habitId);
  if (log === undefined) return resultado(estado, estado, false);

  let planta = estado.planta;
  let saldo = estado.saldo;
  let sinDevolver = log.monedas_sin_devolver;
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
    const devuelto = Math.min(saldo, c.monedas_por_habito);
    saldo -= devuelto;
    if (devuelto < c.monedas_por_habito) {
      sinDevolver = true;
    } else {
      const otro = logs.find((l) => !l.monedas_otorgadas && !l.monedas_sin_devolver);
      if (otro) {
        saldo += c.monedas_por_habito;
        otro.monedas_otorgadas = true;
      }
    }
  }

  const despues: EstadoDia = {
    planta,
    saldo,
    logs,
    deshechosSinDevolver: sinDevolver
      ? [...estado.deshechosSinDevolver.filter((id) => id !== habitId), habitId]
      : estado.deshechosSinDevolver,
  };
  return resultado(estado, despues, log.monedas_otorgadas);
}

/**
 * Eliminar un hábito marcado: devuelve sus monedas hasta donde alcance el saldo. El registro y el
 * XP se conservan, y ese pago sigue contando para el tope del día.
 */
export function aplicarArchivar(
  estado: EstadoDia,
  habitId: string,
  c: ConfigRecompensas,
): EstadoDia {
  const log = estado.logs.find((l) => l.habit_id === habitId);
  if (log === undefined || !log.monedas_otorgadas) return estado;
  return {
    ...estado,
    saldo: estado.saldo - Math.min(estado.saldo, c.monedas_por_habito),
    logs: estado.logs.map((l) =>
      l.habit_id === habitId ? { ...l, monedas_otorgadas: false, monedas_sin_devolver: true } : l,
    ),
  };
}
