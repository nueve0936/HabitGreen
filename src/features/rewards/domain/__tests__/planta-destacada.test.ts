import { plantaDestacada, plantaEnHoy } from '../planta-destacada';

const planta = (id: string, fase: number, tieneHabitos: boolean) => ({ id, fase, tieneHabitos });

describe('planta destacada de Hoy (SDD 9.4)', () => {
  it('elige la de fase más alta, aunque no tenga hábitos', () => {
    const plantas = [planta('A', 1, true), planta('B', 3, false), planta('C', 2, true)];
    expect(plantaDestacada(plantas)?.id).toBe('B');
  });

  it('en un empate prefiere una con hábitos', () => {
    const plantas = [planta('A', 1, false), planta('B', 1, true), planta('C', 1, true)];
    expect(plantaDestacada(plantas)?.id).toBe('B');
  });

  it('si el empate sigue, usa la primera según el orden de las áreas', () => {
    const plantas = [planta('A', 1, false), planta('B', 1, false)];
    expect(plantaDestacada(plantas)?.id).toBe('A');
  });

  it('sin plantas devuelve null', () => {
    expect(plantaDestacada([])).toBeNull();
  });
});

describe('planta equipada en Hoy', () => {
  const plantas = [
    { area: 'salud_fisica', fase: 3, tieneHabitos: true },
    { area: 'finanzas', fase: 1, tieneHabitos: false },
  ];

  it('usa la equipada aunque no sea la más avanzada', () => {
    expect(plantaEnHoy(plantas, 'finanzas')?.area).toBe('finanzas');
  });

  it('sin elección, o con un área que no está, usa la automática', () => {
    expect(plantaEnHoy(plantas, null)?.area).toBe('salud_fisica');
    expect(plantaEnHoy(plantas, 'otra')?.area).toBe('salud_fisica');
  });
});
