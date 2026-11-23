import { sugerir, type ContextoQuePaso } from '../que-paso';

const base: ContextoQuePaso = {
  masLigero: false,
  conDuracion: true,
  recordatorio: true,
  segundoAviso: false,
  segundoAvisoDisponible: true,
};
const con = (c: Partial<ContextoQuePaso>) => ({ ...base, ...c });

describe('sugerir', () => {
  it('tiempo o energía: más ligero si el plan lo permite', () => {
    expect(sugerir('tiempo', con({ masLigero: true }))).toEqual({ tipo: 'mas_ligero' });
    expect(sugerir('energia', con({ masLigero: true }))).toEqual({ tipo: 'mas_ligero' });
  });

  it('tiempo o energía sin paso más ligero: bajar la duración, o mover si no tiene minutos', () => {
    expect(sugerir('tiempo', base)).toEqual({ tipo: 'editar_duracion' });
    expect(sugerir('energia', con({ conDuracion: false }))).toEqual({ tipo: 'otro_dia' });
  });

  it('recursos: elegir otro día', () => {
    expect(sugerir('recursos', con({ masLigero: true }))).toEqual({ tipo: 'otro_dia' });
  });

  it('olvido: recordatorio, luego segundo aviso, luego solo ánimo', () => {
    expect(sugerir('olvido', con({ recordatorio: false }))).toEqual({ tipo: 'recordatorio' });
    expect(sugerir('olvido', base)).toEqual({ tipo: 'segundo_aviso' });
    expect(sugerir('olvido', con({ segundoAviso: true }))).toEqual({ tipo: 'animo' });
    expect(sugerir('olvido', con({ segundoAvisoDisponible: false }))).toEqual({ tipo: 'animo' });
  });
});
