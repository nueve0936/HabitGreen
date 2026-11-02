import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';

import type { Objetivo } from '@/schemas/onboarding';
import type { BorradorPlan } from '@/schemas/plan';

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
  cambiarHora: (objetivo: Objetivo, hora: string) => void;
  bajarNivel: (objetivo: Objetivo) => void;
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
    cambiarHora: (objetivo, hora) => editar((b) => revision.cambiarHora(b, objetivo, hora)),
    bajarNivel: (objetivo) => editar((b) => revision.bajarNivel(b, objetivo)),
    quitar: (objetivo) => editar((b) => revision.quitarHabito(b, objetivo)),
    cambiarSegundoAviso: (activo) => editar((b) => revision.cambiarSegundoAviso(b, activo)),
    limpiar: () => set({ borrador: null, ids: null }),
  };
});
