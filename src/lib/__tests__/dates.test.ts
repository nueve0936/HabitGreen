import { diaIso, fechaLocal, sumarDias } from '../dates';

describe('fechas de hábitos', () => {
  it('fechaLocal usa la fecha del teléfono', () => {
    expect(fechaLocal(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('suma y resta días cruzando meses y años', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2026-11-01', -365)).toBe('2025-11-01');
  });

  it('día ISO: lunes = 1, domingo = 7', () => {
    expect(diaIso('2026-11-02')).toBe(1);
    expect(diaIso('2026-11-01')).toBe(7);
  });
});
