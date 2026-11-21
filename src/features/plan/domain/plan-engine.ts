import {
  areaDeObjetivo,
  type Area,
  type Historial,
  type MomentoConHora,
  type Objetivo,
  type Respuestas,
  type Tiempo,
} from '../../../schemas/onboarding';
import type {
  AjustesPlan,
  BorradorPlan,
  HabitoPlan,
  Nivel,
  RespuestaIa,
} from '../../../schemas/plan';

// Motor del plan (SDD 5.4–5.6): convierte las respuestas del formulario en hábitos con nivel,
// duración, días y hora. Es determinista: los números salen de aquí y del catálogo semilla; la IA
// solo cambia textos después. Se comparte con la Edge Function generate-plan, así que usa imports
// relativos y no depende de React Native.

export type { AjustesPlan, HabitoPlan, Nivel };

/** Una fila de `habit_catalog`. */
export type FilaCatalogo = {
  objetivo: Objetivo;
  categoria: Area;
  nivel: Nivel;
  variante: 'base' | 'sin_recursos';
  titulo: string;
  descripcion: string | null;
  duracion_min: number;
  duracion_reducida_min: number;
  dias_semana: number[];
  momento_fijo: MomentoConHora | null;
  sin_recursos: boolean;
};

/** Valores de `app_config` que usa el motor. */
export type ConfigPlan = {
  presupuestos: Record<Tiempo, number>;
  /** Hora "HH:MM" de cada momento (`horas_por_momento`). */
  horas: Record<MomentoConHora, string>;
};

export type PlanMotor = {
  habitos: HabitoPlan[];
  ajustes: AjustesPlan;
};

export function nivelInicial(historial: Historial): Nivel {
  return historial === 'mantiene' ? 2 : 1;
}

/**
 * Fila del catálogo para un objetivo y nivel. Con `soloSinRecursos` se usa la variante
 * `sin_recursos` cuando la fila base necesita equipo o espacio.
 */
export function elegirFilaCatalogo(
  catalogo: readonly FilaCatalogo[],
  objetivo: Objetivo,
  nivel: Nivel,
  soloSinRecursos: boolean,
): FilaCatalogo {
  const filas = catalogo.filter((f) => f.objetivo === objetivo && f.nivel === nivel);
  const base = filas.find((f) => f.variante === 'base');
  const variante = filas.find((f) => f.variante === 'sin_recursos');
  const fila = soloSinRecursos && base && !base.sin_recursos ? (variante ?? base) : base;
  if (fila === undefined) {
    throw new Error(`Falta en el catálogo: ${objetivo} nivel ${nivel}`);
  }
  return fila;
}

/**
 * Segundo aviso según la precedencia P7/P6 (SDD 5.6): solo con `olvido`, con un estilo que ya avisa
 * por hábito y sin momento flexible (la ventana flexible ya tiene dos avisos).
 */
export function usaSegundoAviso(r: Respuestas): boolean {
  return (
    r.obstaculo === 'olvido' &&
    (r.acompanamiento === 'recordatorio_suave' || r.acompanamiento === 'recordatorio_y_animo') &&
    r.momento !== 'varia'
  );
}

/** Hábito de un objetivo en un nivel concreto, con las reglas de la P5, la P6 y la P7. */
export function habitoParaNivel(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
  objetivo: Objetivo,
  nivel: Nivel,
): HabitoPlan {
  const reducida = respuestas.obstaculo === 'poco_tiempo';
  const fila = elegirFilaCatalogo(catalogo, objetivo, nivel, respuestas.obstaculo === 'recursos');

  // El momento fijo del catálogo gana sobre la P5; sin ninguno de los dos, el aviso es flexible.
  const momento = fila.momento_fijo ?? (respuestas.momento === 'varia' ? null : respuestas.momento);

  return {
    objetivo,
    categoria: areaDeObjetivo(objetivo),
    nivel,
    variante: fila.variante,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    duracion_min: reducida ? fila.duracion_reducida_min : fila.duracion_min,
    usa_duracion_reducida: reducida,
    dias_semana: [...fila.dias_semana],
    hora: momento === null ? null : config.horas[momento],
    flexible: momento === null,
    // Con el estilo `minimo` solo avisan los hábitos que el usuario marque (SDD 7.1).
    notificar: respuestas.acompanamiento !== 'minimo',
  };
}

