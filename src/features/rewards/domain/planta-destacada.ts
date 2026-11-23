// Planta que se muestra en Hoy (SDD 9.4). Si el usuario equipó una desde Detalles de la planta
// (decisión del 22 nov), es esa. Si no, la de fase más alta; en un empate se prefiere una con
// hábitos y después la primera según el orden de las áreas.

export function plantaDestacada<T extends { fase: number; tieneHabitos: boolean }>(
  plantas: readonly T[],
): T | null {
  let mejor: T | null = null;
  for (const planta of plantas) {
    if (
      mejor === null ||
      planta.fase > mejor.fase ||
      (planta.fase === mejor.fase && planta.tieneHabitos && !mejor.tieneHabitos)
    ) {
      mejor = planta;
    }
  }
  return mejor;
}

/** La planta de Hoy: la equipada si existe; si no, la automática (`plantaDestacada`). */
export function plantaEnHoy<T extends { area: string; fase: number; tieneHabitos: boolean }>(
  plantas: readonly T[],
  elegida: string | null,
): T | null {
  return plantas.find((p) => p.area === elegida) ?? plantaDestacada(plantas);
}
