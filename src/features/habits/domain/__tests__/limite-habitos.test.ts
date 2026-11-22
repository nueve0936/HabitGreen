import {
  cabe,
  type EstadoLimites,
  limiteDelPlan,
  limitePlanes,
  limitePropios,
} from '../limite-habitos';

const plan = (desbloqueado = false, activos = 2) => ({ id: 'p', desbloqueado, activos });
const estado = (e: Partial<EstadoLimites>): EstadoLimites => ({
  planes: [plan()],
  propiosActivos: 0,
  subidas: 0,
  ...e,
});

describe('límite de hábitos propios', () => {
  it('sin planes activos no hay límite', () => {
    expect(limitePropios(estado({ planes: [] }))).toBeNull();
  });

  it('con un plan empieza en 3 y suma 1 por subida', () => {
    expect(limitePropios(estado({}))).toBe(3);
    expect(limitePropios(estado({ subidas: 2 }))).toBe(5);
  });

  it('con cualquier plan desbloqueado ya no hay límite', () => {
    expect(limitePropios(estado({ planes: [plan(), plan(true)] }))).toBeNull();
  });
});

describe('planes que se ganan', () => {
  it('empieza con 1 y suma 1 por subida', () => {
    expect(limitePlanes(0)).toBe(1);
    expect(limitePlanes(2)).toBe(3);
  });

  it('como mucho uno por área', () => {
    expect(limitePlanes(10)).toBe(5);
  });
});

describe('límite de un plan', () => {
  it('usa el tope de la configuración, salvo desbloqueado', () => {
    expect(limiteDelPlan(plan(), 3)).toBe(3);
    expect(limiteDelPlan(plan(true), 3)).toBeNull();
  });
});

describe('cabe', () => {
  it('cabe mientras haya menos activos que el límite', () => {
    expect(cabe(2, 3)).toBe(true);
    expect(cabe(3, 3)).toBe(false);
    expect(cabe(50, null)).toBe(true);
  });
});
