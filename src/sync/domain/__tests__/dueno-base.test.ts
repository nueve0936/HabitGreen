import { accionDueno } from '../dueno-base';

describe('dueño de la base local', () => {
  it('la misma cuenta conserva sus datos', () => {
    expect(accionDueno('ana', 'ana')).toBe('mantener');
  });

  it('otra cuenta vacía la base', () => {
    expect(accionDueno('ana', 'beto')).toBe('vaciar');
    expect(accionDueno('beto', 'carla')).toBe('vaciar');
  });

  it('sin dueño anotado, solo se anota', () => {
    expect(accionDueno(null, 'carla')).toBe('anotar');
  });
});
