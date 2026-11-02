import { es } from '@/i18n/es';

import { textoDias, textoHorario } from '../plan-format';
import { BORRADOR, habito } from '../__fixtures__/plan';

const t = es.onboarding.revision;

describe('textos de la tarjeta del plan', () => {
  it('muestra duración, días y hora', () => {
    expect(textoHorario(habito({ dias_semana: [6, 1, 2, 4] }), BORRADOR.ventana_flexible, t)).toBe(
      '15 min · Lun, Mar, Jue, Sáb · 08:00',
    );
  });

  it('con aviso flexible muestra la ventana', () => {
    const flexible = habito({ hora: null, flexible: true });
    expect(textoHorario(flexible, BORRADOR.ventana_flexible, t)).toBe(
      '15 min · Lun, Mar, Mié, Jue, Vie · Entre 17:00 y 20:00',
    );
  });

  it('los 7 días se leen como «Todos los días»', () => {
    expect(textoDias([1, 2, 3, 4, 5, 6, 7], t)).toBe('Todos los días');
  });
});
