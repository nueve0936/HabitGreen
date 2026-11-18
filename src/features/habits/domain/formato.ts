import { es, formatear } from '@/i18n/es';

import { horaCorta } from './horario';

// Textos de los hábitos en tarjetas (Hoy, Hábitos y revisión del plan). Reciben las plantillas
// de i18n para que se puedan probar sin la app.

export type TextosDias = {
  todosLosDias: string;
  /** Abreviaturas de lunes a domingo (ISO 1–7). */
  dias: readonly string[];
};

export type TextosHabito = TextosDias & { minutos: string; horaFlexible: string };

export function textoDias(dias: readonly number[], t: TextosDias): string {
  if (dias.length === 7) return t.todosLosDias;
  return [...dias]
    .sort((a, b) => a - b)
    .map((d) => t.dias[d - 1])
    .join(', ');
}

export type TextosDuracion = {
  sinDuracion: string;
  minutos: string;
  horas: string;
  horasMinutos: string;
};

/** «25 min», «1 h», «1 h 25 min»; 0 es «Sin duración fija» (solo hábitos propios, SDD 6.5). */
export function textoDuracion(minutos: number, t: TextosDuracion = es.duracion): string {
  if (minutos <= 0) return t.sinDuracion;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return formatear(t.minutos, { m });
  return m === 0 ? formatear(t.horas, { h }) : formatear(t.horasMinutos, { h, m });
}

/** «Lun, Mié · 08:00 · 5 min». Sin duración definida, no la muestra. */
export function textoHabito(
  h: { dias_semana: readonly number[]; hora: string | null; duracion_min: number },
  t: TextosHabito,
): string {
  return [
    textoDias(h.dias_semana, t),
    horaCorta(h.hora) ?? t.horaFlexible,
    h.duracion_min > 0 ? textoDuracion(h.duracion_min) : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
