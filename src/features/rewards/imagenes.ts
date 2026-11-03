import type { Area } from '@/schemas/onboarding';

import type { TipoAccesorio } from './domain/equipar';

// Arte de plantas y accesorios (SDD 9.8). Metro necesita un require fijo por archivo, así que
// cada imagen se nombra aquí. Para cambiar el arte basta reemplazar el PNG con el mismo nombre.

/** Un require de una imagen local devuelve un número (el id que asigna Metro). */
type ImagenLocal = number;

type Fases = Record<1 | 2 | 3, ImagenLocal>;

export const PLANTAS: Record<Area, Fases> = {
  salud_fisica: {
    1: require('../../../assets/plants/salud_fisica/fase1.png'),
    2: require('../../../assets/plants/salud_fisica/fase2.png'),
    3: require('../../../assets/plants/salud_fisica/fase3.png'),
  },
  trabajo: {
    1: require('../../../assets/plants/trabajo/fase1.png'),
    2: require('../../../assets/plants/trabajo/fase2.png'),
    3: require('../../../assets/plants/trabajo/fase3.png'),
  },
  salud_mental: {
    1: require('../../../assets/plants/salud_mental/fase1.png'),
    2: require('../../../assets/plants/salud_mental/fase2.png'),
    3: require('../../../assets/plants/salud_mental/fase3.png'),
  },
  finanzas: {
    1: require('../../../assets/plants/finanzas/fase1.png'),
    2: require('../../../assets/plants/finanzas/fase2.png'),
    3: require('../../../assets/plants/finanzas/fase3.png'),
  },
  social: {
    1: require('../../../assets/plants/social/fase1.png'),
    2: require('../../../assets/plants/social/fase2.png'),
    3: require('../../../assets/plants/social/fase3.png'),
  },
};

type Ordenes = Record<1 | 2 | 3 | 4 | 5, ImagenLocal>;

export const ACCESORIOS: Record<TipoAccesorio, Ordenes> = {
  sombrero: {
    1: require('../../../assets/accessories/sombrero/1.png'),
    2: require('../../../assets/accessories/sombrero/2.png'),
    3: require('../../../assets/accessories/sombrero/3.png'),
    4: require('../../../assets/accessories/sombrero/4.png'),
    5: require('../../../assets/accessories/sombrero/5.png'),
  },
  lentes: {
    1: require('../../../assets/accessories/lentes/1.png'),
    2: require('../../../assets/accessories/lentes/2.png'),
    3: require('../../../assets/accessories/lentes/3.png'),
    4: require('../../../assets/accessories/lentes/4.png'),
    5: require('../../../assets/accessories/lentes/5.png'),
  },
  maceta: {
    1: require('../../../assets/accessories/maceta/1.png'),
    2: require('../../../assets/accessories/maceta/2.png'),
    3: require('../../../assets/accessories/maceta/3.png'),
    4: require('../../../assets/accessories/maceta/4.png'),
    5: require('../../../assets/accessories/maceta/5.png'),
  },
};

export function imagenPlanta(area: Area, fase: number): ImagenLocal {
  return PLANTAS[area][(fase >= 3 ? 3 : fase <= 1 ? 1 : 2) as 1 | 2 | 3];
}

export function imagenAccesorio(tipo: TipoAccesorio, orden: number): ImagenLocal {
  return ACCESORIOS[tipo][Math.min(5, Math.max(1, orden)) as 1 | 2 | 3 | 4 | 5];
}
