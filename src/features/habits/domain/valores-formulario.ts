import type { HabitoFormInput } from '@/schemas/habit';
import type { Area } from '@/schemas/onboarding';

import type { Habito, Horario } from './habitos-del-dia';
import { horaCorta } from './horario';

// Valores iniciales del formulario de hábito, al crear y al editar.

/** Con el estilo `minimo` solo avisan los hábitos con «Avisarme» activado (SDD 7.1). */
export function valoresNuevos(estiloNotificaciones: string | null, hora: string): HabitoFormInput {
  return {
    nombre: '',
    descripcion: '',
    categoria: null,
    frecuencia: 'todos',
    dias: [],
    duracion: '10',
    hora,
    avisarme: estiloNotificaciones !== 'minimo',
  };
}

export function valoresDeHabito(
  habito: Habito,
  horario: Horario | undefined,
  categoria: Area,
): HabitoFormInput {
  const dias = horario?.dias_semana ?? [];
  return {
    nombre: habito.titulo,
    descripcion: habito.descripcion ?? '',
    categoria,
    frecuencia: dias.length === 7 ? 'todos' : 'semana',
    dias: dias.length === 7 ? [] : dias,
    duracion: String(habito.duracion_min),
    hora: horaCorta(horario?.hora ?? null),
    avisarme: horario?.notificar ?? true,
  };
}
