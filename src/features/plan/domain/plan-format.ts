import { textoDias, type TextosDias } from '@/features/habits/domain/formato';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

// Textos de una tarjeta de la revisión del plan. Reciben las plantillas de i18n para que esta
// lógica se pueda probar sin la app.

export type TextosHorario = TextosDias & {
  minutos: string;
  /** Para los hábitos sin duración (0 minutos). */
  sinDuracion: string;
  flexible: string;
};

export { textoDias };

/**
 * «5 min · Lun, Mar, Jue, Sáb · 20:30» (o la ventana, si el aviso es flexible). Un hábito sin
 * duración dice «Sin duración fija» en lugar de los minutos.
 */
export function textoHorario(
  h: HabitoPlan,
  ventana: BorradorPlan['ventana_flexible'],
  t: TextosHorario,
): string {
  const hora =
    h.flexible || h.hora === null
      ? t.flexible.replace('{inicio}', ventana.inicio).replace('{fin}', ventana.fin)
      : h.hora;
  const duracion =
    h.duracion_min > 0 ? t.minutos.replace('{n}', String(h.duracion_min)) : t.sinDuracion;
  return [duracion, textoDias(h.dias_semana, t), hora].join(' · ');
}
