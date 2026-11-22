import { ajustePresupuesto, minutosPorDia } from '@/features/habits/domain/presupuesto';
import type { Objetivo, Respuestas } from '@/schemas/onboarding';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

// Cambios que el usuario hace en la revisión del plan (SDD 9.4) antes de pulsar «Empezar».
// Funciones puras: reciben el borrador y devuelven uno nuevo, sin tocar el original.

/**
 * El interruptor «Segundo aviso» se muestra cuando la P6 es `olvido` y el estilo avisa por hábito
 * (SDD 5.6). Con `varia` la ventana ya tiene dos avisos y con `resumen_nocturno` el aviso extra
 * es único y diurno, así que en esos casos no se muestra.
 */
export function muestraSegundoAviso(r: Respuestas): boolean {
  return (
    r.obstaculo === 'olvido' && r.momento !== 'varia' && r.acompanamiento !== 'resumen_nocturno'
  );
}

/** La nota de apoyo profesional acompaña a `manejar_estres` (SDD 5.10). */
export function muestraNotaApoyo(b: BorradorPlan): boolean {
  return b.habitos.some((h) => h.objetivo === 'manejar_estres');
}

function reemplazar(
  b: BorradorPlan,
  objetivo: Objetivo,
  cambio: (h: HabitoPlan) => HabitoPlan,
): BorradorPlan {
  return { ...b, habitos: b.habitos.map((h) => (h.objetivo === objetivo ? cambio(h) : h)) };
}

/** Elegir una hora exacta deja el recordatorio fijo, aunque antes fuera flexible. */
export function cambiarHora(b: BorradorPlan, objetivo: Objetivo, hora: string): BorradorPlan {
  return reemplazar(b, objetivo, (h) => ({ ...h, hora, flexible: false }));
}

function nivelInferior(b: BorradorPlan, habito: HabitoPlan): HabitoPlan | undefined {
  return b.alternativas[habito.objetivo]?.find((a) => a.nivel === habito.nivel - 1);
}

export function puedeBajarNivel(b: BorradorPlan, objetivo: Objetivo): boolean {
  const habito = b.habitos.find((h) => h.objetivo === objetivo);
  return habito !== undefined && nivelInferior(b, habito) !== undefined;
}

/** Cambia el hábito por su versión del nivel anterior, conservando la hora y el aviso elegidos. */
export function bajarNivel(b: BorradorPlan, objetivo: Objetivo): BorradorPlan {
  return reemplazar(b, objetivo, (h) => {
    const inferior = nivelInferior(b, h);
    if (inferior === undefined) return h;
    return { ...inferior, hora: h.hora, flexible: h.flexible, notificar: h.notificar };
  });
}

/** El plan conserva al menos un hábito. */
export function puedeQuitar(b: BorradorPlan): boolean {
  return b.habitos.length > 1;
}

export function quitarHabito(b: BorradorPlan, objetivo: Objetivo): BorradorPlan {
  if (!puedeQuitar(b)) return b;
  return { ...b, habitos: b.habitos.filter((h) => h.objetivo !== objetivo) };
}

/** Hábitos del plan inicial: el formulario crea 1 o 2 y en la revisión se puede llegar a 3. */
export const MAX_HABITOS_PLAN_INICIAL = 3;
export const SUGERENCIAS_POR_PAGINA = 4;

/** Con `lugares` (los libres en el cupo de hábitos; null = sin límite) el plan nuevo trae menos. */
export function puedeAgregar(b: BorradorPlan, lugares: number | null = null): boolean {
  const tope =
    lugares === null ? MAX_HABITOS_PLAN_INICIAL : Math.min(MAX_HABITOS_PLAN_INICIAL, lugares);
  return b.habitos.length < tope;
}

/** Sugerencias de objetivos que todavía no están en el plan. */
export function sugerenciasDisponibles(b: BorradorPlan): HabitoPlan[] {
  const enPlan = new Set(b.habitos.map((h) => h.objetivo));
  return b.sugerencias.filter((s) => !enPlan.has(s.objetivo));
}

/** Página de sugerencias; al acabarse la lista vuelve al principio. */
export function paginaDeSugerencias<T>(
  lista: readonly T[],
  pagina: number,
  porPagina = SUGERENCIAS_POR_PAGINA,
): T[] {
  if (lista.length <= porPagina) return [...lista];
  const paginas = Math.ceil(lista.length / porPagina);
  const inicio = (pagina % paginas) * porPagina;
  return lista.slice(inicio, inicio + porPagina);
}

/**
 * Si algún día suma más minutos que el presupuesto, este sube a esa suma (SDD 6.5, decisión del
 * usuario también para el plan).
 */
function conPresupuesto(b: BorradorPlan): BorradorPlan {
  const { nuevoPresupuesto } = ajustePresupuesto(
    b.ajustes.presupuesto_min,
    minutosPorDia(b.habitos),
  );
  return nuevoPresupuesto === b.ajustes.presupuesto_min
    ? b
    : { ...b, ajustes: { ...b.ajustes, presupuesto_min: nuevoPresupuesto } };
}

export function agregarHabito(
  b: BorradorPlan,
  habito: HabitoPlan,
  lugares: number | null = null,
): BorradorPlan {
  if (!puedeAgregar(b, lugares) || b.habitos.some((h) => h.objetivo === habito.objetivo)) return b;
  return conPresupuesto({ ...b, habitos: [...b.habitos, habito] });
}

export type CambiosHabitoPlan = {
  titulo: string;
  dias_semana: number[];
  /** Hora elegida; null deja la que tenía (o el aviso flexible). */
  hora: string | null;
  notificar: boolean;
};

/** «Editar hábito» de la revisión: nombre, días, hora del recordatorio y si avisa. */
export function editarHabitoPlan(
  b: BorradorPlan,
  objetivo: Objetivo,
  cambios: CambiosHabitoPlan,
): BorradorPlan {
  return conPresupuesto(
    reemplazar(b, objetivo, (h) => ({
      ...h,
      titulo: cambios.titulo,
      dias_semana: [...cambios.dias_semana].sort((x, y) => x - y),
      notificar: cambios.notificar,
      ...(cambios.hora === null ? {} : { hora: cambios.hora, flexible: false }),
    })),
  );
}

export function cambiarSegundoAviso(b: BorradorPlan, activo: boolean): BorradorPlan {
  return { ...b, ajustes: { ...b.ajustes, segundo_aviso: activo } };
}

/** "HH:MM" de un Date, en la hora local del teléfono. */
export function horaDesdeFecha(fecha: Date): string {
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mm = String(fecha.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Date de hoy con la hora "HH:MM" (valor inicial del selector de hora). */
export function fechaDesdeHora(hora: string, base: Date = new Date()): Date {
  const [hh, mm] = hora.split(':').map(Number);
  const fecha = new Date(base);
  fecha.setHours(hh ?? 0, mm ?? 0, 0, 0);
  return fecha;
}
