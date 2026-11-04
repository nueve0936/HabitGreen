import { sumarDias } from '@/lib/dates';

import type { Horario } from './habitos-del-dia';

// Editar el horario de un hábito (SDD 4): si cambia el patrón (días, hora o aviso), el horario
// vigente se cierra ayer y se crea otro desde hoy, para que las estadísticas de los días pasados
// sigan usando el patrón que tenían. La fecha de fin no es un cambio de patrón: se edita en el
// mismo horario. Un hábito que todavía no empieza se edita en su lugar, incluida su fecha de inicio.

export type CambiosHorario = Pick<
  Horario,
  'dias_semana' | 'hora' | 'notificar' | 'vigente_hasta'
> & {
  /** Fecha de inicio nueva; solo se aplica si el hábito todavía no empieza. */
  vigente_desde?: string;
};

export type VersionHorario = {
  /** Horario anterior que se cierra ayer (no existe si se editó en su lugar). */
  cerrar: { id: string; vigente_hasta: string } | null;
  /** Horario que queda vigente. */
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
  const mismoPatron =
    mismosDias(actual.dias_semana, cambios.dias_semana) &&
    horaCorta(actual.hora) === hora &&
    actual.notificar === cambios.notificar;
  const noEmpieza = actual.vigente_desde >= hoy;
  const vigente_desde = noEmpieza
    ? (cambios.vigente_desde ?? actual.vigente_desde)
    : actual.vigente_desde;
  const mismasFechas =
    actual.vigente_hasta === cambios.vigente_hasta && actual.vigente_desde === vigente_desde;
  if (mismoPatron && mismasFechas) return null;

  // Elegir una hora exacta deja el aviso fijo; sin hora y con aviso se conserva el modo flexible.
  const datos = {
    dias_semana: [...cambios.dias_semana].sort((a, b) => a - b),
    hora,
    flexible: hora === null && cambios.notificar ? actual.flexible : false,
    notificar: cambios.notificar,
    vigente_hasta: cambios.vigente_hasta,
  };

  if (mismoPatron || noEmpieza) {
    return { cerrar: null, guardar: { ...actual, ...datos, vigente_desde } };
  }
  return {
    cerrar: { id: actual.id, vigente_hasta: sumarDias(hoy, -1) },
    guardar: { ...datos, id: nuevoId, habit_id: actual.habit_id, vigente_desde: hoy },
  };
}
