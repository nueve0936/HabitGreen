import { crearCandado } from '../candado';

describe('un solo toque por acción', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('un toque doble rápido corre la acción una sola vez', () => {
    const candado = crearCandado(600);
    const accion = jest.fn();
    candado.ejecutar(accion);
    candado.ejecutar(accion);
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('se libera después de la espera', () => {
    const candado = crearCandado(600);
    const accion = jest.fn();
    candado.ejecutar(accion);
    jest.advanceTimersByTime(600);
    candado.ejecutar(accion);
    expect(accion).toHaveBeenCalledTimes(2);
  });

  it('con una acción asíncrona espera a que termine', async () => {
    const candado = crearCandado(600);
    let terminar: () => void = () => {};
    const accion = jest.fn(() => new Promise<void>((resolve) => (terminar = resolve)));
    candado.ejecutar(accion);
    jest.advanceTimersByTime(5000);
    candado.ejecutar(accion);
    expect(accion).toHaveBeenCalledTimes(1);
    terminar();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(600);
    candado.ejecutar(accion);
    expect(accion).toHaveBeenCalledTimes(2);
  });

  it('si la acción falla, se libera igual', () => {
    const candado = crearCandado(600);
    expect(() =>
      candado.ejecutar(() => {
        throw new Error('falla');
      }),
    ).toThrow('falla');
    jest.advanceTimersByTime(600);
    const accion = jest.fn();
    candado.ejecutar(accion);
    expect(accion).toHaveBeenCalledTimes(1);
  });
});
