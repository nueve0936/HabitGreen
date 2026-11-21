import { create } from 'zustand';

import { avisarCambioLocal } from '@/db/db-version-store';

import { fechaLocal } from './dates';

// Fecha que muestra la app (pulidos antes del APK, estados de inactividad). Las pantallas calculan
// «hoy» al dibujarse; si la app queda abierta pasada la medianoche, nada las vuelve a dibujar.
// `revisar` compara con el reloj y, si cambió el día, avisa como cualquier cambio local: todas las
// pantallas que leen SQLite vuelven a consultar y a calcular su fecha.

type FechaHoyState = {
  fecha: string;
  /** Devuelve true si cambió el día (y ya avisó a las pantallas). */
  revisar: () => boolean;
};

export const useFechaHoy = create<FechaHoyState>()((set, get) => ({
  fecha: fechaLocal(),
  revisar: () => {
    const ahora = fechaLocal();
    if (ahora === get().fecha) return false;
    set({ fecha: ahora });
    avisarCambioLocal();
    return true;
  },
}));

/** Milisegundos que faltan para la siguiente medianoche local. */
export function msHastaMedianoche(ahora: Date): number {
  const siguiente = new Date(ahora);
  siguiente.setHours(24, 0, 0, 0);
  return siguiente.getTime() - ahora.getTime();
}
