import type { Horario } from '../habitos-del-dia';
import { nuevaVersionHorario } from '../horario';

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

describe('editar horario (versionado, SDD 4)', () => {
  it('sin cambios no hace nada (la hora de Postgres trae segundos)', () => {
    expect(
      nuevaVersionHorario(
        actual,
        { dias_semana: [5, 1, 3], hora: '08:00', notificar: true },
        HOY,
        'n',
      ),
    ).toBeNull();
  });

  it('si el horario empezó antes, lo cierra ayer y crea otro desde hoy', () => {
    const version = nuevaVersionHorario(
      actual,
      { dias_semana: [2, 4], hora: '19:30', notificar: false },
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
        vigente_hasta: null,
      },
    });
  });

  it('si el horario empezó hoy, se edita en el mismo lugar', () => {
    const deHoy = { ...actual, vigente_desde: HOY };
    const version = nuevaVersionHorario(
      deHoy,
      { dias_semana: [1, 3, 5], hora: '09:00', notificar: true },
      HOY,
      's2',
    );
    expect(version?.cerrar).toBeNull();
    expect(version?.guardar).toMatchObject({ id: 's1', hora: '09:00', vigente_desde: HOY });
  });

  it('elegir una hora deja fijo un aviso flexible; sin hora sigue flexible', () => {
    const flexible = { ...actual, hora: null, flexible: true };
    expect(
      nuevaVersionHorario(
        flexible,
        { dias_semana: [1, 3, 5], hora: '18:00', notificar: true },
        HOY,
        'n',
      )?.guardar,
    ).toMatchObject({ hora: '18:00', flexible: false });
    expect(
      nuevaVersionHorario(flexible, { dias_semana: [1], hora: null, notificar: true }, HOY, 'n')
        ?.guardar,
    ).toMatchObject({ hora: null, flexible: true });
  });
});
