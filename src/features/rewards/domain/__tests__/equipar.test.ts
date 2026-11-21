import {
  cambiosAlEquipar,
  plantaParaEquipar,
  type AccesorioPropio,
  type PlantaCandidata,
} from '../equipar';

const gorra: AccesorioPropio = { id: 'gorra', tipo: 'sombrero', categorias_equipadas: [] };
const boina: AccesorioPropio = { id: 'boina', tipo: 'sombrero', categorias_equipadas: ['A'] };
const lentes: AccesorioPropio = { id: 'lentes', tipo: 'lentes', categorias_equipadas: ['A'] };

describe('equipar accesorios (SDD 6.4)', () => {
  it('ponerlo en una planta quita el otro del mismo tipo, no los de otro tipo', () => {
    expect(cambiosAlEquipar(gorra, 'A', true, [gorra, boina, lentes])).toEqual([
      { id: 'boina', categorias_equipadas: [] },
      { id: 'gorra', categorias_equipadas: ['A'] },
    ]);
  });

  it('el mismo objeto puede ir en otra planta sin dejar la primera', () => {
    expect(cambiosAlEquipar(boina, 'B', true, [gorra, boina, lentes])).toEqual([
      { id: 'boina', categorias_equipadas: ['A', 'B'] },
    ]);
  });

  it('reemplaza solo en esa planta: el otro sigue en las demás', () => {
    const enDos: AccesorioPropio = { ...boina, categorias_equipadas: ['A', 'B'] };
    expect(cambiosAlEquipar(gorra, 'B', true, [gorra, enDos])).toEqual([
      { id: 'boina', categorias_equipadas: ['A'] },
      { id: 'gorra', categorias_equipadas: ['B'] },
    ]);
  });

  it('quitarlo de una planta no lo quita de las otras', () => {
    const enDos: AccesorioPropio = { ...boina, categorias_equipadas: ['A', 'B'] };
    expect(cambiosAlEquipar(enDos, 'A', false, [enDos])).toEqual([
      { id: 'boina', categorias_equipadas: ['B'] },
    ]);
  });

  it('sin cambios si ya está (o ya no está) en esa planta', () => {
    expect(cambiosAlEquipar(boina, 'A', true, [boina])).toEqual([]);
    expect(cambiosAlEquipar(gorra, 'A', false, [gorra])).toEqual([]);
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

  it('salta las plantas que ya llevan ese objeto; si todas lo llevan, elige entre todas', () => {
    const plantas = [planta('A', true), planta('B', true)];
    expect(plantaParaEquipar('sombrero', plantas, null, ['A'])).toBe('B');
    expect(plantaParaEquipar('sombrero', plantas, null, ['A', 'B'])).toBe('A');
  });

  it('un origen que ya no existe se ignora, y sin plantas devuelve null', () => {
    expect(plantaParaEquipar('lentes', [planta('A', true)], 'Z')).toBe('A');
    expect(plantaParaEquipar('lentes', [])).toBeNull();
  });
});
