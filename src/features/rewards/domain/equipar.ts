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
