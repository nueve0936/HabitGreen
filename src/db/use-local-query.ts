import { useEffect, useEffectEvent, useState } from 'react';

import { useDbVersion } from './db-version-store';

// Lee datos de SQLite y vuelve a leerlos cuando cambian (useDbVersion) o cuando cambia `clave`
// (por ejemplo, el id del hábito o la fecha). Devuelve los tres estados que pide la definición
// de terminado: cargando, error y datos.

export type LocalQuery<T> = {
  data: T | undefined;
  error: unknown;
  cargando: boolean;
};

export function useLocalQuery<T>(clave: string, consulta: () => Promise<T>): LocalQuery<T> {
  const version = useDbVersion((s) => s.version);
  // useEffectEvent: el efecto siempre llama a la consulta más reciente sin depender de ella.
  const consultar = useEffectEvent(consulta);
  const [estado, setEstado] = useState<LocalQuery<T>>({
    data: undefined,
    error: null,
    cargando: true,
  });

  useEffect(() => {
    let activa = true;
    consultar()
      .then((data) => {
        if (activa) setEstado({ data, error: null, cargando: false });
      })
      .catch((error: unknown) => {
        if (activa) setEstado((s) => ({ data: s.data, error, cargando: false }));
      });
    return () => {
      activa = false;
    };
  }, [clave, version]);

  return estado;
}
