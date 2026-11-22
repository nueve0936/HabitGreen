// Un solo toque por acción: si alguien toca dos veces muy rápido un botón, la acción no se manda
// dos veces (abrir la misma pantalla doble, agregar o terminar dos veces). Mientras la acción está
// en curso se ignoran los toques repetidos: si es asíncrona, hasta que termine; si no, durante
// `esperaMs` (lo que tarda en abrirse una pantalla).

export const ESPERA_TOQUE_MS = 600;

export type Candado = {
  /** Corre la acción si el candado está libre; si no, la ignora. */
  ejecutar: <R>(accion: () => R) => R | undefined;
};

export function crearCandado(esperaMs: number = ESPERA_TOQUE_MS): Candado {
  let ocupado = false;
  const liberar = () => {
    setTimeout(() => {
      ocupado = false;
    }, esperaMs);
  };
  return {
    ejecutar: (accion) => {
      if (ocupado) return undefined;
      ocupado = true;
      try {
        const resultado = accion();
        if (resultado instanceof Promise) resultado.finally(liberar).catch(() => {});
        else liberar();
        return resultado;
      } catch (error) {
        liberar();
        throw error;
      }
    },
  };
}
