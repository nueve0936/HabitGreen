// Equipar accesorios (SDD 6.4): un accesorio comprado va en una sola planta a la vez, y cada
// planta lleva como máximo uno de cada tipo (sombrero, lentes, maceta).

export type TipoAccesorio = 'sombrero' | 'lentes' | 'maceta';

export type AccesorioPropio = {
  /** id de user_accessories. */
  id: string;
  tipo: TipoAccesorio;
  /** category_id de la planta donde está puesto, o null. */
  categoria_equipada: string | null;
};

export type CambioEquipado = { id: string; categoria_equipada: string | null };

/**
 * Cambios para poner `accesorio` en la planta `categoriaId` (o quitarlo con null).
 * Si la planta ya llevaba otro del mismo tipo, ese se quita.
 */
export function cambiosAlEquipar(
  accesorio: AccesorioPropio,
  categoriaId: string | null,
  propios: readonly AccesorioPropio[],
): CambioEquipado[] {
  if (accesorio.categoria_equipada === categoriaId) return [];
  const cambios: CambioEquipado[] = [];
  if (categoriaId !== null) {
    for (const otro of propios) {
      if (
        otro.id !== accesorio.id &&
        otro.tipo === accesorio.tipo &&
        otro.categoria_equipada === categoriaId
      ) {
        cambios.push({ id: otro.id, categoria_equipada: null });
      }
    }
  }
  cambios.push({ id: accesorio.id, categoria_equipada: categoriaId });
  return cambios;
}

export type PlantaCandidata = {
  categoryId: string;
  tieneHabitos: boolean;
  equipados: readonly { tipo: TipoAccesorio }[];
};

/**
 * Planta donde «Equipar ahora» pone un objeto recién comprado (SDD 9.4). Prioridad: la planta desde
 * la que se abrió la Tienda; la primera con hábitos que tenga libre ese tipo; la primera con
 * hábitos; la primera con ese tipo libre; la primera. Devuelve null si no hay plantas.
 */
export function plantaParaEquipar(
  tipo: TipoAccesorio,
  plantas: readonly PlantaCandidata[],
  origenId?: string | null,
): string | null {
  const tipoLibre = (p: PlantaCandidata) => !p.equipados.some((a) => a.tipo === tipo);
  const elegida =
    plantas.find((p) => p.categoryId === origenId) ??
    plantas.find((p) => p.tieneHabitos && tipoLibre(p)) ??
    plantas.find((p) => p.tieneHabitos) ??
    plantas.find(tipoLibre) ??
    plantas[0];
  return elegida?.categoryId ?? null;
}
