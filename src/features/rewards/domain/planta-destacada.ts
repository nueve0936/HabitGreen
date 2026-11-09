// Planta que se muestra en Hoy (SDD 9.4): la de fase más alta. Si hay empate, se prefiere una con
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
