import {
  activosTotales,
  cabe,
  estadoDesde,
  type EstadoLimites,
  limiteDelPlan,
  limiteTotal,
  lugaresLibres,
} from '../limite-habitos';

const plan = (desbloqueado = false, activos = 2) => ({ id: 'p', desbloqueado, activos });
const estado = (e: Partial<EstadoLimites>): EstadoLimites => ({
  planes: [plan()],
  propiosActivos: 0,
  subidas: 0,
  ...e,
});

describe('cupo total de hábitos', () => {
  it('sin planes activos no hay límite', () => {
    expect(limiteTotal(estado({ planes: [] }))).toBeNull();
    expect(lugaresLibres(estado({ planes: [], propiosActivos: 9 }))).toBeNull();
  });

  it('con un plan empieza en 3 y suma 1 por subida', () => {
    expect(limiteTotal(estado({}))).toBe(3);
    expect(limiteTotal(estado({ subidas: 2 }))).toBe(5);
  });

  it('con cualquier plan desbloqueado ya no hay límite', () => {
    expect(limiteTotal(estado({ planes: [plan(), plan(true)] }))).toBeNull();
  });

  it('cuenta juntos los del plan y los propios', () => {
    const e = estado({ planes: [plan(false, 2)], propiosActivos: 1 });
    expect(activosTotales(e)).toBe(3);
    expect(lugaresLibres(e)).toBe(0);
    expect(lugaresLibres(estado({ planes: [plan(false, 1)] }))).toBe(2);
  });

  it('los lugares libres nunca son negativos', () => {
    expect(lugaresLibres(estado({ propiosActivos: 5 }))).toBe(0);
  });
});

describe('estadoDesde', () => {
  it('solo cuenta activos y trata como propio un hábito de un plan terminado', () => {
    const e = estadoDesde(
      [{ id: 'p', desbloqueado: false }],
      [
        { plan_id: 'p', activo: true, archivado_en: null },
        { plan_id: 'p', activo: false, archivado_en: null },
        { plan_id: null, activo: true, archivado_en: null },
        { plan_id: null, activo: true, archivado_en: '2026-11-01T00:00:00Z' },
        { plan_id: 'viejo', activo: true, archivado_en: null },
      ],
      1,
    );
    expect(e).toEqual({
      planes: [{ id: 'p', desbloqueado: false, activos: 1 }],
      propiosActivos: 2,
      subidas: 1,
    });
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
