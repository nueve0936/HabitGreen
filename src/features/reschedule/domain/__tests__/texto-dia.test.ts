import { destinoDia, diaCorto } from '../texto-dia';

// Hoy es miércoles 2026-11-18.
const HOY = '2026-11-18';

describe('nombre del día destino', () => {
  it('en la tarjeta: a hoy, a mañana o al día con su número', () => {
    expect(destinoDia(HOY, HOY)).toBe('a hoy');
    expect(destinoDia('2026-11-19', HOY)).toBe('a mañana');
    expect(destinoDia('2026-11-21', HOY)).toBe('al sábado 21');
    expect(destinoDia('2026-12-01', '2026-11-28')).toBe('al martes 1');
  });

  it('en el selector: Hoy, Mañana o el día corto', () => {
    expect(diaCorto(HOY, HOY)).toBe('Hoy');
    expect(diaCorto('2026-11-19', HOY)).toBe('Mañana');
    expect(diaCorto('2026-11-22', HOY)).toBe('Dom 22');
  });
});
