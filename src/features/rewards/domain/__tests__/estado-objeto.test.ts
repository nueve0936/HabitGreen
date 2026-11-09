import { estadoFase } from '../estado-fase';
import { estadoObjeto } from '../estado-objeto';

describe('estado de un objeto en la Tienda (SDD 6.4)', () => {
  it('con saldo suficiente es comprable y dice cuánto queda', () => {
    expect(estadoObjeto(30, 100, false)).toEqual({ tipo: 'comprable', quedan: 70 });
  });

  it('con el saldo exacto también se puede comprar', () => {
    expect(estadoObjeto(30, 30, false)).toEqual({ tipo: 'comprable', quedan: 0 });
  });

  it('sin saldo suficiente dice cuánto falta', () => {
    expect(estadoObjeto(60, 20, false)).toEqual({ tipo: 'faltan', faltan: 40 });
  });

  it('lo que ya es tuyo no se vuelve a ofrecer, tengas o no saldo', () => {
    expect(estadoObjeto(60, 0, true)).toEqual({ tipo: 'tuyo' });
    expect(estadoObjeto(60, 999, true)).toEqual({ tipo: 'tuyo' });
  });
});

describe('estado de una fase en Detalles (SDD 9.4)', () => {
  it('distingue la actual, las alcanzadas y las bloqueadas', () => {
    expect(estadoFase(2, 2)).toBe('actual');
    expect(estadoFase(1, 2)).toBe('alcanzada');
    expect(estadoFase(3, 2)).toBe('bloqueada');
  });

  it('una fase vuelve a bloquearse si la planta regresa de fase', () => {
    expect(estadoFase(2, 1)).toBe('bloqueada');
  });
});
