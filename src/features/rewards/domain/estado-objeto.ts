// Qué puede hacer el usuario con un objeto de la Tienda (SDD 6.4 y 9.4).

export type EstadoObjeto =
  { tipo: 'tuyo' } | { tipo: 'comprable'; quedan: number } | { tipo: 'faltan'; faltan: number };

export function estadoObjeto(precio: number, saldo: number, esPropio: boolean): EstadoObjeto {
  if (esPropio) return { tipo: 'tuyo' };
  return saldo >= precio
    ? { tipo: 'comprable', quedan: saldo - precio }
    : { tipo: 'faltan', faltan: precio - saldo };
}
