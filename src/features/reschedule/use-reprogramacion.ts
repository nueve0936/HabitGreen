import { useEffect, useRef, useState } from 'react';

import {
  descartarOcurrencia,
  leerReprogramacion,
  moverOcurrencia,
  reprogramarEnSilencio,
} from '@/db/occurrences-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { es, formatear } from '@/i18n/es';
import { fechaLocal } from '@/lib/dates';

import type { Propuesta } from './domain/reprogramar';
import { destinoDia } from './domain/texto-dia';

// Reprogramación en Hoy (SDD 6.2). Al abrir la app se leen las propuestas y se muestran una por
// una en la tarjeta. Con `desanimo` no hay tarjeta: se mueven solas una vez y se avisa con suavidad.

const clave = (p: Propuesta) => `${p.habito.id}|${p.fechaOriginal}`;

export function useReprogramacion(userId: string) {
  const t = es.reprogramar;
  const hoy = fechaLocal();
  const consulta = useLocalQuery(`reprogramar-${userId}-${hoy}`, () => leerReprogramacion(userId));
  // Las ya resueltas se ocultan al momento, sin esperar a que se vuelva a leer SQLite.
  const [resueltas, setResueltas] = useState<ReadonlySet<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const [eligiendo, setEligiendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const silencioIniciado = useRef(false);

  const silenciosa = consulta.data?.silenciosa ?? false;
  const todas = consulta.data?.propuestas;
  const pendientes = (todas ?? []).filter((p) => !resueltas.has(clave(p)));
  const actual = silenciosa ? null : (pendientes[0] ?? null);

  // Con `desanimo`: todas se mueven (o se descartan si no hay día) en una sola escritura.
  useEffect(() => {
    if (!silenciosa || !todas || todas.length === 0 || silencioIniciado.current) return;
    silencioIniciado.current = true;
    reprogramarEnSilencio(userId, todas)
      .then((movidas) => {
        const [unica] = movidas;
        if (movidas.length === 1 && unica.diaPropuesto !== null) {
          setAviso(
            formatear(t.silencioUno, {
              habito: unica.habito.titulo,
              destino: destinoDia(unica.diaPropuesto, hoy),
            }),
          );
        } else if (movidas.length > 1) {
          setAviso(formatear(t.silencioVarios, { n: movidas.length }));
        }
      })
      .catch((causa: unknown) => {
        console.warn('No se pudo reprogramar en silencio', causa);
        silencioIniciado.current = false;
      });
  }, [silenciosa, todas, userId, hoy, t]);

  const resolver = async (propuesta: Propuesta, accion: () => Promise<unknown>) => {
    setOcupado(true);
    setError(null);
    try {
      await accion();
      setResueltas((previas) => new Set(previas).add(clave(propuesta)));
    } catch (causa) {
      console.warn('No se pudo guardar la reprogramación', causa);
      setError(t.error);
    } finally {
      setOcupado(false);
    }
  };

  const mover = (fecha: string) => {
    if (actual) void resolver(actual, () => moverOcurrencia(userId, actual, fecha));
  };

  return {
    hoy,
    actual,
    indice: resueltas.size + 1,
    total: resueltas.size + pendientes.length,
    ocupado,
    eligiendo,
    aviso,
    error,
    aceptar: () => {
      if (actual?.diaPropuesto) mover(actual.diaPropuesto);
    },
    elegirDia: mover,
    dejar: () => {
      if (actual) void resolver(actual, () => descartarOcurrencia(userId, actual));
    },
    abrirDias: () => setEligiendo(true),
    cerrarDias: () => setEligiendo(false),
    cerrarAvisos: () => {
      setAviso(null);
      setError(null);
    },
  };
}
