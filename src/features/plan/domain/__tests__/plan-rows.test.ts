import { VERSION_FORMULARIO } from '@/schemas/onboarding';

import { ajustesTradicionales, fechaLocal, filasDelPlan, type IdsPlan } from '../plan-rows';
import { BORRADOR, habito, RESPUESTAS } from '../__fixtures__/plan';

const IDS: IdsPlan = {
  planId: 'plan-1',
  planesExtra: { social: 'plan-2' },
  habitos: {
    mover_mas: { habitId: 'habito-1', scheduleId: 'horario-1' },
    tiempo_de_calidad: { habitId: 'habito-2', scheduleId: 'horario-2' },
  },
};

const CATEGORIAS = {
  salud_fisica: 'cat-fisica',
  trabajo: 'cat-trabajo',
  salud_mental: 'cat-mental',
  finanzas: 'cat-finanzas',
  social: 'cat-social',
};

function filas(borrador = BORRADOR) {
  return filasDelPlan({
    userId: 'usuario-1',
    borrador,
    respuestas: RESPUESTAS,
    ids: IDS,
    categorias: CATEGORIAS,
    hoy: '2026-11-01',
  });
}

describe('filas que se guardan al pulsar «Empezar»', () => {
  it('liga plan, hábitos y horarios con los ids del cliente', () => {
    const f = filas();
    expect(f.plans[0]).toMatchObject({ id: 'plan-1', user_id: 'usuario-1', origen: 'ia' });
    expect(f.habits[1]).toMatchObject({
      id: 'habito-2',
      plan_id: 'plan-2',
      category_id: 'cat-social',
      objetivo: 'tiempo_de_calidad',
      nivel: 1,
    });
    expect(f.schedules[0]).toEqual({
      id: 'horario-1',
      habit_id: 'habito-1',
      user_id: 'usuario-1',
      dias_semana: [1, 2, 3, 4, 5],
      hora: '08:00',
      flexible: false,
      notificar: true,
      vigente_desde: '2026-11-01',
    });
  });

  it('guarda un plan por área, con sus objetivos y el historial', () => {
    const { plans } = filas();
    expect(plans.map((p) => [p.id, p.area])).toEqual([
      ['plan-1', 'salud_fisica'],
      ['plan-2', 'social'],
    ]);
    expect(plans[1]?.respuestas).toEqual({
      areas: ['social'],
      objetivos: ['tiempo_de_calidad'],
      historial: RESPUESTAS.historial,
    });
  });

  it('un horario flexible se guarda sin hora', () => {
    const flexible = { ...BORRADOR, habitos: [habito({ hora: null, flexible: true })] };
    expect(filas(flexible).schedules[0]).toMatchObject({ hora: null, flexible: true });
  });

  it('sin permiso de avisos, los hábitos se guardan sin recordatorio', () => {
    const conFlexible = {
      ...BORRADOR,
      habitos: [BORRADOR.habitos[0]!, habito({ hora: null, flexible: true })],
    };
    const sinPermiso = filasDelPlan({
      userId: 'usuario-1',
      borrador: conFlexible,
      respuestas: RESPUESTAS,
      ids: IDS,
      categorias: CATEGORIAS,
      hoy: '2026-11-01',
      conRecordatorios: false,
    });
    for (const horario of sinPermiso.schedules) {
      expect(horario).toMatchObject({ hora: null, flexible: false, notificar: false });
    }
  });

  it('guarda los ajustes y las respuestas con la versión del formulario', () => {
    const f = filas();
    expect(f.settings).toEqual({
      user_id: 'usuario-1',
      presupuesto_min: 40,
      estilo_notificaciones: 'recordatorio_suave',
      estrategias: ['olvido'],
      segundo_aviso: true,
    });
    expect(f.answers).toEqual({
      user_id: 'usuario-1',
      respuestas: RESPUESTAS,
      version_formulario: VERSION_FORMULARIO,
    });
  });

  it('un hábito quitado en la revisión no se guarda', () => {
    const uno = { ...BORRADOR, habitos: [BORRADOR.habitos[1]!] };
    expect(filas(uno).habits.map((h) => h.id)).toEqual(['habito-2']);
  });
});

it('fechaLocal usa la fecha del teléfono', () => {
  expect(fechaLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
});

it('modo tradicional: ajustes por defecto (SDD 6.5)', () => {
  expect(ajustesTradicionales('usuario-1', 20)).toEqual({
    user_id: 'usuario-1',
    presupuesto_min: 20,
    estilo_notificaciones: 'recordatorio_suave',
    estrategias: [],
    segundo_aviso: false,
  });
});