export function generarPlan(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
): PlanMotor {
  const presupuesto = config.presupuestos[respuestas.tiempo];
  const inicial = nivelInicial(respuestas.historial);
  // Los hábitos sin duración (recordatorios) no gastan tiempo: el tiempo diario se reparte solo
  // entre los que tienen minutos en su nivel inicial.
  const conDuracion = respuestas.objetivos.filter(
    (objetivo) => habitoParaNivel(respuestas, catalogo, config, objetivo, inicial).duracion_min > 0,
  ).length;
  const maxPorHabito = presupuesto / Math.max(1, conDuracion);

  const habitos = respuestas.objetivos.map((objetivo): HabitoPlan => {
    // Se empieza en el nivel inicial y se baja mientras la duración no quepa. El nivel 1 dura
    // 5 minutos o menos, así que siempre cabe (SDD 5.4, regla 2).
    let nivel = inicial;
    let habito = habitoParaNivel(respuestas, catalogo, config, objetivo, nivel);
    while (nivel > 1 && habito.duracion_min > maxPorHabito) {
      nivel = (nivel - 1) as Nivel;
      habito = habitoParaNivel(respuestas, catalogo, config, objetivo, nivel);
    }
    return habito;
  });

  return {
    habitos,
    ajustes: {
      presupuesto_min: presupuesto,
      estilo_notificaciones: respuestas.acompanamiento,
      estrategias: [respuestas.obstaculo],
      segundo_aviso: usaSegundoAviso(respuestas),
    },
  };
}

/** Versiones de los niveles más bajos de cada hábito, para «Bajar nivel» en la revisión. */
export function alternativasDeNivel(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
  habitos: readonly HabitoPlan[],
): BorradorPlan['alternativas'] {
  const alternativas: BorradorPlan['alternativas'] = {};
  for (const habito of habitos) {
    const niveles = ([1, 2, 3] as const).filter((n) => n < habito.nivel);
    alternativas[habito.objetivo] = niveles.map((n) =>
      habitoParaNivel(respuestas, catalogo, config, habito.objetivo, n),
    );
  }
  return alternativas;
}

/**
 * Sugerencias para «Agregar otro hábito»: el nivel 1 de cada objetivo que el usuario no eligió,
 * con las mismas reglas de la P5, la P6 y la P7. Primero las de las áreas elegidas.
 */
export function sugerenciasDeHabitos(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
): HabitoPlan[] {
  const objetivos = [...new Set(catalogo.map((f) => f.objetivo))].filter(
    (o) => !respuestas.objetivos.includes(o),
  );
  const deSusAreas = (o: Objetivo) => respuestas.areas.includes(areaDeObjetivo(o));
  const ordenados = [...objetivos.filter(deSusAreas), ...objetivos.filter((o) => !deSusAreas(o))];
  return ordenados.flatMap((objetivo) => {
    try {
      return [habitoParaNivel(respuestas, catalogo, config, objetivo, 1)];
    } catch {
      return [];
    }
  });
}

/** Mensaje para la IA (docs/textos.md 8): solo claves y números, nunca datos personales. */
export function mensajeParaIa(respuestas: Respuestas, habitos: readonly HabitoPlan[]): string {
  return JSON.stringify({
    historial: respuestas.historial,
    obstaculo: respuestas.obstaculo,
    habitos: habitos.map((h) => ({
      objetivo: h.objetivo,
      nivel: h.nivel,
      titulo_base: h.titulo,
      duracion_min: h.duracion_min,
      dias_semana: h.dias_semana,
    })),
  });
}

/** Cambia solo el título y la descripción de cada hábito por los de la IA. */
export function aplicarTextosIa(habitos: readonly HabitoPlan[], textos: RespuestaIa): HabitoPlan[] {
  return habitos.map((h) => {
    const texto = textos.habitos.find((t) => t.objetivo === h.objetivo);
    return texto ? { ...h, titulo: texto.titulo, descripcion: texto.descripcion } : h;
  });
}
