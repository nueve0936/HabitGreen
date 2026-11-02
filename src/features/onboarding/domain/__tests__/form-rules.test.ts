import {
  alternarArea,
  alternarObjetivo,
  alternarSeleccion,
  BORRADOR_VACIO,
  leerPaso,
  pasoCompleto,
  respuestasCompletas,
  type Borrador,
} from '../form-rules';

describe('alternarSeleccion', () => {
  it('agrega y quita valores', () => {
    expect(alternarSeleccion(['a'], 'b', 2)).toEqual({ lista: ['a', 'b'], limiteAlcanzado: false });
    expect(alternarSeleccion(['a', 'b'], 'a', 2)).toEqual({ lista: ['b'], limiteAlcanzado: false });
  });

  it('no agrega un tercero y avisa del límite', () => {
    expect(alternarSeleccion(['a', 'b'], 'c', 2)).toEqual({
      lista: ['a', 'b'],
      limiteAlcanzado: true,
    });
  });
});

describe('alternarArea', () => {
  it('al quitar un área descarta sus objetivos', () => {
    const borrador: Borrador = {
      areas: ['salud_fisica', 'social'],
      objetivos: ['mover_mas', 'tiempo_de_calidad'],
    };
    const resultado = alternarArea(borrador, 'salud_fisica');
    expect(resultado.lista).toEqual(['social']);
    expect(resultado.objetivos).toEqual(['tiempo_de_calidad']);
  });

  it('con 2 áreas, una tercera no cambia nada', () => {
    const borrador: Borrador = { areas: ['trabajo', 'social'], objetivos: ['aprender_algo'] };
    const resultado = alternarArea(borrador, 'finanzas');
    expect(resultado).toEqual({
      lista: ['trabajo', 'social'],
      objetivos: ['aprender_algo'],
      limiteAlcanzado: true,
    });
  });
});

describe('alternarObjetivo', () => {
  it('limita a 2 objetivos', () => {
    const borrador: Borrador = { areas: ['salud_fisica'], objetivos: ['mover_mas', 'tomar_agua'] };
    expect(alternarObjetivo(borrador, 'dormir_mejor').limiteAlcanzado).toBe(true);
  });
});

describe('pasoCompleto y respuestasCompletas', () => {
  const completo: Borrador = {
    areas: ['finanzas'],
    objetivos: ['empezar_ahorrar'],
    historial: 'primera_vez',
    tiempo: 'menos_10',
    momento: 'varia',
    obstaculo: 'recursos',
    acompanamiento: 'minimo',
  };

  it('cada paso pide su respuesta', () => {
    expect(pasoCompleto(1, BORRADOR_VACIO)).toBe(false);
    expect(pasoCompleto(1, completo)).toBe(true);
    expect(pasoCompleto(7, { ...completo, acompanamiento: undefined })).toBe(false);
  });

  it('devuelve las respuestas solo si todo está completo', () => {
    expect(respuestasCompletas(completo)).toEqual(completo);
    expect(respuestasCompletas({ ...completo, tiempo: undefined })).toBeNull();
  });
});

describe('leerPaso', () => {
  it('acepta 1 a 7 y regresa al 1 con valores raros', () => {
    expect(leerPaso('4')).toBe(4);
    expect(leerPaso(['7'])).toBe(7);
    expect(leerPaso('9')).toBe(1);
    expect(leerPaso('abc')).toBe(1);
    expect(leerPaso(undefined)).toBe(1);
  });
});
