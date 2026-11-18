import { TODOS_LOS_DIAS, type HabitoFormInput } from '@/schemas/habit';
import type { Area } from '@/schemas/onboarding';

import type { Habito, Horario } from './habitos-del-dia';
import { horaCorta } from './horario';

// Valores iniciales del asistente de hábito, al crear y al editar.

export const HORA_POR_DEFECTO = '08:00';

/**
 * Al crear: todos los días, sin duración fija (0), desde hoy, sin fecha de fin y sin recordatorio. Los
 * recordatorios necesitan el permiso de avisos, que se pide cuando la persona elige una hora
 * (SDD 7.1). Desde Detalles de una planta, llega con su área ya elegida.
 */
export function valoresNuevos(hoy: string, categoria: Area | null = null): HabitoFormInput {
  return {
    nombre: '',
    descripcion: '',
    categoria,
    dias: [...TODOS_LOS_DIAS],
    duracion: 0,
    hora: null,
    notificar: false,
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
