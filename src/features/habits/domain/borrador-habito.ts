import { diasEntre } from '@/lib/dates';
import type { HabitoFormInput } from '@/schemas/habit';

// Borrador del asistente al crear un hábito (pulidos antes del APK, estados de inactividad). Si
// Android cierra la app a medias, lo escrito sigue en el teléfono y al volver a «Crear hábito» se
// ofrece seguir. Se borra al guardar, al descartar o a los 7 días.

export type PasoAsistente = 1 | 2 | 3;

export type BorradorHabito = {
  userId: string;
  /** Fecha local del último cambio. */
  fecha: string;
  paso: PasoAsistente;
  valores: HabitoFormInput;
};

export const DIAS_BORRADOR = 7;

/**
 * El borrador que se puede retomar hoy, o null si no hay, es de otra cuenta o ya pasaron 7 días.
 * Una fecha de inicio que quedó en el pasado pasa a hoy (no se permite empezar antes de hoy), y
 * una fecha de fin anterior al inicio se quita.
 */
export function borradorParaHoy(
  guardado: BorradorHabito | null,
  userId: string,
  hoy: string,
): BorradorHabito | null {
  if (guardado === null || guardado.userId !== userId) return null;
  const dias = diasEntre(guardado.fecha, hoy);
  if (dias < 0 || dias >= DIAS_BORRADOR) return null;
  const inicio = guardado.valores.fecha_inicio < hoy ? hoy : guardado.valores.fecha_inicio;
  const fin = guardado.valores.fecha_fin;
  return {
    ...guardado,
    valores: {
      ...guardado.valores,
      fecha_inicio: inicio,
      fecha_fin: fin !== null && fin !== undefined && fin < inicio ? null : fin,
    },
  };
}
