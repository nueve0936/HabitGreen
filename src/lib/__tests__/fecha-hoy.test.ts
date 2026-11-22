import { avisarCambioLocal } from '@/db/db-version-store';

import { msHastaMedianoche, useFechaHoy } from '../fecha-hoy';

jest.mock('@/db/db-version-store', () => ({ avisarCambioLocal: jest.fn() }));

describe('cambio de día con la app abierta', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(avisarCambioLocal).mockClear();
  });

  it('calcula lo que falta para la medianoche local', () => {
    expect(msHastaMedianoche(new Date(2026, 10, 19, 23, 59, 0))).toBe(60_000);
    expect(msHastaMedianoche(new Date(2026, 10, 19, 0, 0, 0))).toBe(86_400_000);
  });

  it('sin cambio de día no avisa; al cambiar, avisa una sola vez', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 19, 23, 59));
    useFechaHoy.setState({ fecha: '2026-11-19' });
    expect(useFechaHoy.getState().revisar()).toBe(false);
    expect(avisarCambioLocal).not.toHaveBeenCalled();

    jest.setSystemTime(new Date(2026, 10, 20, 0, 5));
    expect(useFechaHoy.getState().revisar()).toBe(true);
    expect(useFechaHoy.getState().fecha).toBe('2026-11-20');
    expect(avisarCambioLocal).toHaveBeenCalledTimes(1);
    expect(useFechaHoy.getState().revisar()).toBe(false);
  });
});
