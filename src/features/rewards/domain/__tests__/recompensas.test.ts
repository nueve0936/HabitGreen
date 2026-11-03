import {
  aplicarCompletar,
  aplicarDeshacer,
  faseDeNivel,
  plantaConXp,
  RECOMPENSAS_POR_DEFECTO as C,
  type EstadoDia,
  type LogDelDia,
} from '../recompensas';

function log(habit: string, cambios: Partial<LogDelDia> = {}): LogDelDia {
  return {
    id: `l-${habit}`,
    habit_id: habit,
    category_id: 'A',
    completado_en: `2026-11-03T10:0${habit.length}:00Z`,
    xp_otorgado: false,
    monedas_otorgadas: false,
    ...cambios,
  };
}

const vacio: EstadoDia = { planta: { xp: 0, nivel: 0, fase: 1 }, saldo: 0, logs: [] };

describe('nivel y fase (SDD 6.1)', () => {
  it('4 XP por nivel, fase 2 desde el 15 y fase 3 en el 30', () => {
    expect(plantaConXp({ xp: 58, nivel: 14, fase: 1 }, 2, C)).toEqual({
      xp: 60,
      nivel: 15,
      fase: 2,
    });
    expect(plantaConXp({ xp: 118, nivel: 29, fase: 2 }, 2, C)).toEqual({
      xp: 120,
      nivel: 30,
      fase: 3,
    });
    expect(faseDeNivel(14, C)).toBe(1);
  });

  it('el XP no baja de 0', () => {
    expect(plantaConXp({ xp: 0, nivel: 0, fase: 1 }, -2, C).xp).toBe(0);
  });
});

describe('completar', () => {
  it('el primero da XP y monedas', () => {
    const r = aplicarCompletar(vacio, log('a'), C);
    expect(r.monedas).toBe(true);
    expect(r.estado.planta.xp).toBe(2);
    expect(r.estado.saldo).toBe(10);
    expect(r.estado.logs[0]).toMatchObject({ xp_otorgado: true, monedas_otorgadas: true });
  });

  it('un segundo hábito de la misma planta da monedas pero no XP', () => {
    const r1 = aplicarCompletar(vacio, log('a'), C);
    const r2 = aplicarCompletar(r1.estado, log('b'), C);
    expect(r2.estado.planta.xp).toBe(2);
    expect(r2.estado.saldo).toBe(20);
  });

  it('el XP de otra planta no cuenta para el tope', () => {
    const estado = { ...vacio, logs: [log('x', { category_id: 'B', xp_otorgado: true })] };
    expect(aplicarCompletar(estado, log('a'), C).estado.planta.xp).toBe(2);
  });

  it('el sexto del día ya no da monedas', () => {
    const logs = ['a', 'b', 'c', 'd', 'e'].map((h) =>
      log(h, { category_id: h, monedas_otorgadas: true }),
    );
    const r = aplicarCompletar({ ...vacio, saldo: 50, logs }, log('f'), C);
    expect(r.monedas).toBe(false);
    expect(r.estado.saldo).toBe(50);
  });

  it('en nivel 30 no suma XP y avisa el cambio de fase al llegar', () => {
    const maxima = { xp: 120, nivel: 30, fase: 3 };
    expect(aplicarCompletar({ ...vacio, planta: maxima }, log('a'), C).estado.planta).toEqual(
      maxima,
    );
    const casi = { xp: 58, nivel: 14, fase: 1 };
    expect(aplicarCompletar({ ...vacio, planta: casi }, log('a'), C).cambioFase).toBe(2);
  });
});

describe('deshacer', () => {
  it('revierte y transfiere XP y monedas al que se quedó sin ellos', () => {
    const logs = [
      log('a', { xp_otorgado: true, monedas_otorgadas: true }),
      log('bb', { monedas_otorgadas: true }),
      log('ccc', { category_id: 'B', monedas_otorgadas: true }),
      log('dddd', { category_id: 'C', monedas_otorgadas: true }),
      log('eeeee', { category_id: 'D', monedas_otorgadas: true }),
      log('ffffff', { category_id: 'E' }),
    ];
    const r = aplicarDeshacer({ planta: { xp: 2, nivel: 0, fase: 1 }, saldo: 50, logs }, 'a', C);
    expect(r.estado.planta.xp).toBe(2);
    expect(r.estado.saldo).toBe(50);
    expect(r.estado.logs.find((l) => l.habit_id === 'bb')?.xp_otorgado).toBe(true);
    expect(r.estado.logs.find((l) => l.habit_id === 'ffffff')?.monedas_otorgadas).toBe(true);
    expect(r.estado.logs.some((l) => l.habit_id === 'a')).toBe(false);
  });

  it('si ya se gastaron las monedas, el saldo queda en 0', () => {
    const logs = [log('a', { xp_otorgado: true, monedas_otorgadas: true })];
    const r = aplicarDeshacer({ planta: { xp: 2, nivel: 0, fase: 1 }, saldo: 4, logs }, 'a', C);
    expect(r.estado.saldo).toBe(0);
    expect(r.estado.planta.xp).toBe(0);
  });

  it('deshacer el hábito que cambió la fase la regresa', () => {
    const logs = [log('a', { xp_otorgado: true })];
    const r = aplicarDeshacer({ planta: { xp: 60, nivel: 15, fase: 2 }, saldo: 0, logs }, 'a', C);
    expect(r.estado.planta.fase).toBe(1);
  });

  it('sin registro activo no cambia nada', () => {
    expect(aplicarDeshacer(vacio, 'a', C).estado).toBe(vacio);
  });
});
