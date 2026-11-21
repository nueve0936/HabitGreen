import { valoresNuevos } from '../valores-formulario';
import { borradorParaHoy, type BorradorHabito } from '../borrador-habito';

const HOY = '2026-11-19';

const guardado = (cambios: Partial<BorradorHabito> = {}): BorradorHabito => ({
  userId: 'u1',
  fecha: HOY,
  paso: 2,
  valores: { ...valoresNuevos(HOY), nombre: 'Leer' },
  ...cambios,
});

describe('borrador del asistente de hábito', () => {
  it('se retoma el de la misma cuenta, con su paso y lo escrito', () => {
    const b = borradorParaHoy(guardado(), 'u1', HOY);
    expect(b?.paso).toBe(2);
    expect(b?.valores.nombre).toBe('Leer');
  });

  it('no hay borrador si no existe o es de otra cuenta', () => {
    expect(borradorParaHoy(null, 'u1', HOY)).toBeNull();
    expect(borradorParaHoy(guardado(), 'u2', HOY)).toBeNull();
  });

  it('dura 7 días', () => {
    expect(borradorParaHoy(guardado({ fecha: '2026-11-13' }), 'u1', HOY)).not.toBeNull();
    expect(borradorParaHoy(guardado({ fecha: '2026-11-12' }), 'u1', HOY)).toBeNull();
  });

  it('una fecha de inicio pasada pasa a hoy y un fin anterior se quita', () => {
    const viejo = guardado({
      fecha: '2026-11-17',
      valores: {
        ...valoresNuevos('2026-11-17'),
        fecha_inicio: '2026-11-17',
        fecha_fin: '2026-11-18',
      },
    });
    const b = borradorParaHoy(viejo, 'u1', HOY);
    expect(b?.valores.fecha_inicio).toBe(HOY);
    expect(b?.valores.fecha_fin).toBeNull();
  });

  it('una fecha de inicio futura se respeta', () => {
    const futuro = guardado({ valores: { ...valoresNuevos(HOY), fecha_inicio: '2026-11-25' } });
    expect(borradorParaHoy(futuro, 'u1', HOY)?.valores.fecha_inicio).toBe('2026-11-25');
  });
});
