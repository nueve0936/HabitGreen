import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import type { Objetivo } from '@/schemas/onboarding';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

import * as revision from './domain/plan-review';
import type { IdsPlan } from './domain/plan-rows';

// Borrador del plan mientras el usuario lo revisa. Vive solo en memoria: si se cierra la app antes
// de «Empezar», no queda nada guardado y el plan se vuelve a generar (SDD 5.8).
// Los UUID se crean al recibir el borrador y no cambian, para que reintentar el guardado no
// duplique filas.

type PlanReviewState = {
  borrador: BorradorPlan | null;
  ids: IdsPlan | null;
  cargar: (borrador: BorradorPlan) => void;
  agregar: (habito: HabitoPlan) => void;
  editar: (objetivo: Objetivo, cambios: revision.CambiosHabitoPlan) => void;
  quitar: (objetivo: Objetivo) => void;
  cambiarSegundoAviso: (activo: boolean) => void;
  limpiar: () => void;
};

function nuevosIds(borrador: BorradorPlan): IdsPlan {
  const habitos: IdsPlan['habitos'] = {};
  for (const h of borrador.habitos) {
    habitos[h.objetivo] = { habitId: randomUUID(), scheduleId: randomUUID() };
  }
  return { planId: randomUUID(), habitos };
}

export const usePlanReviewStore = create<PlanReviewState>()((set) => {
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
              borrador: revision.agregarHabito(s.borrador, habito),
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
    editar: (objetivo, cambios) => editar((b) => revision.editarHabitoPlan(b, objetivo, cambios)),
    quitar: (objetivo) => editar((b) => revision.quitarHabito(b, objetivo)),
    cambiarSegundoAviso: (activo) => editar((b) => revision.cambiarSegundoAviso(b, activo)),
    limpiar: () => set({ borrador: null, ids: null }),
  };
});
