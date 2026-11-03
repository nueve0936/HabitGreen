import { cambiosAlEquipar, type AccesorioPropio } from '../equipar';

const gorra: AccesorioPropio = { id: 'gorra', tipo: 'sombrero', categoria_equipada: null };
const boina: AccesorioPropio = { id: 'boina', tipo: 'sombrero', categoria_equipada: 'A' };
const lentes: AccesorioPropio = { id: 'lentes', tipo: 'lentes', categoria_equipada: 'A' };

describe('equipar accesorios (SDD 6.4)', () => {
  it('ponerlo en una planta quita el otro del mismo tipo, no los de otro tipo', () => {
    expect(cambiosAlEquipar(gorra, 'A', [gorra, boina, lentes])).toEqual([
      { id: 'boina', categoria_equipada: null },
      { id: 'gorra', categoria_equipada: 'A' },
    ]);
  });

  it('moverlo a otra planta lo quita de la anterior (una sola fila cambia)', () => {
    expect(cambiosAlEquipar(boina, 'B', [gorra, boina, lentes])).toEqual([
      { id: 'boina', categoria_equipada: 'B' },
    ]);
  });

  it('quitarlo y equiparlo donde ya está', () => {
    expect(cambiosAlEquipar(boina, null, [boina])).toEqual([
      { id: 'boina', categoria_equipada: null },
    ]);
    expect(cambiosAlEquipar(boina, 'A', [boina])).toEqual([]);
  });
});
