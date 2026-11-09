import { TODOS_LOS_DIAS, type HabitoFormInput } from '@/schemas/habit';
import type { Area } from '@/schemas/onboarding';

import type { Habito, Horario } from './habitos-del-dia';
import { horaCorta } from './horario';

// Valores iniciales del asistente de hábito, al crear y al editar.

export const HORA_POR_DEFECTO = '08:00';
export const DURACION_POR_DEFECTO = 10;

/**
 * Al crear: todos los días, 10 min, desde hoy y sin fecha de fin. Con el estilo `minimo` solo
 * avisan los hábitos que el usuario elija (SDD 7.1), así que empieza sin recordatorio. Desde Detalles de una planta, llega con su área ya elegida.
 */
export function valoresNuevos(
  estiloNotificaciones: string | null,
  hoy: string,
  categoria: Area | null = null,
): HabitoFormInput {
  const avisa = estiloNotificaciones !== 'minimo';
  return {
    nombre: '',
    descripcion: '',
    categoria,
    dias: [...TODOS_LOS_DIAS],
    duracion: DURACION_POR_DEFECTO,
    hora: avisa ? HORA_POR_DEFECTO : null,
    notificar: avisa,
    flexible: false,
    fecha_inicio: hoy,
    fecha_fin: null,
  };
}

export function valoresDeHabito(
  habito: Habito,
  horario: Horario | undefined,
  categoria: Area,
  /** Primer día del hábito (no el de su última versión de horario). */
  inicio: string,
): HabitoFormInput {
  return {
    nombre: habito.titulo,
    descripcion: habito.descripcion ?? '',
    categoria,
    dias: horario?.dias_semana ?? [...TODOS_LOS_DIAS],
    duracion: habito.duracion_min,
    hora: horaCorta(horario?.hora ?? null),
    notificar: horario?.notificar ?? false,
    flexible: horario?.flexible ?? false,
    fecha_inicio: inicio,
    fecha_fin: horario?.vigente_hasta ?? null,
  };
}
