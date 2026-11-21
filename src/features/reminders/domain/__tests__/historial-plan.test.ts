import { historialDelPlan } from '../historial-plan';
import { semanaDeApoyoEnPlanes } from '../semana-apoyo';

describe('apoyo de las semanas 3 y 4 con varios planes', () => {
  it('cada plan usa su historial; si no tiene, el global', () => {
    expect(historialDelPlan({ historial: 'mantiene' }, 'semanas_y_suelta')).toBe('mantiene');
    expect(historialDelPlan(null, 'semanas_y_suelta')).toBe('semanas_y_suelta');
    expect(historialDelPlan({}, 'otra cosa')).toBeNull();
  });

  it('toca si algún plan está en su semana 3 o 4', () => {
    const planes = [
      { historial: 'mantiene' as const, inicioPlan: '2026-11-02' },
      { historial: 'semanas_y_suelta' as const, inicioPlan: '2026-11-02' },
    ];
    // 16 de noviembre: semana 3 desde el 2.
    expect(semanaDeApoyoEnPlanes(planes, '2026-11-16')).toBe(3);
    expect(semanaDeApoyoEnPlanes(planes.slice(0, 1), '2026-11-16')).toBeNull();
    expect(semanaDeApoyoEnPlanes([], '2026-11-16')).toBeNull();
  });
});
