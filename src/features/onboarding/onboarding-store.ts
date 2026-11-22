import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { Area, Objetivo } from '@/schemas/onboarding';

import { alternarArea, alternarObjetivo, BORRADOR_VACIO, type Borrador } from './domain/form-rules';
import type { Retomar } from './domain/retomar';

// Avance del formulario inicial (SDD 5.3). Vive en Zustand y se guarda en el almacén clave-valor
// de expo-sqlite, así que si se cierra la app las respuestas siguen ahí. Se usa la versión
// síncrona del almacén para que las respuestas ya estén cargadas al abrir la primera pantalla.
// También se guarda en qué pantalla va (`retomar`), para volver ahí si se cierra la app.

type PreguntaUnica = Exclude<keyof Borrador, 'areas' | 'objetivos'>;

type OnboardingState = {
  /** Dueño de las respuestas: si entra otra cuenta en el mismo teléfono, se empieza de cero. */
  userId: string | null;
  borrador: Borrador;
  /** Paso del formulario o revisión del plan donde se quedó; null fuera del formulario. */
  retomar: Retomar | null;
  /** Plan siguiente (3 pasos): las respuestas globales ya vienen del primer plan. */
  adicional: boolean;
  /** Áreas que ya tienen un plan activo: no se pueden elegir en P1. */
  areasOcupadas: Area[];
  /**
   * Lugares libres en el cupo de hábitos para el plan nuevo: limitan los objetivos de P2 y los
   * hábitos de la revisión. Null = sin límite (el primer formulario).
   */
  lugares: number | null;
  marcarRetomar: (retomar: Retomar | null) => void;
  prepararPara: (userId: string) => void;
  /**
   * Crear un plan desde la app (Perfil → Mis planes). Con `globales` es un plan siguiente de 3
   * pasos; sin ellas (nunca hizo el formulario) son los 7 pasos.
   */
  prepararNuevoPlan: (
    userId: string,
    globales: Partial<Borrador> | null,
    ocupadas: Area[],
    lugares: number | null,
  ) => void;
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
      retomar: null,
      adicional: false,
      areasOcupadas: [],
      lugares: null,

      marcarRetomar: (retomar) => set({ retomar }),

      prepararPara: (userId) => {
        if (get().userId !== userId) set({ userId, borrador: BORRADOR_VACIO, retomar: null });
        set({ adicional: false, areasOcupadas: [], lugares: null });
      },

      prepararNuevoPlan: (userId, globales, ocupadas, lugares) =>
        set({
          userId,
          borrador: { ...BORRADOR_VACIO, ...(globales ?? {}) },
          retomar: null,
          adicional: globales !== null,
          areasOcupadas: ocupadas,
          lugares,
        }),

      alternarArea: (area) => {
        const { borrador } = get();
        set({ borrador: { ...borrador, ...alternarArea(borrador, area) } });
      },

      alternarObjetivo: (objetivo) => {
        const { borrador, lugares } = get();
        set({
          borrador: { ...borrador, objetivos: alternarObjetivo(borrador, objetivo, lugares) },
        });
      },

      responder: (pregunta, valor) => set({ borrador: { ...get().borrador, [pregunta]: valor } }),

      reiniciar: () =>
        set({
          borrador: BORRADOR_VACIO,
          retomar: null,
          adicional: false,
          areasOcupadas: [],
          lugares: null,
        }),
    }),
    {
      name: 'habitgreen-onboarding',
      version: 1,
      storage: createJSONStorage(() => sqliteStorage),
      partialize: (state) => ({
        userId: state.userId,
        borrador: state.borrador,
        retomar: state.retomar,
        adicional: state.adicional,
        areasOcupadas: state.areasOcupadas,
        lugares: state.lugares,
      }),
    },
  ),
);
