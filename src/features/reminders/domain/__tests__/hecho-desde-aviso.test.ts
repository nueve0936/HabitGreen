import { ACCION_HECHO, decidirHecho, leerHechoDeAviso } from '../hecho-desde-aviso';

describe('leerHechoDeAviso', () => {
  it('lee el hábito y el día del botón «Hecho»', () => {
    expect(leerHechoDeAviso(ACCION_HECHO, { habitId: 'h1', dia: '2026-11-22' })).toEqual({
      habitId: 'h1',
      dia: '2026-11-22',
    });
  });

  it('ignora tocar el aviso y los datos incompletos', () => {
    expect(
      leerHechoDeAviso('expo.modules.notifications.actions.DEFAULT', { habitId: 'h1', dia: 'x' }),
    ).toBeNull();
    expect(leerHechoDeAviso(ACCION_HECHO, { habitId: 'h1' })).toBeNull();
    expect(leerHechoDeAviso(ACCION_HECHO, null)).toBeNull();
  });
});

describe('decidirHecho', () => {
  const items = [
    { habito: { id: 'a' }, hecho: false },
    { habito: { id: 'b' }, hecho: true },
  ];
  const hoy = '2026-11-22';

  it('marca el hábito de hoy que falta', () => {
    expect(decidirHecho({ habitId: 'a', dia: hoy }, hoy, items)).toEqual({
      tipo: 'marcar',
      item: items[0],
    });
  });

  it('no hace nada si ya estaba hecho o ya no toca hoy', () => {
    expect(decidirHecho({ habitId: 'b', dia: hoy }, hoy, items)).toEqual({ tipo: 'nada' });
    expect(decidirHecho({ habitId: 'z', dia: hoy }, hoy, items)).toEqual({ tipo: 'nada' });
  });

  it('un aviso de otro día no marca nada', () => {
    expect(decidirHecho({ habitId: 'a', dia: '2026-11-21' }, hoy, items)).toEqual({
      tipo: 'otro_dia',
    });
  });
});
