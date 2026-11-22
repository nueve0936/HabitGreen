import { pilaParaRetomar } from '../retomar';

describe('retomar el formulario', () => {
  it('en el paso 3: Empezar, modo y los pasos 1 a 3', () => {
    expect(pilaParaRetomar({ pantalla: 'formulario', paso: 3 }).map((r) => r.name)).toEqual([
      'empezar',
      'modo',
      'formulario/[paso]',
      'formulario/[paso]',
      'formulario/[paso]',
    ]);
    const ultimo = pilaParaRetomar({ pantalla: 'formulario', paso: 3 }).at(-1);
    expect(ultimo).toEqual({ name: 'formulario/[paso]', params: { paso: '3' } });
  });

  it('en la revisión del plan: los 7 pasos y la revisión al final', () => {
    const pila = pilaParaRetomar({ pantalla: 'revision' });
    expect(pila).toHaveLength(10);
    expect(pila[8]).toEqual({ name: 'formulario/[paso]', params: { paso: '7' } });
    expect(pila[9]).toEqual({ name: 'revision' });
  });
});
