import {
  ajustePresupuesto,
  limiteDuracionPlan,
  limiteTiempoDiario,
  minutosPorDia,
  TIEMPO_DIARIO_MAX,
} from '../presupuesto';

describe('presupuesto diario (SDD 6.5)', () => {
  it('suma los minutos de cada día de la semana', () => {
    expect(
      minutosPorDia([
        { duracion_min: 10, dias_semana: [1, 2, 3, 4, 5, 6, 7] },
        { duracion_min: 15, dias_semana: [1, 3] },
      ]),
    ).toEqual([25, 10, 25, 10, 10, 10, 10]);
  });

  it('sin hábitos no hay minutos', () => {
    expect(minutosPorDia([])).toEqual([0, 0, 0, 0, 0, 0, 0]);
  });

  it('si un día supera el presupuesto, sube a la suma real', () => {
    expect(ajustePresupuesto(20, [25, 10, 0, 0, 0, 0, 0])).toEqual({
      excede: true,
      nuevoPresupuesto: 25,
    });
  });

  it('igualar el presupuesto no lo excede', () => {
    expect(ajustePresupuesto(20, [20, 5, 0, 0, 0, 0, 0])).toEqual({
      excede: false,
      nuevoPresupuesto: 20,
    });
  });
});

describe('límite de duración de un hábito del plan', () => {
  it('es el tiempo diario entre los hábitos del plan', () => {
    expect(limiteDuracionPlan(20, 2, 5)).toBe(10);
    expect(limiteDuracionPlan(40, 3, 5)).toBe(13);
  });

  it('nunca baja de lo que el hábito ya tiene', () => {
    expect(limiteDuracionPlan(10, 2, 8)).toBe(8);
  });

  it('sin hábitos contados, todo el tiempo diario', () => {
    expect(limiteDuracionPlan(20, 0, 5)).toBe(20);
  });
});

describe('límite del tiempo diario en Perfil', () => {
  it('es de 8 h', () => {
    expect(TIEMPO_DIARIO_MAX).toBe(480);
    expect(limiteTiempoDiario(60)).toBe(480);
  });

  it('respeta un tiempo que ya subió por encima de 8 h', () => {
    expect(limiteTiempoDiario(540)).toBe(540);
  });
});
