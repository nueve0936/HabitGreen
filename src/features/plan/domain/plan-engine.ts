import {
  areaDeObjetivo,
  type Acompanamiento,
  type Area,
  type Historial,
  type MomentoConHora,
  type Objetivo,
  type Obstaculo,
  type Respuestas,
  type Tiempo,
} from '../../../schemas/onboarding';

// Motor del plan (SDD 5.4–5.6): convierte las respuestas del formulario en hábitos con nivel,
// duración, días y hora. Es determinista: los números salen de aquí y del catálogo semilla; la IA
// solo cambia textos después. Se comparte con la Edge Function generate-plan, así que usa imports
// relativos y no depende de React Native.

export type Nivel = 1 | 2 | 3;

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

export type HabitoPlan = {
  objetivo: Objetivo;
  categoria: Area;
  nivel: Nivel;
  variante: FilaCatalogo['variante'];
  titulo: string;
  descripcion: string | null;
  duracion_min: number;
  usa_duracion_reducida: boolean;
  dias_semana: number[];
  /** "HH:MM", o null si el recordatorio es flexible (momento `varia`). */
  hora: string | null;
  flexible: boolean;
  notificar: boolean;
};

export type AjustesPlan = {
  presupuesto_min: number;
  estilo_notificaciones: Acompanamiento;
  estrategias: Obstaculo[];
  segundo_aviso: boolean;
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

export function generarPlan(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
): PlanMotor {
  const presupuesto = config.presupuestos[respuestas.tiempo];
  const maxPorHabito = presupuesto / respuestas.objetivos.length;
  const reducida = respuestas.obstaculo === 'poco_tiempo';
  const soloSinRecursos = respuestas.obstaculo === 'recursos';

  const habitos = respuestas.objetivos.map((objetivo): HabitoPlan => {
    // Se empieza en el nivel inicial y se baja mientras la duración no quepa. El nivel 1 dura
    // 5 minutos o menos, así que siempre cabe (SDD 5.4, regla 2).
    let nivel = nivelInicial(respuestas.historial);
    let fila = elegirFilaCatalogo(catalogo, objetivo, nivel, soloSinRecursos);
    while (nivel > 1 && duracion(fila, reducida) > maxPorHabito) {
      nivel = (nivel - 1) as Nivel;
      fila = elegirFilaCatalogo(catalogo, objetivo, nivel, soloSinRecursos);
    }

    // El momento fijo del catálogo gana sobre la P5; sin ninguno de los dos, el aviso es flexible.
    const momento =
      fila.momento_fijo ?? (respuestas.momento === 'varia' ? null : respuestas.momento);

    return {
      objetivo,
      categoria: areaDeObjetivo(objetivo),
      nivel,
      variante: fila.variante,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      duracion_min: duracion(fila, reducida),
      usa_duracion_reducida: reducida,
      dias_semana: [...fila.dias_semana],
      hora: momento === null ? null : config.horas[momento],
      flexible: momento === null,
      // Con el estilo `minimo` solo avisan los hábitos que el usuario marque (SDD 7.1).
      notificar: respuestas.acompanamiento !== 'minimo',
    };
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

function duracion(fila: FilaCatalogo, reducida: boolean): number {
  return reducida ? fila.duracion_reducida_min : fila.duracion_min;
}
