import { areaDeObjetivo, OBJETIVOS, OBJETIVOS_POR_AREA, respuestasSchema } from '../onboarding';

const validas = {
  areas: ['salud_fisica', 'social'],
  objetivos: ['mover_mas', 'tiempo_de_calidad'],
  historial: 'empieza_y_deja',
  tiempo: '10_20',
  momento: 'noche',
  obstaculo: 'olvido',
  acompanamiento: 'recordatorio_suave',
};

describe('claves del formulario', () => {
  it('cada objetivo pertenece a un área y no hay objetivos sueltos', () => {
    const agrupados = Object.values(OBJETIVOS_POR_AREA).flat();
    expect([...agrupados].sort()).toEqual([...OBJETIVOS].sort());
    expect(areaDeObjetivo('tiempo_de_calidad')).toBe('social');
  });
});

describe('respuestasSchema', () => {
  it('acepta el ejemplo del SDD 4', () => {
    expect(respuestasSchema.safeParse(validas).success).toBe(true);
  });

  it('exige de 1 a 2 áreas y objetivos', () => {
    expect(respuestasSchema.safeParse({ ...validas, areas: [] }).success).toBe(false);
    expect(
      respuestasSchema.safeParse({
        ...validas,
        areas: ['salud_fisica', 'social', 'finanzas'],
      }).success,
    ).toBe(false);
    expect(
      respuestasSchema.safeParse({
        ...validas,
        objetivos: ['mover_mas', 'dormir_mejor', 'tiempo_de_calidad'],
      }).success,
    ).toBe(false);
  });

  it('rechaza objetivos de un área no elegida', () => {
    const resultado = respuestasSchema.safeParse({
      ...validas,
      objetivos: ['mover_mas', 'empezar_ahorrar'],
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.path).toEqual(['objetivos']);
  });

  it('rechaza repetidos y claves desconocidas', () => {
    expect(
      respuestasSchema.safeParse({ ...validas, objetivos: ['mover_mas', 'mover_mas'] }).success,
    ).toBe(false);
    expect(respuestasSchema.safeParse({ ...validas, tiempo: '5_min' }).success).toBe(false);
  });
});
