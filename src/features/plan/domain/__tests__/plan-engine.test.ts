import type { Respuestas } from '@/schemas/onboarding';

import {
  alternativasDeNivel,
  aplicarTextosIa,
  elegirFilaCatalogo,
  generarPlan,
  mensajeParaIa,
  type ConfigPlan,
  type FilaCatalogo,
} from '../plan-engine';

// Filas copiadas del catálogo semilla (SDD 5.7) que cubren los casos del motor.
type Fila = [
  FilaCatalogo['objetivo'],
  FilaCatalogo['nivel'],
  FilaCatalogo['variante'],
  string,
  number,
  number,
  number[],
  FilaCatalogo['momento_fijo'],
  boolean,
];
const FILAS: Fila[] = [
  ['mover_mas', 1, 'base', 'Caminar 5 min', 5, 2, [1, 2, 4, 6], null, true],
  ['mover_mas', 2, 'base', 'Caminar 15 min', 15, 5, [1, 2, 3, 4, 5], null, true],
  ['mover_mas', 3, 'base', 'Caminar o moverme 30 min', 30, 10, [1, 2, 3, 4, 5], null, true],
  [
    'dormir_mejor',
    1,
    'base',
    'Dejar el celular lejos de la cama',
    2,
    1,
    [1, 2, 4, 6],
    'noche',
    true,
  ],
  [
    'dormir_mejor',
    2,
    'base',
    'Rutina de 10 min antes de dormir',
    10,
    5,
    [1, 2, 3, 4, 5],
    'noche',
    true,
  ],
  ['comer_mejor', 3, 'base', 'Preparar una comida casera', 30, 15, [1, 3, 5], null, false],
  [
    'comer_mejor',
    3,
    'sin_recursos',
    'Elegir una opción con verdura',
    10,
    5,
    [1, 2, 3, 4, 5],
    null,
    true,
  ],
  [
    'tiempo_de_calidad',
    1,
    'base',
    '5 min de atención plena con alguien',
    5,
    2,
    [1, 3, 5],
    null,
    true,
  ],
  [
    'tiempo_de_calidad',
    2,
    'base',
    '15 min de calidad con alguien',
    15,
    5,
    [1, 2, 4, 6],
    null,
    true,
  ],
];
const CATALOGO: FilaCatalogo[] = FILAS.map(
  ([objetivo, nivel, variante, titulo, min, red, dias, momento, sinRecursos]) => ({
    objetivo,
    categoria: objetivo === 'tiempo_de_calidad' ? 'social' : 'salud_fisica',
    nivel,
    variante,
    titulo,
    descripcion: null,
    duracion_min: min,
    duracion_reducida_min: red,
    dias_semana: dias,
    momento_fijo: momento,
    sin_recursos: sinRecursos,
  }),
);

const CONFIG: ConfigPlan = {
  presupuestos: { menos_10: 10, '10_20': 20, '20_40': 40, mas_40: 60 },
  horas: { manana: '08:00', mediodia: '13:00', tarde: '17:00', noche: '20:30' },
};

const BASE: Respuestas = {
  areas: ['salud_fisica', 'social'],
  objetivos: ['mover_mas', 'tiempo_de_calidad'],
  historial: 'primera_vez',
  tiempo: '10_20',
  momento: 'manana',
  obstaculo: 'motivacion',
  acompanamiento: 'recordatorio_suave',
};

function plan(cambios: Partial<Respuestas>) {
  return generarPlan({ ...BASE, ...cambios }, CATALOGO, CONFIG);
}

