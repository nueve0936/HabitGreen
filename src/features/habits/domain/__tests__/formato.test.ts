import { es } from '@/i18n/es';

import { textoHabito } from '../formato';

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
});
