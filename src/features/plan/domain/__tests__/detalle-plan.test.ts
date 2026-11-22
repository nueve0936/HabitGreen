import { avanceDelPlan, diasParaRevision } from '../detalle-plan';

const HOY = '2026-11-21';

function dias(habitId: string, hechos: number, total: number) {
  // Hacia atrás desde ayer.
  return Array.from({ length: total }, (_, i) => ({
    habitId,
    fecha: `2026-11-${String(20 - i).padStart(2, '0')}`,
    hecho: i < hechos,
  }));
}

describe('detalle del plan', () => {
  it('«Cómo vas» cuenta los hábitos del plan en las últimas 2 semanas', () => {
    const ocurrencias = [...dias('a', 5, 6), ...dias('b', 5, 6), ...dias('otro', 0, 6)];
    expect(avanceDelPlan(ocurrencias, new Set(['a', 'b']), HOY, 4)).toEqual({
      hechos: 10,
      total: 12,
    });
  });

  it('con menos de 4 días programados es pronto para medir', () => {
    expect(avanceDelPlan(dias('a', 2, 3), new Set(['a']), HOY, 4)).toBeNull();
  });

  it('no cuenta hoy ni lo de hace más de 2 semanas', () => {
    const ocurrencias = [
      { habitId: 'a', fecha: HOY, hecho: true },
      { habitId: 'a', fecha: '2026-11-01', hecho: true },
      ...dias('a', 4, 4),
    ];
    expect(avanceDelPlan(ocurrencias, new Set(['a']), HOY, 4)).toEqual({ hechos: 4, total: 4 });
  });

  it('días para la revisión: desde la última o desde el inicio, nunca negativos', () => {
    expect(diasParaRevision(HOY, '2026-11-17', '2026-11-01', 7)).toBe(3);
    expect(diasParaRevision(HOY, null, '2026-11-20', 7)).toBe(6);
    expect(diasParaRevision(HOY, '2026-11-01', '2026-11-01', 7)).toBe(0);
  });
});