describe('generarPlan', () => {
  it('crea un hábito por objetivo, con su categoría, días y hora del momento elegido', () => {
    const { habitos, ajustes } = plan({});
    expect(habitos).toHaveLength(2);
    expect(habitos[0]).toMatchObject({
      objetivo: 'mover_mas',
      categoria: 'salud_fisica',
      nivel: 1,
      titulo: 'Caminar 5 min',
      duracion_min: 5,
      dias_semana: [1, 2, 4, 6],
      hora: '08:00',
      flexible: false,
      notificar: true,
    });
    expect(habitos[1]).toMatchObject({ objetivo: 'tiempo_de_calidad', categoria: 'social' });
    expect(ajustes).toEqual({
      presupuesto_min: 20,
      estilo_notificaciones: 'recordatorio_suave',
      estrategias: ['motivacion'],
      segundo_aviso: false,
    });
  });

  it('«mantiene» empieza en nivel 2 si cabe en el presupuesto', () => {
    // 40 min / 2 hábitos = 20 min por hábito; el nivel 2 dura 15.
    const { habitos } = plan({ historial: 'mantiene', tiempo: '20_40' });
    expect(habitos.map((h) => h.nivel)).toEqual([2, 2]);
    expect(habitos[0]?.duracion_min).toBe(15);
  });

  it('un hábito sin duración no gasta del tiempo diario', () => {
    // 20 min entre 2 hábitos serían 10 por hábito (el nivel 2 de caminar, 15 min, no cabría). Si
    // tiempo de calidad no tiene duración, caminar puede usar los 20.
    const sinDuracion = CATALOGO.map((fila) =>
      fila.objetivo === 'tiempo_de_calidad'
        ? { ...fila, duracion_min: 0, duracion_reducida_min: 0 }
        : fila,
    );
    const { habitos } = generarPlan(
      { ...BASE, historial: 'mantiene', tiempo: '10_20' },
      sinDuracion,
      CONFIG,
    );
    expect(habitos.map((h) => [h.objetivo, h.nivel, h.duracion_min])).toEqual([
      ['mover_mas', 2, 15],
      ['tiempo_de_calidad', 2, 0],
    ]);
  });

  it('baja de nivel cuando la duración no cabe', () => {
    // 10 min / 2 hábitos = 5 min por hábito; el nivel 2 (15 min) no cabe.
    const { habitos } = plan({ historial: 'mantiene', tiempo: 'menos_10' });
    expect(habitos.map((h) => h.nivel)).toEqual([1, 1]);
    expect(habitos.reduce((total, h) => total + h.duracion_min, 0)).toBeLessThanOrEqual(10);
  });

  it('con un solo objetivo usa todo el presupuesto como máximo', () => {
    const { habitos } = plan({
      areas: ['salud_fisica'],
      objetivos: ['mover_mas'],
      historial: 'mantiene',
      tiempo: '10_20',
    });
    expect(habitos).toHaveLength(1);
    expect(habitos[0]?.nivel).toBe(2);
  });

  it('«poco_tiempo» usa la duración reducida', () => {
    const { habitos } = plan({ obstaculo: 'poco_tiempo' });
    expect(habitos[0]).toMatchObject({ duracion_min: 2, usa_duracion_reducida: true });
  });

  it('el momento fijo del catálogo gana sobre la P5', () => {
    const { habitos } = plan({ objetivos: ['dormir_mejor', 'tiempo_de_calidad'] });
    expect(habitos[0]).toMatchObject({ hora: '20:30', flexible: false });
    expect(habitos[1]?.hora).toBe('08:00');
  });

  it('«varia» deja el aviso flexible, salvo con momento fijo', () => {
    const { habitos } = plan({
      momento: 'varia',
      objetivos: ['dormir_mejor', 'tiempo_de_calidad'],
    });
    expect(habitos[0]).toMatchObject({ hora: '20:30', flexible: false });
    expect(habitos[1]).toMatchObject({ hora: null, flexible: true });
  });

  it('con el estilo «minimo» los hábitos no avisan por defecto', () => {
    const { habitos } = plan({ acompanamiento: 'minimo' });
    expect(habitos.every((h) => !h.notificar)).toBe(true);
  });

  it('falla con un mensaje claro si el catálogo no tiene la fila', () => {
    expect(() => plan({ areas: ['finanzas'], objetivos: ['empezar_ahorrar'] })).toThrow(
      'Falta en el catálogo: empezar_ahorrar nivel 1',
    );
  });
});

