import type { Respuestas } from '@/schemas/onboarding';

import { respuestasDelPlan } from '../respuestas-plan';

const GLOBALES: Respuestas = {
  areas: ['salud_fisica', 'finanzas'],
  objetivos: ['mover_mas', 'saber_gastos'],
  historial: 'primera_vez',
  tiempo: '10_20',
  momento: 'manana',
  obstaculo: 'olvido',
  acompanamiento: 'recordatorio_suave',
};

describe('respuestas de un plan', () => {
  it('usa el área, los objetivos y el historial del plan, y lo global del usuario', () => {
    const r = respuestasDelPlan(GLOBALES, 'finanzas', {
      objetivos: ['saber_gastos'],
      historial: 'mantiene',
    });
    expect(r).toEqual({
      ...GLOBALES,
      areas: ['finanzas'],
      objetivos: ['saber_gastos'],
      historial: 'mantiene',
    });
  });

  it('sin respuestas propias, filtra los objetivos globales por el área', () => {
    const r = respuestasDelPlan(GLOBALES, 'salud_fisica', null);
    expect(r.areas).toEqual(['salud_fisica']);
    expect(r.objetivos).toEqual(['mover_mas']);
    expect(r.historial).toBe('primera_vez');
  });
});
