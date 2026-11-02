import { sumarDias } from '@/lib/dates';

import type { Horario } from './habitos-del-dia';

// Editar el horario de un hábito (SDD 4): el horario vigente se cierra y se crea otro desde hoy,
// para que las estadísticas de los días pasados sigan usando el patrón que tenían.

export type CambiosHorario = Pick<Horario, 'dias_semana' | 'hora' | 'notificar'>;

export type VersionHorario = {
  /** Horario anterior que se cierra ayer (no existe si el vigente empezó hoy). */
  cerrar: { id: string; vigente_hasta: string } | null;
  /** Horario que queda vigente desde hoy. */
  guardar: Horario;
};

function mismosDias(a: readonly number[], b: readonly number[]): boolean {
  const ordenar = (d: readonly number[]) => [...d].sort((x, y) => x - y).join(',');
  return ordenar(a) === ordenar(b);
}

/** "HH:MM" de una hora de Postgres ("HH:MM:SS") o de la app. */
export function horaCorta(hora: string | null): string | null {
  return hora === null ? null : hora.slice(0, 5);
}

export function nuevaVersionHorario(
  actual: Horario,
  cambios: CambiosHorario,
  hoy: string,
  nuevoId: string,
): VersionHorario | null {
  const hora = horaCorta(cambios.hora);
  const sinCambios =
    mismosDias(actual.dias_semana, cambios.dias_semana) &&
    horaCorta(actual.hora) === hora &&
    actual.notificar === cambios.notificar;
  if (sinCambios) return null;

  // Elegir una hora exacta deja el aviso fijo, igual que en la revisión del plan.
  const datos = {
    dias_semana: [...cambios.dias_semana].sort((a, b) => a - b),
    hora,
    flexible: hora === null ? actual.flexible : false,
    notificar: cambios.notificar,
  };

  if (actual.vigente_desde >= hoy) {
    return { cerrar: null, guardar: { ...actual, ...datos } };
  }
  return {
    cerrar: { id: actual.id, vigente_hasta: sumarDias(hoy, -1) },
    guardar: {
      ...datos,
      id: nuevoId,
      habit_id: actual.habit_id,
      vigente_desde: hoy,
      vigente_hasta: null,
    },
  };
}
