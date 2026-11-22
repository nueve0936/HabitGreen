// Equipar accesorios (SDD 6.4): un mismo objeto puede llevarlo más de una planta a la vez (decisión
// del usuario, pulidos antes del APK), pero cada planta lleva como máximo uno de cada tipo
// (sombrero, lentes, maceta).

export type TipoAccesorio = 'sombrero' | 'lentes' | 'maceta';

export type AccesorioPropio = {
  /** id de user_accessories. */
  id: string;
  tipo: TipoAccesorio;
  /** category_id de las plantas que lo llevan puesto. */
  categorias_equipadas: readonly string[];
};

export type CambioEquipado = { id: string; categorias_equipadas: string[] };

/**
 * Cambios para poner `accesorio` en la planta `categoriaId` (`poner` = true) o quitárselo solo a
 * esa planta. Al ponerlo, si la planta ya llevaba otro del mismo tipo, ese se le quita solo a ella.
 */
export function cambiosAlEquipar(
  accesorio: AccesorioPropio,
  categoriaId: string,
  poner: boolean,
  propios: readonly AccesorioPropio[],
): CambioEquipado[] {
  const sin = (a: AccesorioPropio) => a.categorias_equipadas.filter((c) => c !== categoriaId);
  if (accesorio.categorias_equipadas.includes(categoriaId) === poner) return [];
  if (!poner) return [{ id: accesorio.id, categorias_equipadas: sin(accesorio) }];

  const cambios: CambioEquipado[] = propios
    .filter(
      (otro) =>
        otro.id !== accesorio.id &&
        otro.tipo === accesorio.tipo &&
        otro.categorias_equipadas.includes(categoriaId),
    )
    .map((otro) => ({ id: otro.id, categorias_equipadas: sin(otro) }));
  cambios.push({
    id: accesorio.id,
    categorias_equipadas: [...accesorio.categorias_equipadas, categoriaId],
  });
  return cambios;
}

export type PlantaCandidata = {
  categoryId: string;
  tieneHabitos: boolean;
  equipados: readonly { tipo: TipoAccesorio }[];
};

/**
 * Planta donde «Equipar ahora» pone un objeto (SDD 9.4). La planta desde la que se abrió la Tienda
 * gana siempre. Si no, se buscan entre las que todavía no llevan ese objeto (si todas lo llevan,
 * entre todas): la primera con hábitos que tenga libre ese tipo; la primera con hábitos; la primera
 * con ese tipo libre; la primera. Devuelve null si no hay plantas.
 */
export function plantaParaEquipar(
  tipo: TipoAccesorio,
  todas: readonly PlantaCandidata[],
  origenId?: string | null,
  yaLoLlevan: readonly string[] = [],
): string | null {
  const origen = todas.find((p) => p.categoryId === origenId);
  if (origen) return origen.categoryId;
  const sinElObjeto = todas.filter((p) => !yaLoLlevan.includes(p.categoryId));
  const plantas = sinElObjeto.length > 0 ? sinElObjeto : todas;
  const tipoLibre = (p: PlantaCandidata) => !p.equipados.some((a) => a.tipo === tipo);
  const elegida =
    plantas.find((p) => p.tieneHabitos && tipoLibre(p)) ??
    plantas.find((p) => p.tieneHabitos) ??
    plantas.find(tipoLibre) ??
    plantas[0];
  return elegida?.categoryId ?? null;
}
