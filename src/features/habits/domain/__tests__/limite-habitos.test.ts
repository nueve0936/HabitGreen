import { alcanzoLimiteHabitos, limiteHabitos } from '../limite-habitos';

describe('límite de hábitos del usuario guiado', () => {
  it('empieza con 3', () => {
    expect(limiteHabitos({ modo: 'guiado', subidas: 0, desbloqueado: false })).toBe(3);
  });

  it('suma 1 por cada subida de nivel del plan', () => {
    expect(limiteHabitos({ modo: 'guiado', subidas: 2, desbloqueado: false })).toBe(5);
  });

  it('sin límite con el plan desbloqueado o en modo tradicional', () => {
    expect(limiteHabitos({ modo: 'guiado', subidas: 1, desbloqueado: true })).toBeNull();
    expect(limiteHabitos({ modo: 'tradicional', subidas: 0, desbloqueado: false })).toBeNull();
  });

  it('se alcanza al tener tantos activos como el límite', () => {
    expect(alcanzoLimiteHabitos(2, 3)).toBe(false);
    expect(alcanzoLimiteHabitos(3, 3)).toBe(true);
    expect(alcanzoLimiteHabitos(50, null)).toBe(false);
  });
});
