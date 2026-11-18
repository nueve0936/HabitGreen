import { semanaDeApoyo } from '../semana-apoyo';

describe('semanaDeApoyo', () => {
  it('cuenta las semanas desde que se creó el plan', () => {
    expect(semanaDeApoyo('semanas_y_suelta', '2026-11-02', '2026-11-15')).toBeNull();
    expect(semanaDeApoyo('semanas_y_suelta', '2026-11-02', '2026-11-16')).toBe(3);
    expect(semanaDeApoyo('semanas_y_suelta', '2026-11-02', '2026-11-22')).toBe(3);
    expect(semanaDeApoyo('semanas_y_suelta', '2026-11-02', '2026-11-23')).toBe(4);
    expect(semanaDeApoyo('semanas_y_suelta', '2026-11-02', '2026-11-30')).toBeNull();
  });

  it('solo aplica a quien suele soltar el hábito a las pocas semanas', () => {
    expect(semanaDeApoyo('mantiene', '2026-11-02', '2026-11-16')).toBeNull();
    expect(semanaDeApoyo(null, '2026-11-02', '2026-11-16')).toBeNull();
  });

  it('sin plan no hay apoyo', () => {
    expect(semanaDeApoyo('semanas_y_suelta', null, '2026-11-16')).toBeNull();
  });
});
