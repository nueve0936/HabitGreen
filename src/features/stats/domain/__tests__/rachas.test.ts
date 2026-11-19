import { lineaDeRacha, pildoraDeRacha, rachaDeHabito } from '../rachas';

const serie = (texto: string) => [...texto].map((c) => ({ hecho: c === '1' }));

describe('rachas por hábito', () => {
  it('la actual cuenta las hechas seguidas al final; la mejor, la serie más larga', () => {
    expect(rachaDeHabito(serie('1110011'))).toEqual({ actual: 2, mejor: 3 });
    expect(rachaDeHabito(serie('1111'))).toEqual({ actual: 4, mejor: 4 });
    expect(rachaDeHabito(serie('110'))).toEqual({ actual: 0, mejor: 2 });
    expect(rachaDeHabito([])).toEqual({ actual: 0, mejor: 0 });
  });

  it('qué se dice: en curso, rota con invitación, o nada', () => {
    expect(lineaDeRacha({ actual: 3, mejor: 3 }, false)).toEqual([{ texto: 'rachaActual', n: 3 }]);
    expect(lineaDeRacha({ actual: 2, mejor: 5 }, false)).toEqual([
      { texto: 'rachaActual', n: 2 },
      { texto: 'mejorRacha', n: 5 },
    ]);
    expect(lineaDeRacha({ actual: 0, mejor: 5 }, false)).toEqual([{ texto: 'rachaRota', n: 5 }]);
    expect(lineaDeRacha({ actual: 0, mejor: 0 }, false)).toEqual([]);
  });

  it('con desánimo solo se muestra la mejor racha', () => {
    expect(lineaDeRacha({ actual: 2, mejor: 5 }, true)).toEqual([{ texto: 'mejorRacha', n: 5 }]);
    expect(lineaDeRacha({ actual: 0, mejor: 4 }, true)).toEqual([{ texto: 'mejorRacha', n: 4 }]);
    expect(lineaDeRacha({ actual: 0, mejor: 0 }, true)).toEqual([]);
  });
});

describe('píldora de racha', () => {
  it('en curso, rota («Mejor») o ninguna; con desánimo, la mejor', () => {
    expect(pildoraDeRacha({ actual: 3, mejor: 5 }, false)).toEqual({ tipo: 'actual', n: 3 });
    expect(pildoraDeRacha({ actual: 0, mejor: 5 }, false)).toEqual({ tipo: 'mejor', n: 5 });
    expect(pildoraDeRacha({ actual: 3, mejor: 5 }, true)).toEqual({ tipo: 'mejor', n: 5 });
    expect(pildoraDeRacha({ actual: 0, mejor: 0 }, false)).toBeNull();
  });
});
