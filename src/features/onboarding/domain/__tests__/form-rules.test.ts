import {
  alternarArea,
  alternarObjetivo,
  alternarSeleccion,
  BORRADOR_VACIO,
  leerPaso,
  pasoCompleto,
  respuestasCompletas,
  totalPasos,
  type Borrador,
} from '../form-rules';

describe('alternarSeleccion', () => {
  it('agrega y quita valores', () => {
    expect(alternarSeleccion(['a'], 'b', 2)).toEqual(['a', 'b']);
    expect(alternarSeleccion(['a', 'b'], 'a', 2)).toEqual(['b']);
  });

  it('con el máximo elegido, el nuevo reemplaza al primero que se eligió', () => {
    expect(alternarSeleccion(['a', 'b'], 'c', 2)).toEqual(['b', 'c']);
  });
});

describe('alternarArea', () => {
  it('al quitar un área descarta sus objetivos', () => {
    const borrador: Borrador = {
      areas: ['salud_fisica', 'social'],
      objetivos: ['mover_mas', 'tiempo_de_calidad'],
    };
    expect(alternarArea(borrador, 'salud_fisica')).toEqual({
      areas: ['social'],
      objetivos: ['tiempo_de_calidad'],
    });
  });

  it('un plan es de un área: elegir otra la reemplaza y descarta sus objetivos', () => {
    const borrador: Borrador = { areas: ['trabajo'], objetivos: ['aprender_algo'] };
    expect(alternarArea(borrador, 'finanzas')).toEqual({ areas: ['finanzas'], objetivos: [] });
  });

  it('el primer plan tiene 7 pasos y los siguientes, 3', () => {
    expect(totalPasos(false)).toBe(7);
    expect(totalPasos(true)).toBe(3);
  });
});

describe('alternarObjetivo', () => {
  it('un tercer objetivo reemplaza al primero elegido', () => {
    const borrador: Borrador = { areas: ['salud_fisica'], objetivos: ['mover_mas', 'tomar_agua'] };
    expect(alternarObjetivo(borrador, 'dormir_mejor')).toEqual(['tomar_agua', 'dormir_mejor']);
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
