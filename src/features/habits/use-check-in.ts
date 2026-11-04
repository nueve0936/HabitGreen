import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { completarHabito, deshacerHabito } from '@/db/logs-repository';
import { es, formatear } from '@/i18n/es';
import { fechaLocal } from '@/lib/dates';
import type { Area } from '@/schemas/onboarding';

import { DURACION_COIN_BURST } from '../rewards/components/coin-burst';
import type { Celebracion } from '../rewards/components/phase-celebration';

// Marcar y deshacer un hábito de hoy (SDD 6.1), compartido por Hoy y Hábitos: guarda el check-in,
// lanza la moneda animada o el mensaje del tope del día, avisa al lector de pantalla y abre la
// celebración si la planta cambió de fase.

export type HabitoParaCheck = { id: string; category_id: string; categoria: Area };

export function useCheckIn(userId: string) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [topeMonedas, setTopeMonedas] = useState(false);
  const [premio, setPremio] = useState<{ clave: number; monedas: number } | null>(null);
  const [celebracion, setCelebracion] = useState<Celebracion | null>(null);

  // La moneda animada se quita sola al terminar.
  useEffect(() => {
    if (premio === null) return;
    const temporizador = setTimeout(() => setPremio(null), DURACION_COIN_BURST);
    return () => clearTimeout(temporizador);
  }, [premio]);

  const ejecutar = async (habitId: string, accion: () => Promise<void>) => {
    setOcupado(habitId);
    setError(false);
    try {
      await accion();
    } catch {
      setError(true);
    } finally {
      setOcupado(null);
    }
  };

  const completar = (habito: HabitoParaCheck) =>
    ejecutar(habito.id, async () => {
      const r = await completarHabito(userId, habito, fechaLocal());
      if (r === null) return;
      const textos = es.recompensas;
      setTopeMonedas(r.monedas === 0);
      if (r.monedas > 0) {
        setPremio({ clave: Date.now(), monedas: r.monedas });
        AccessibilityInfo.announceForAccessibility(
          formatear(textos.hechoMonedas, { n: r.monedas }),
        );
      } else {
        AccessibilityInfo.announceForAccessibility(`${textos.hecho} ${textos.topeMonedas}`);
      }
      if (r.cambioFase !== null && r.cambioFase > 1) {
        setCelebracion({ area: habito.categoria, fase: r.cambioFase });
      }
    });

  const deshacer = (habito: HabitoParaCheck) =>
    ejecutar(habito.id, async () => {
      setTopeMonedas(false);
      await deshacerHabito(userId, habito, fechaLocal());
      AccessibilityInfo.announceForAccessibility(es.recompensas.deshecho);
    });

  return {
    ocupado,
    error,
    topeMonedas,
    premio,
    celebracion,
    cerrarCelebracion: () => setCelebracion(null),
    alternar: (habito: HabitoParaCheck, hecho: boolean) =>
      hecho ? deshacer(habito) : completar(habito),
  };
}
