import { avisoDeFormulario } from '../form-aviso';

const VACIO = ['vacío'];

describe('aviso único del formulario', () => {
  it('sin errores no hay aviso', () => {
    expect(avisoDeFormulario([undefined, undefined], VACIO, 'Llena los campos')).toBeNull();
  });

  it('si falta algún campo, avisa de los campos vacíos', () => {
    expect(avisoDeFormulario(['correo inválido', 'vacío'], VACIO, 'Llena los campos')).toBe(
      'Llena los campos',
    );
  });

  it('si no falta nada, muestra el primer error en orden', () => {
    expect(
      avisoDeFormulario([undefined, 'muy corta', 'no coinciden'], VACIO, 'Llena los campos'),
    ).toBe('muy corta');
  });
});
