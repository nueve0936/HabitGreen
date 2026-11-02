import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

// Textos de una tarjeta de la revisión del plan. Reciben las plantillas de i18n para que esta
// lógica se pueda probar sin la app.

export type TextosHorario = {
  minutos: string;
  todosLosDias: string;
  /** Abreviaturas de lunes a domingo (ISO 1–7). */
  dias: readonly string[];
  flexible: string;
};

export function textoDias(dias: readonly number[], t: TextosHorario): string {
  if (dias.length === 7) return t.todosLosDias;
  return [...dias]
    .sort((a, b) => a - b)
    .map((d) => t.dias[d - 1])
    .join(', ');
}

/** «5 min · Lun, Mar, Jue, Sáb · 20:30» (o la ventana, si el aviso es flexible). */
export function textoHorario(
  h: HabitoPlan,
  ventana: BorradorPlan['ventana_flexible'],
  t: TextosHorario,
): string {
  const hora =
    h.flexible || h.hora === null
      ? t.flexible.replace('{inicio}', ventana.inicio).replace('{fin}', ventana.fin)
      : h.hora;
  return [t.minutos.replace('{n}', String(h.duracion_min)), textoDias(h.dias_semana, t), hora].join(
    ' · ',
  );
}
