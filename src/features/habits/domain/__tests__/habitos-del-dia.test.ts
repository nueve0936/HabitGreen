import {
  habitosDelDia,
  horarioVigente,
  type Habito,
  type Horario,
  type Ocurrencia,
  type Registro,
} from '../habitos-del-dia';

// 2026-11-02 es lunes (ISO 1).
const LUNES = '2026-11-02';
const MARTES = '2026-11-03';

function habito(id: string, cambios: Partial<Habito> = {}): Habito {
  return {
    id,
    category_id: 'c1',
    plan_id: null,
    titulo: `Hábito ${id}`,
    descripcion: null,
    duracion_min: 5,
    activo: true,
    archivado_en: null,
    ...cambios,
  };
}

function horario(habitId: string, cambios: Partial<Horario> = {}): Horario {
  return {
    id: `s-${habitId}`,
    habit_id: habitId,
    dias_semana: [1, 3, 5],
    hora: '08:00',
    flexible: false,
    notificar: true,
    vigente_desde: '2026-10-01',
    vigente_hasta: null,
    ...cambios,
  };
}

const ninguna: Ocurrencia[] = [];
const sinRegistros: Registro[] = [];

describe('hábitos del día (Hoy)', () => {
  it('incluye solo los programados para ese día de la semana', () => {
    const hs = [habito('a'), habito('b')];
    const horarios = [horario('a'), horario('b', { dias_semana: [2, 4] })];
    expect(
      habitosDelDia(LUNES, hs, horarios, ninguna, sinRegistros).map((h) => h.habito.id),
    ).toEqual(['a']);
    expect(
      habitosDelDia(MARTES, hs, horarios, ninguna, sinRegistros).map((h) => h.habito.id),
    ).toEqual(['b']);
  });

  it('omite pausados y archivados', () => {
    const hs = [habito('a', { activo: false }), habito('b', { archivado_en: '2026-11-01T10:00Z' })];
    const horarios = [horario('a'), horario('b')];
    expect(habitosDelDia(LUNES, hs, horarios, ninguna, sinRegistros)).toEqual([]);
  });

  it('usa el horario vigente en la fecha', () => {
    const viejo = horario('a', { id: 'viejo', vigente_hasta: '2026-11-01', dias_semana: [1] });
    const nuevo = horario('a', { id: 'nuevo', vigente_desde: LUNES, dias_semana: [2] });
    expect(horarioVigente([viejo, nuevo], '2026-10-26')?.id).toBe('viejo');
    expect(horarioVigente([viejo, nuevo], LUNES)?.id).toBe('nuevo');
    // El lunes ya vale el horario nuevo, que no incluye el lunes.
    expect(habitosDelDia(LUNES, [habito('a')], [viejo, nuevo], ninguna, sinRegistros)).toEqual([]);
  });

  it('no muestra hábitos cuyo horario empieza después', () => {
    const futuro = horario('a', { vigente_desde: MARTES });
    expect(habitosDelDia(LUNES, [habito('a')], [futuro], ninguna, sinRegistros)).toEqual([]);
  });

  it('marca como hecho solo con un registro vigente de esa fecha', () => {
    const registros: Registro[] = [
      { habit_id: 'a', fecha: LUNES, eliminado_en: null },
      { habit_id: 'b', fecha: LUNES, eliminado_en: '2026-11-02T10:00Z' },
      { habit_id: 'c', fecha: '2026-10-30', eliminado_en: null },
    ];
    const hs = [habito('a'), habito('b'), habito('c')];
    const horarios = [horario('a'), horario('b'), horario('c')];
    const hechos = habitosDelDia(LUNES, hs, horarios, ninguna, registros).map((h) => [
      h.habito.id,
      h.hecho,
    ]);
    expect(hechos).toEqual([
      ['a', true],
      ['b', false],
      ['c', false],
    ]);
  });

  it('respeta las reprogramaciones: sale del día original y llega al nuevo', () => {
    const ocurrencias: Ocurrencia[] = [
      { habit_id: 'a', fecha_original: LUNES, fecha_nueva: MARTES, estado: 'movida' },
    ];
    const hs = [habito('a')];
    const horarios = [horario('a')];
    expect(habitosDelDia(LUNES, hs, horarios, ocurrencias, sinRegistros)).toEqual([]);
    const martes = habitosDelDia(MARTES, hs, horarios, ocurrencias, sinRegistros);
    expect(martes.map((h) => [h.habito.id, h.reprogramado])).toEqual([['a', true]]);
  });

  it('ordena por hora y deja los flexibles al final', () => {
    const hs = [habito('a'), habito('b'), habito('c')];
    const horarios = [
      horario('a', { hora: '20:30:00' }),
      horario('b', { hora: null, flexible: true }),
      horario('c', { hora: '08:00:00' }),
    ];
    expect(
      habitosDelDia(LUNES, hs, horarios, ninguna, sinRegistros).map((h) => h.habito.id),
    ).toEqual(['c', 'a', 'b']);
  });
});
