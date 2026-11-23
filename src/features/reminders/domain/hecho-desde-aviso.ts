// Botón «Hecho» en el aviso de un hábito (RI-04 del SRS; decisión del usuario del 22 nov): al
// tocarlo se abre la app en Hoy y el hábito se marca ahí, con sus monedas y su animación. Solo los
// avisos de un hábito llevan el botón; los que hablan de varios (resumen nocturno, «olvido»), no.
// El check-in solo se puede marcar para hoy: un aviso de un día anterior solo abre la app.

/** Categoría de los avisos de un hábito (sin «:» ni «-», como pide expo-notifications). */
export const CATEGORIA_HABITO = 'habito';

/** Botón «Hecho» de esa categoría. */
export const ACCION_HECHO = 'hecho';

export type HechoPendiente = { habitId: string; dia: string };

/** El «Hecho» de un aviso, o null si la respuesta fue otra (tocar el aviso, otro botón…). */
export function leerHechoDeAviso(accion: string, data: unknown): HechoPendiente | null {
  if (accion !== ACCION_HECHO || typeof data !== 'object' || data === null) return null;
  const { habitId, dia } = data as Record<string, unknown>;
  return typeof habitId === 'string' && typeof dia === 'string' ? { habitId, dia } : null;
}

type ItemDeHoy = { habito: { id: string }; hecho: boolean };

export type DecisionHecho<T> =
  | { tipo: 'marcar'; item: T }
  | { tipo: 'otro_dia' }
  /** Ya estaba hecho o ya no toca hoy (pausado, eliminado, movido): no se hace nada. */
  | { tipo: 'nada' };

/** Qué hacer en Hoy con un «Hecho» pendiente, según la fecha de hoy y la lista del día. */
export function decidirHecho<T extends ItemDeHoy>(
  pendiente: HechoPendiente,
  hoy: string,
  items: readonly T[],
): DecisionHecho<T> {
  if (pendiente.dia !== hoy) return { tipo: 'otro_dia' };
  const item = items.find((i) => i.habito.id === pendiente.habitId);
  return item && !item.hecho ? { tipo: 'marcar', item } : { tipo: 'nada' };
}
