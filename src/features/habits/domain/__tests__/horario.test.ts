import type { Horario } from '../habitos-del-dia';
import { nuevaVersionHorario, type CambiosHorario } from '../horario';

const HOY = '2026-11-02';

const actual: Horario = {
  id: 's1',
  habit_id: 'h1',
  dias_semana: [1, 3, 5],
  hora: '08:00:00',
  flexible: false,
  notificar: true,
  vigente_desde: '2026-10-01',
  vigente_hasta: null,
};

const igual: CambiosHorario = {
  dias_semana: [5, 1, 3],
  hora: '08:00',
  notificar: true,
  vigente_hasta: null,
};

describe('editar horario (versionado, SDD 4)', () => {
  it('sin cambios no hace nada (la hora de Postgres trae segundos)', () => {
    expect(nuevaVersionHorario(actual, igual, HOY, 'n')).toBeNull();
  });

  it('si cambia el patrón de un hábito ya empezado, cierra ayer y crea otro desde hoy', () => {
    const version = nuevaVersionHorario(
      actual,
      { dias_semana: [2, 4], hora: '19:30', notificar: false, vigente_hasta: '2026-12-31' },
      HOY,
      's2',
    );
    expect(version).toEqual({
      cerrar: { id: 's1', vigente_hasta: '2026-11-01' },
      guardar: {
        id: 's2',
        habit_id: 'h1',
        dias_semana: [2, 4],
        hora: '19:30',
        flexible: false,
        notificar: false,
        vigente_desde: HOY,
        vigente_hasta: '2026-12-31',
      },
    });
  });

  it('cambiar solo la fecha de fin no crea otra versión', () => {
    const version = nuevaVersionHorario(
      actual,
      { ...igual, vigente_hasta: '2026-12-31' },
      HOY,
      'n',
    );
    expect(version?.cerrar).toBeNull();
    expect(version?.guardar).toMatchObject({ id: 's1', vigente_hasta: '2026-12-31' });
  });

  it('un hábito que todavía no empieza se edita en su lugar, incluida la fecha de inicio', () => {
    const futuro = { ...actual, vigente_desde: '2026-11-10' };
    const version = nuevaVersionHorario(
      futuro,
      { ...igual, hora: '09:00', vigente_desde: '2026-11-15' },
      HOY,
      'n',
    );
    expect(version?.cerrar).toBeNull();
    expect(version?.guardar).toMatchObject({
      id: 's1',
      hora: '09:00',
      vigente_desde: '2026-11-15',
    });
  });

  it('la fecha de inicio de un hábito ya empezado no cambia', () => {
    expect(
      nuevaVersionHorario(actual, { ...igual, vigente_desde: '2026-11-20' }, HOY, 'n'),
    ).toBeNull();
  });

  it('sin recordatorio: sin hora y sin aviso; un flexible con aviso sigue flexible', () => {
    expect(
      nuevaVersionHorario(actual, { ...igual, hora: null, notificar: false }, HOY, 'n')?.guardar,
    ).toMatchObject({ hora: null, flexible: false, notificar: false });
    const flexible = { ...actual, hora: null, flexible: true };
    expect(
      nuevaVersionHorario(flexible, { ...igual, dias_semana: [1], hora: null }, HOY, 'n')?.guardar,
    ).toMatchObject({ hora: null, flexible: true });
  });
});
