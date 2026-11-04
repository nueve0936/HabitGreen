import { diasDelMes, fechaDesdeMesDia, mesYDia, textoFecha } from '../fechas';

describe('fechas del asistente', () => {
  it('cuenta los días de cada mes, con febrero bisiesto', () => {
    expect(diasDelMes(2026, 2)).toBe(28);
    expect(diasDelMes(2028, 2)).toBe(29);
    expect(diasDelMes(2026, 11)).toBe(30);
  });

  it('deduce el año: la próxima vez que ocurre a partir de la mínima', () => {
    expect(fechaDesdeMesDia(11, 20, '2026-11-03')).toBe('2026-11-20');
    expect(fechaDesdeMesDia(1, 1, '2026-11-03')).toBe('2027-01-01');
    expect(fechaDesdeMesDia(11, 3, '2026-11-03')).toBe('2026-11-03');
    expect(fechaDesdeMesDia(11, 2, '2026-11-03')).toBe('2027-11-02');
  });

  it('ajusta el día al último del mes si no existe', () => {
    expect(fechaDesdeMesDia(2, 31, '2026-11-03')).toBe('2027-02-28');
  });

  it('formatea y separa la fecha', () => {
    expect(textoFecha('2026-11-02')).toBe('02/11/2026');
    expect(mesYDia('2026-01-09')).toEqual({ mes: 1, dia: 9 });
  });
});
