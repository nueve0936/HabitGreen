import { valoresNuevos } from '../valores-formulario';

describe('valores de un hábito nuevo', () => {
  it('empieza sin duración fija (0), todos los días y sin recordatorio', () => {
    const valores = valoresNuevos('2026-11-17', 'finanzas');
    expect(valores.duracion).toBe(0);
    expect(valores.dias).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(valores.notificar).toBe(false);
    expect(valores.categoria).toBe('finanzas');
  });
});
