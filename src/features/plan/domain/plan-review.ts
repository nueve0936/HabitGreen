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
