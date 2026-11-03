import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { Area, Objetivo } from '@/schemas/onboarding';

import { alternarArea, alternarObjetivo, BORRADOR_VACIO, type Borrador } from './domain/form-rules';

// Avance del formulario inicial (SDD 5.3). Vive en Zustand y se guarda en el almacén clave-valor
// de expo-sqlite, así que si se cierra la app las respuestas siguen ahí. Se usa la versión
// síncrona del almacén para que las respuestas ya estén cargadas al abrir la primera pantalla.

type PreguntaUnica = Exclude<keyof Borrador, 'areas' | 'objetivos'>;

type OnboardingState = {
  /** Dueño de las respuestas: si entra otra cuenta en el mismo teléfono, se empieza de cero. */
  userId: string | null;
  borrador: Borrador;
  prepararPara: (userId: string) => void;
  /** Con 2 ya elegidos, el nuevo reemplaza al primero que se eligió. */
  alternarArea: (area: Area) => void;
  alternarObjetivo: (objetivo: Objetivo) => void;
  responder: <K extends PreguntaUnica>(pregunta: K, valor: NonNullable<Borrador[K]>) => void;
  reiniciar: () => void;
};

const sqliteStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      userId: null,
      borrador: BORRADOR_VACIO,

      prepararPara: (userId) => {
        if (get().userId !== userId) set({ userId, borrador: BORRADOR_VACIO });
      },

      alternarArea: (area) => {
        const { borrador } = get();
        set({ borrador: { ...borrador, ...alternarArea(borrador, area) } });
      },

      alternarObjetivo: (objetivo) => {
        const { borrador } = get();
        set({ borrador: { ...borrador, objetivos: alternarObjetivo(borrador, objetivo) } });
      },

      responder: (pregunta, valor) => set({ borrador: { ...get().borrador, [pregunta]: valor } }),

      reiniciar: () => set({ borrador: BORRADOR_VACIO }),
    }),
    {
      name: 'habitgreen-onboarding',
      version: 1,
      storage: createJSONStorage(() => sqliteStorage),
      partialize: (state) => ({ userId: state.userId, borrador: state.borrador }),
    },
  ),
);