describe('segundo aviso (precedencia P7/P6, SDD 5.6)', () => {
  it.each([
    ['recordatorio_suave', 'manana', true],
    ['recordatorio_y_animo', 'noche', true],
    ['minimo', 'manana', false],
    ['resumen_nocturno', 'manana', false],
    ['recordatorio_suave', 'varia', false],
  ] as const)('olvido + %s + %s → %s', (acompanamiento, momento, esperado) => {
    expect(plan({ obstaculo: 'olvido', acompanamiento, momento }).ajustes.segundo_aviso).toBe(
      esperado,
    );
  });

  it('sin «olvido» no hay segundo aviso', () => {
    expect(plan({ obstaculo: 'distraccion' }).ajustes.segundo_aviso).toBe(false);
  });
});

describe('elegirFilaCatalogo', () => {
  it('con «recursos» usa la variante sin recursos si la base necesita equipo', () => {
    expect(elegirFilaCatalogo(CATALOGO, 'comer_mejor', 3, true).variante).toBe('sin_recursos');
    expect(elegirFilaCatalogo(CATALOGO, 'comer_mejor', 3, false).variante).toBe('base');
  });

  it('si la base ya es sin recursos, la usa', () => {
    expect(elegirFilaCatalogo(CATALOGO, 'mover_mas', 1, true).variante).toBe('base');
  });
});

describe('alternativasDeNivel', () => {
  it('trae los niveles más bajos de cada hábito para «Bajar nivel»', () => {
    const r = { ...BASE, historial: 'mantiene' as const, tiempo: '20_40' as const };
    const { habitos } = generarPlan(r, CATALOGO, CONFIG);
    const alternativas = alternativasDeNivel(r, CATALOGO, CONFIG, habitos);
    expect(alternativas.mover_mas?.map((h) => [h.nivel, h.titulo])).toEqual([[1, 'Caminar 5 min']]);
    expect(alternativas.mover_mas?.[0]?.hora).toBe('08:00');
  });

  it('un hábito de nivel 1 no tiene alternativas', () => {
    const { habitos } = plan({});
    expect(alternativasDeNivel(BASE, CATALOGO, CONFIG, habitos).mover_mas).toEqual([]);
  });
});

describe('textos de la IA', () => {
  it('el mensaje solo lleva claves y números, sin datos personales', () => {
    const { habitos } = plan({});
    expect(JSON.parse(mensajeParaIa(BASE, habitos))).toEqual({
      historial: 'primera_vez',
      obstaculo: 'motivacion',
      habitos: [
        {
          objetivo: 'mover_mas',
          nivel: 1,
          titulo_base: 'Caminar 5 min',
          duracion_min: 5,
          dias_semana: [1, 2, 4, 6],
        },
        {
          objetivo: 'tiempo_de_calidad',
          nivel: 1,
          titulo_base: '5 min de atención plena con alguien',
          duracion_min: 5,
          dias_semana: [1, 3, 5],
        },
      ],
    });
  });

  it('cambia solo títulos y descripciones; los números siguen siendo del motor', () => {
    const { habitos } = plan({});
    const conTextos = aplicarTextosIa(habitos, {
      resumen: 'Empezamos ligero.',
      habitos: [
        { objetivo: 'mover_mas', titulo: 'Caminar 5 min al salir', descripcion: 'Sin prisa.' },
        { objetivo: 'tiempo_de_calidad', titulo: 'Charlar 5 min', descripcion: 'Con calma.' },
      ],
    });
    expect(conTextos[0]).toEqual({
      ...habitos[0],
      titulo: 'Caminar 5 min al salir',
      descripcion: 'Sin prisa.',
    });
    expect(conTextos[1]?.duracion_min).toBe(habitos[1]?.duracion_min);
  });
});
