import {
  habitosDelDia,
  type Habito,
  type HabitoDelDia,
  type Horario,
  type Ocurrencia,
  type Registro,
} from '@/features/habits/domain/habitos-del-dia';
import { textoDuracion } from '@/features/habits/domain/formato';
import { horaCorta } from '@/features/habits/domain/horario';
import { es, formatear } from '@/i18n/es';
import { diaIso, fechaLocal, sumarDias } from '@/lib/dates';
import type { Acompanamiento, Momento, Obstaculo } from '@/schemas/onboarding';

import { semanaDeApoyoEnPlanes, type PlanApoyo } from './semana-apoyo';

// Qué avisos programar (SDD 5.6 y 7.1). Función pura: recibe lo que hay en SQLite y la hora actual
// y devuelve los avisos de la ventana de 7 días con su texto ya resuelto. Cada vez que algo cambia
// se vuelve a calcular todo, así que completar un hábito quita su segundo aviso sin más.

export type MomentoAviso = 'manana' | 'mediodia' | 'tarde' | 'noche' | 'resumen_nocturno';
/** Hora "HH:MM" de cada momento: las de Perfil sobre las de `app_config`. */
export type HorasAvisos = Record<MomentoAviso, string>;

export const HORAS_POR_DEFECTO: HorasAvisos = {
  manana: '08:00',
  mediodia: '13:00',
  tarde: '17:00',
  noche: '20:30',
  resumen_nocturno: '21:00',
};

/** `app_config.notificaciones`. */
export type ConfigAvisos = {
  ventana_dias: number;
  tope_programadas: number;
  horas_segundo_aviso: number;
};

export const AVISOS_POR_DEFECTO: ConfigAvisos = {
  ventana_dias: 7,
  tope_programadas: 60,
  horas_segundo_aviso: 2,
};

// La ventana flexible empieza a la hora de «Tarde» y su segundo aviso llega 3 h después
// (17:00 y 20:00 por defecto), así sigue la hora que la persona elija en Perfil.
const HORAS_SEGUNDO_FLEXIBLE = 3;

export type DatosAvisos = {
  estilo: Acompanamiento;
  estrategias: readonly Obstaculo[];
  segundoAviso: boolean;
  horas: HorasAvisos;
  config: ConfigAvisos;
  /** P5 del formulario; null en modo tradicional. */
  momento: Momento | null;
  /** Planes activos con su historial (P3) y su inicio, para el apoyo de las semanas 3 y 4. */
  planes: readonly PlanApoyo[];
  habitos: readonly Habito[];
  horarios: readonly Horario[];
  ocurrencias: readonly Ocurrencia[];
  registros: readonly Registro[];
};

export type AvisoPlaneado = {
  id: string;
  fecha: Date;
  titulo: string;
  cuerpo: string;
  habitId: string | null;
};

/** Date local de una fecha "YYYY-MM-DD" a una hora "HH:MM", más los minutos indicados. */
export function fechaHora(fecha: string, hora: string, minutosExtra = 0): Date {
  const [y = 0, m = 1, d = 1] = fecha.split('-').map(Number);
  const [hh = 0, mm = 0] = hora.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm + minutosExtra, 0, 0);
}

