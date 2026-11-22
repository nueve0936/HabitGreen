import { excesoDeTiempo } from '../tiempo-libre';

describe('plan nuevo en el tiempo libre', () => {
  const ocupado = [18, 0, 18, 0, 18, 0, 0];

  it('cabe: no hay exceso', () => {
    expect(excesoDeTiempo(ocupado, [0, 5, 0, 5, 0, 5, 0], 20)).toBe(0);
  });

  it('se suma día por día y avisa lo que pasa el día más cargado', () => {
    // Lunes: 18 ya ocupados + 5 del plan = 23 → 3 de más con 20 min.
    expect(excesoDeTiempo(ocupado, [5, 5, 0, 0, 0, 0, 0], 20)).toBe(3);
  });

  it('sin hábitos todavía, solo cuenta el plan', () => {
    expect(excesoDeTiempo([], [10, 10, 0, 0, 0, 0, 0], 20)).toBe(0);
  });
});
