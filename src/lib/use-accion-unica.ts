import { useRef } from 'react';

import { crearCandado } from './candado';

/**
 * Envuelve un `onPress` para que un toque doble rápido no lo mande dos veces (ver `candado`). Si
 * no hay acción, devuelve undefined para no volver tocable lo que no lo era.
 */
export function useAccionUnica<A extends unknown[]>(
  accion: (...args: A) => unknown,
): (...args: A) => void;
export function useAccionUnica<A extends unknown[]>(
  accion: ((...args: A) => unknown) | null | undefined,
): ((...args: A) => void) | undefined;
export function useAccionUnica<A extends unknown[]>(
  accion: ((...args: A) => unknown) | null | undefined,
): ((...args: A) => void) | undefined {
  const candado = useRef(crearCandado());
  if (!accion) return undefined;
  return (...args: A) => {
    candado.current.ejecutar(() => accion(...args));
  };
}
