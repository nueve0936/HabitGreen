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

/** «Lun, Mié · 08:00 · 5 min». */
export function textoHabito(
  h: { dias_semana: readonly number[]; hora: string | null; duracion_min: number },
  t: TextosHabito,
): string {
  return [
    textoDias(h.dias_semana, t),
    horaCorta(h.hora) ?? t.horaFlexible,
    t.minutos.replace('{n}', String(h.duracion_min)),
  ].join(' · ');
}
