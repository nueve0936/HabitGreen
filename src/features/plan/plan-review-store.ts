import { randomUUID } from 'expo-crypto';
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import type { Objetivo } from '@/schemas/onboarding';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

import * as revision from './domain/plan-review';
import { areasDelBorrador, type IdsPlan } from './domain/plan-rows';

// Borrador del plan mientras el usuario lo revisa. Se guarda en el almacén clave-valor del teléfono
// (decisión del usuario, pulidos antes del APK): si se cierra la app antes de «Empezar», al volver
// se retoma la revisión sin pedir otro plan a la IA. En la base de datos no se guarda hasta
// «Empezar» (SDD 5.8).
// Los UUID se crean al recibir el borrador y no cambian, para que reintentar el guardado no
// duplique filas. Se guarda un plan por área: cada área del borrador tiene su id de plan.

type PlanReviewState = {
  borrador: BorradorPlan | null;
  ids: IdsPlan | null;
  cargar: (borrador: BorradorPlan) => void;
  agregar: (habito: HabitoPlan) => void;
  editar: (objetivo: Objetivo, cambios: revision.CambiosHabitoPlan) => void;
  quitar: (objetivo: Objetivo) => void;
  cambiarSegundoAviso: (activo: boolean) => void;
  /** Ids completos para guardar: agrega el id de plan de las áreas que todavía no lo tengan. */
  idsParaGuardar: () => IdsPlan | null;
  limpiar: () => void;
};

function nuevosIds(borrador: BorradorPlan): IdsPlan {
  const habitos: IdsPlan['habitos'] = {};
  for (const h of borrador.habitos) {
    habitos[h.objetivo] = { habitId: randomUUID(), scheduleId: randomUUID() };
  }
  return conPlanesPorArea(borrador, { planId: randomUUID(), habitos });
}

/** Agrega un id de plan a cada área del borrador que no sea la primera y no lo tenga. */
function conPlanesPorArea(borrador: BorradorPlan, ids: IdsPlan): IdsPlan {
  const [, ...demas] = areasDelBorrador(borrador);
  const faltan = demas.filter((area) => ids.planesExtra?.[area] === undefined);
  if (faltan.length === 0) return ids;
  const planesExtra = { ...ids.planesExtra };
  for (const area of faltan) planesExtra[area] = randomUUID();
  return { ...ids, planesExtra };
}

const sqliteStorage: StateStorage = {
  getItem: (key) => Storage.getItemSync(key),
  setItem: (key, value) => Storage.setItemSync(key, value),
  removeItem: (key) => {
    Storage.removeItemSync(key);
  },
};

export const usePlanReviewStore = create<PlanReviewState>()(
  persist(
    (set, get) => {
      const editar = (cambio: (b: BorradorPlan) => BorradorPlan) =>
        set((s) => (s.borrador === null ? s : { borrador: cambio(s.borrador) }));

      return {
        borrador: null,
        ids: null,
        cargar: (borrador) => set({ borrador, ids: nuevosIds(borrador) }),
        // Un hábito agregado recibe sus UUID en ese momento, igual que los del borrador original.
        agregar: (habito) =>
          set((s) =>
            s.borrador === null || s.ids === null
              ? s
              : {
                  borrador: revision.agregarHabito(
                    s.borrador,
                    habito,
                    useOnboardingStore.getState().lugares,
                  ),
                  ids: {
                    ...s.ids,
                    habitos: {
                      ...s.ids.habitos,
                      [habito.objetivo]: s.ids.habitos[habito.objetivo] ?? {
                        habitId: randomUUID(),
                        scheduleId: randomUUID(),
                      },
                    },
                  },
                },
          ),
        editar: (objetivo, cambios) =>
          editar((b) => revision.editarHabitoPlan(b, objetivo, cambios)),
        quitar: (objetivo) => editar((b) => revision.quitarHabito(b, objetivo)),
        cambiarSegundoAviso: (activo) => editar((b) => revision.cambiarSegundoAviso(b, activo)),
        idsParaGuardar: () => {
          const { borrador, ids } = get();
          if (borrador === null || ids === null) return null;
          const completos = conPlanesPorArea(borrador, ids);
          if (completos !== ids) set({ ids: completos });
          return completos;
        },
        limpiar: () => set({ borrador: null, ids: null }),
      };
    },
    {
      name: 'habitgreen-plan-revision',
      version: 1,
      storage: createJSONStorage(() => sqliteStorage),
      partialize: (state) => ({ borrador: state.borrador, ids: state.ids }),
    },
  ),
);
