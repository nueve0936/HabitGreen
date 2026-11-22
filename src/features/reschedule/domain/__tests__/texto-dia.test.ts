import { destinoDia, diaCorto, quedoPara } from '../texto-dia';

// Hoy es miércoles 2026-11-18.
const HOY = '2026-11-18';

describe('nombre del día destino', () => {
  it('en la tarjeta: a hoy, a mañana o al día con su número', () => {
    expect(destinoDia(HOY, HOY)).toBe('a hoy');
    expect(destinoDia('2026-11-19', HOY)).toBe('a mañana');
    expect(destinoDia('2026-11-21', HOY)).toBe('al sábado\u00A021');
    expect(destinoDia('2026-12-01', '2026-11-28')).toBe('al martes\u00A01');
  });

  it('en el aviso de éxito: para hoy, para mañana o para el día con su número', () => {
    expect(quedoPara(HOY, HOY)).toBe('para hoy');
    expect(quedoPara('2026-11-19', HOY)).toBe('para mañana');
    expect(quedoPara('2026-11-21', HOY)).toBe('para el sábado\u00A021');
  });

  it('en el selector: Hoy, Mañana o el día corto', () => {
    expect(diaCorto(HOY, HOY)).toBe('Hoy');
    expect(diaCorto('2026-11-19', HOY)).toBe('Mañana');
    expect(diaCorto('2026-11-22', HOY)).toBe('Dom 22');
  });
});
