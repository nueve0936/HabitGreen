import { siguientePaso } from '../permiso';

describe('siguientePaso', () => {
  it('con el permiso dado no hay nada que hacer', () => {
    expect(siguientePaso({ concedido: true, puedePreguntar: true })).toBe('listo');
    expect(siguientePaso({ concedido: true, puedePreguntar: false })).toBe('listo');
  });

  it('sin permiso, se pregunta si Android lo deja', () => {
    expect(siguientePaso({ concedido: false, puedePreguntar: true })).toBe('preguntar');
  });

  it('si Android ya no deja preguntar, se manda a Ajustes', () => {
    expect(siguientePaso({ concedido: false, puedePreguntar: false })).toBe('ajustes');
  });
});