/** «a», «a y b», «a, b y c». */
function lista(nombres: readonly string[]): string {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} ${es.avisos.y} ${nombres.at(-1)}`;
}

function numeroDeDia(fecha: string): number {
  const [y = 0, m = 1, d = 1] = fecha.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function semilla(texto: string): number {
  let suma = 0;
  for (const letra of texto) suma += letra.charCodeAt(0);
  return suma;
}

/**
 * Mensaje de ánimo rotativo: depende de la fecha y del hábito, así que cambia cada día (nunca se
 * repite dos días seguidos) y no hay que guardar cuál tocó.
 */
function animo(mensajes: readonly string[], fecha: string, habitId: string): string {
  return mensajes[(numeroDeDia(fecha) + semilla(habitId)) % mensajes.length] ?? '';
}

/**
 * Avisos de la ventana. `desde` (por defecto, `ahora`) deja entrar los que acaban de pasar: sin
 * alarmas exactas Android los retrasa hasta 1 hora, y un aviso pendiente no se debe perder.
 */
export function planificarAvisos(
  datos: DatosAvisos,
  ahora: Date,
  desde: Date = ahora,
): AvisoPlaneado[] {
  const t = es.avisos;
  const { estilo, horas, config } = datos;
  const hoy = fechaLocal(ahora);
  const distraccion = datos.estrategias.includes('distraccion');
  const olvido = datos.estrategias.includes('olvido');
  const horaMomento =
    datos.momento !== null && datos.momento !== 'varia' ? horas[datos.momento] : horas.tarde;
  const avisos: AvisoPlaneado[] = [];

  const delDia = (fecha: string): HabitoDelDia[] =>
    habitosDelDia(fecha, datos.habitos, datos.horarios, datos.ocurrencias, datos.registros);

  /** Agrega el aviso si cae el mismo día (un segundo aviso no pasa a la madrugada siguiente). */
  const agregar = (
    tipo: string,
    fecha: string,
    hora: string,
    minutosExtra: number,
    titulo: string,
    cuerpo: string,
    habitId: string | null = null,
  ) => {
    const cuando = fechaHora(fecha, hora, minutosExtra);
    if (fechaLocal(cuando) !== fecha) return;
    avisos.push({
      id: `${tipo}-${habitId ?? 'dia'}-${fecha}`,
      fecha: cuando,
      titulo,
      cuerpo,
      habitId,
    });
  };

  for (let i = 0; i < config.ventana_dias; i++) {
    const fecha = sumarDias(hoy, i);
    // Los segundos avisos solo se programan para hoy y mañana (SDD 7.1).
    const conSegundo = i <= 1;
    const pendientes = delDia(fecha).filter((item) => !item.hecho && item.horario.notificar);

    if (estilo === 'resumen_nocturno') {
      const manana = delDia(sumarDias(fecha, 1)).filter((item) => item.horario.notificar);
      if (manana.length > 0) {
        agregar(
          'resumen',
          fecha,
          horas.resumen_nocturno,
          0,
          manana.length === 1 ? t.resumenUno : formatear(t.resumenVarios, { n: manana.length }),
          formatear(t.resumenCuerpo, { lista: lista(manana.map((m) => m.habito.titulo)) }),
        );
      }
      // `olvido` con resumen: como no hay avisos por hábito, uno solo al día a la hora del momento.
      if (olvido && pendientes.length > 0) {
        agregar(
          'olvido',
          fecha,
          horaMomento,
          0,
          t.olvidoTitulo,
          formatear(t.olvidoCuerpo, { lista: lista(pendientes.map((p) => p.habito.titulo)) }),
        );
      }
    } else {
      for (const { habito, horario } of pendientes) {
        const conDuracion = habito.duracion_min > 0;
        const duracion = textoDuracion(habito.duracion_min);
        const hora = horaCorta(horario.hora);

        if (hora === null) {
          if (!horario.flexible) continue;
          agregar('flexible', fecha, horas.tarde, 0, habito.titulo, t.flexibleTarde, habito.id);
          // `distraccion`: nunca más de un aviso por hábito al día.
          if (conSegundo && !distraccion) {
            agregar(
              'flexible2',
              fecha,
              horas.tarde,
              HORAS_SEGUNDO_FLEXIBLE * 60,
              habito.titulo,
              conDuracion ? formatear(t.flexibleNoche, { duracion }) : t.flexibleNocheSinDuracion,
              habito.id,
            );
          }
          continue;
        }

        const animoCorto = animo(t.animoCorto, fecha, habito.id);
        // Sin duración definida, los textos no mencionan minutos.
        const cuerpo =
          estilo !== 'recordatorio_y_animo'
            ? conDuracion
              ? formatear(t.suave, { duracion })
              : t.suaveSinDuracion
            : distraccion
              ? conDuracion
                ? formatear(t.distraccion, { duracion, animo: animoCorto })
                : animoCorto
              : animo(t.animo, fecha, habito.id);
        agregar('habito', fecha, hora, 0, habito.titulo, cuerpo, habito.id);

        if (conSegundo && datos.segundoAviso && !distraccion) {
          agregar(
            'segundo',
            fecha,
            hora,
            config.horas_segundo_aviso * 60,
            formatear(t.segundoTitulo, { habito: habito.titulo }),
            t.segundoCuerpo,
            habito.id,
          );
        }
      }
    }

    // Apoyo de las semanas 3 y 4: el lunes, si el estilo no es `minimo`.
    const semana = diaIso(fecha) === 1 ? semanaDeApoyoEnPlanes(datos.planes, fecha) : null;
    if (semana !== null && estilo !== 'minimo') {
      agregar('apoyo', fecha, horaMomento, 0, t.apoyo[semana].titulo, t.apoyo[semana].mensaje);
    }
  }

  // Tope: se quedan los más cercanos y se deja lugar para la invitación final.
  const programados = avisos
    .filter((a) => a.fecha.getTime() > desde.getTime())
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, Math.max(0, config.tope_programadas - 1));

  // Sin abrir la app, la ventana se acaba: el último aviso invita a abrirla (SDD 7.1).
  const ultimo = programados.at(-1);
  if (ultimo) {
    programados.push({
      id: 'fin-ventana',
      fecha: new Date(ultimo.fecha.getTime() + 60_000),
      titulo: t.finTitulo,
      cuerpo: t.finCuerpo,
      habitId: null,
    });
  }
  return programados;
}

/** Margen para los avisos retrasados: Android retrasa los aproximados hasta 1 hora. */
export const GRACIA_AVISOS_MS = 90 * 60_000;

export type Reparto = {
  /** Avisos por programar (o reprogramar): los que todavía no llegan a su hora. */
  programar: AvisoPlaneado[];
  /** Pendientes cuya hora ya pasó (Android los retrasó) y siguen tocando: no se cancelan. */
  conservar: string[];
  /** Pendientes que ya no tocan: hábito hecho, pausado, eliminado o cambiado. */
  cancelar: string[];
};

/**
 * Qué hacer con lo planeado frente a lo que ya está programado en el teléfono. Antes se cancelaba
 * todo y se volvía a programar solo lo futuro, y así se perdían los avisos retrasados.
 */
export function repartirAvisos(
  avisos: readonly AvisoPlaneado[],
  ahora: Date,
  pendientes: ReadonlySet<string>,
): Reparto {
  const programar = avisos.filter((a) => a.fecha.getTime() > ahora.getTime());
  const conservar = avisos
    .filter((a) => a.fecha.getTime() <= ahora.getTime() && pendientes.has(a.id))
    .map((a) => a.id);
  const quedan = new Set(conservar);
  return { programar, conservar, cancelar: [...pendientes].filter((id) => !quedan.has(id)) };
}
