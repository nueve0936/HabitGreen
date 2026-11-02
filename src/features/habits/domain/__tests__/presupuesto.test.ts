import { ajustePresupuesto, minutosPorDia } from '../presupuesto';

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
