import { areaDeObjetivo, type Objetivo, type Respuestas } from '@/schemas/onboarding';
import type { HabitoPlan, Nivel } from '@/schemas/plan';

import { habitoParaNivel, type ConfigPlan, type FilaCatalogo } from './plan-engine';

// «Agregar un hábito al plan» (decisión del usuario): cada área tiene solo 3 o 4 metas, así que
// además de la versión más ligera se sugieren las otras versiones del catálogo de cada meta libre.
// Primero todas las de nivel 1, luego las de 2 y luego las de 3, para que lo ligero salga antes.

const NIVELES: readonly Nivel[] = [1, 2, 3];

export function sugerenciasPorNiveles(
  respuestas: Respuestas,
  catalogo: readonly FilaCatalogo[],
  config: ConfigPlan,
  /** Metas que ya están en algún plan: no se sugieren. */
  ocupadas: ReadonlySet<string>,
): HabitoPlan[] {
  const libres = [...new Set(catalogo.map((f) => f.objetivo))].filter(
    (o: Objetivo) => respuestas.areas.includes(areaDeObjetivo(o)) && !ocupadas.has(o),
  );
  return NIVELES.flatMap((nivel) =>
    libres.flatMap((objetivo) => {
      try {
        return [habitoParaNivel(respuestas, catalogo, config, objetivo, nivel)];
      } catch {
        // Meta sin fila de ese nivel: se salta.
        return [];
      }
    }),
  );
}
