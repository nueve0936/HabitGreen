import { es } from '@/i18n/es';

import { textoDuracion, textoHabito } from '../formato';

const t = es.habitos.tarjeta;

describe('texto de la tarjeta de un hábito', () => {
  it('muestra días, hora corta y duración', () => {
    expect(textoHabito({ dias_semana: [3, 1], hora: '08:00:00', duracion_min: 5 }, t)).toBe(
      'Lun, Mié · 08:00 · 5 min',
    );
  });

  it('los 7 días y el aviso flexible', () => {
    expect(
      textoHabito({ dias_semana: [1, 2, 3, 4, 5, 6, 7], hora: null, duracion_min: 10 }, t),
    ).toBe('Todos los días · Hora flexible · 10 min');
  });

  it('sin duración definida, no la muestra', () => {
    expect(textoHabito({ dias_semana: [1], hora: '07:30', duracion_min: 0 }, t)).toBe(
      'Lun · 07:30',
    );
  });
});

describe('texto de la duración', () => {
  it('minutos, horas y horas con minutos', () => {
    expect(textoDuracion(25)).toBe('25 min');
    expect(textoDuracion(60)).toBe('1 h');
    expect(textoDuracion(85)).toBe('1 h 25 min');
    expect(textoDuracion(1439)).toBe('23 h 59 min');
  });

  it('0 es «Sin duración fija»', () => {
    expect(textoDuracion(0)).toBe('Sin duración fija');
  });
});
