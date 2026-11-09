import {
  cambiosAlEquipar,
  plantaParaEquipar,
  type AccesorioPropio,
  type PlantaCandidata,
} from '../equipar';

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

describe('planta para «Equipar ahora» (SDD 9.4)', () => {
  const planta = (
    categoryId: string,
    tieneHabitos: boolean,
    tipos: AccesorioPropio['tipo'][] = [],
  ): PlantaCandidata => ({
    categoryId,
    tieneHabitos,
    equipados: tipos.map((tipo) => ({ tipo })),
  });

  it('usa la planta de origen, aunque ya lleve ese tipo y no tenga hábitos', () => {
    const plantas = [planta('A', true), planta('B', false, ['sombrero'])];
    expect(plantaParaEquipar('sombrero', plantas, 'B')).toBe('B');
  });

  it('sin origen, prefiere la primera con hábitos y ese tipo libre', () => {
    const plantas = [
      planta('A', false),
      planta('B', true, ['sombrero']),
      planta('C', true, ['lentes']),
    ];
    expect(plantaParaEquipar('sombrero', plantas)).toBe('C');
  });

  it('si todas las que tienen hábitos llevan ese tipo, usa la primera con hábitos', () => {
    const plantas = [planta('A', false), planta('B', true, ['maceta'])];
    expect(plantaParaEquipar('maceta', plantas)).toBe('B');
  });

  it('sin hábitos, usa la primera con ese tipo libre', () => {
    const plantas = [planta('A', false, ['lentes']), planta('B', false)];
    expect(plantaParaEquipar('lentes', plantas)).toBe('B');
  });

  it('si ninguna tiene hábitos ni el tipo libre, usa la primera', () => {
    const plantas = [planta('A', false, ['lentes']), planta('B', false, ['lentes'])];
    expect(plantaParaEquipar('lentes', plantas)).toBe('A');
  });

  it('un origen que ya no existe se ignora, y sin plantas devuelve null', () => {
    expect(plantaParaEquipar('lentes', [planta('A', true)], 'Z')).toBe('A');
    expect(plantaParaEquipar('lentes', [])).toBeNull();
  });
});
