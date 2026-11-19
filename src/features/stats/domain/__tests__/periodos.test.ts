import {
  hayAnterior,
  haySiguiente,
  mismoDiaEn,
  periodo,
  semanasDeCalendario,
  semanasDeTira,
} from '../periodos';

// Hoy es miércoles 2026-11-18.
const HOY = '2026-11-18';

describe('periodos de Progreso', () => {
  it('la semana va de lunes a domingo y se parte en días', () => {
    const p = periodo('semana', HOY);
    expect([p.desde, p.hasta]).toEqual(['2026-11-16', '2026-11-22']);
    expect(p.divisiones).toHaveLength(7);
    expect(p.divisiones[2]).toEqual({ desde: HOY, hasta: HOY });
  });

  it('la semana anterior cruza de mes y de año sin desfasarse', () => {
    expect(periodo('semana', HOY, -1)).toMatchObject({ desde: '2026-11-09', hasta: '2026-11-15' });
    expect(periodo('semana', '2027-01-01')).toMatchObject({
      desde: '2026-12-28',
      hasta: '2027-01-03',
    });
  });

  it('el mes se parte en semanas recortadas a sus límites', () => {
    const p = periodo('mes', HOY);
    expect([p.desde, p.hasta]).toEqual(['2026-11-01', '2026-11-30']);
    // El 1 de noviembre de 2026 es domingo: la primera «semana» es solo ese día.
    expect(p.divisiones.map((d) => `${d.desde.slice(8)}-${d.hasta.slice(8)}`)).toEqual([
      '01-01',
      '02-08',
      '09-15',
      '16-22',
      '23-29',
      '30-30',
    ]);
  });

  it('los meses anteriores cambian de año', () => {
    expect(periodo('mes', HOY, -11)).toMatchObject({ desde: '2025-12-01', hasta: '2025-12-31' });
    expect(periodo('mes', '2028-03-10', -1)).toMatchObject({ hasta: '2028-02-29' });
  });

  it('el año se parte en 12 meses', () => {
    const p = periodo('anio', HOY, -1);
    expect([p.desde, p.hasta]).toEqual(['2025-01-01', '2025-12-31']);
    expect(p.divisiones[1]).toEqual({ desde: '2025-02-01', hasta: '2025-02-28' });
  });

  it('se puede ir atrás hasta el primer horario y adelante hasta el actual', () => {
    expect(hayAnterior(periodo('semana', HOY), '2026-11-17')).toBe(false);
    expect(hayAnterior(periodo('semana', HOY), '2026-11-10')).toBe(true);
    expect(hayAnterior(periodo('semana', HOY), null)).toBe(false);
    expect(haySiguiente(periodo('semana', HOY))).toBe(false);
    expect(haySiguiente(periodo('semana', HOY, -1))).toBe(true);
  });
});

describe('tira de días y calendario', () => {
  it('la tira va por semanas de lunes a domingo, del primer horario a la de hoy + 7', () => {
    const semanas = semanasDeTira('2026-11-12', HOY);
    expect(semanas.map((s) => [s[0], s[6]])).toEqual([
      ['2026-11-09', '2026-11-15'],
      ['2026-11-16', '2026-11-22'],
      ['2026-11-23', '2026-11-29'],
    ]);
    expect(semanasDeTira(null, HOY)[0][0]).toBe('2026-11-16');
  });

  it('cruza de mes y de año, con un año atrás como máximo', () => {
    expect(semanasDeTira('2026-12-30', '2026-12-31')[0]).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
    // 365 días antes de hoy cae el martes 18 de noviembre de 2025: su semana empieza el lunes 17.
    expect(semanasDeTira('2020-01-01', HOY)[0][0]).toBe('2025-11-17');
  });

  it('al cambiar de semana se queda el mismo día de la semana', () => {
    const [anterior] = semanasDeTira('2026-11-12', HOY);
    expect(mismoDiaEn(anterior, HOY)).toBe('2026-11-11');
  });

  it('el calendario del mes va de lunes a domingo con huecos', () => {
    const filas = semanasDeCalendario(periodo('mes', HOY));
    expect(filas[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(filas.at(-1)).toEqual(['2026-11-30', null, null, null, null, null, null]);
    expect(filas).toHaveLength(6);
  });
});
