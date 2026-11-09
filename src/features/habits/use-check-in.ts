import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import { completarHabito, deshacerHabito, RelojAtrasadoError } from '@/db/logs-repository';
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
  const [error, setError] = useState<string | null>(null);
  /** Aviso cuando un check-in no dio monedas: tope del día, o ya pagó hoy. */
  const [aviso, setAviso] = useState<string | null>(null);
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
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof RelojAtrasadoError ? es.hoy.errorReloj : es.hoy.errorGuardar);
    } finally {
      setOcupado(null);
    }
  };

  const completar = (habito: HabitoParaCheck) =>
    ejecutar(habito.id, async () => {
      const r = await completarHabito(userId, habito, fechaLocal());
      if (r === null) return;
      const textos = es.recompensas;
      const motivo =
        r.sinMonedas === 'ya_pagado'
          ? textos.yaPagado
          : r.sinMonedas === 'tope'
            ? textos.topeMonedas
            : null;
      setAviso(motivo);
      if (r.monedas > 0) {
        setPremio({ clave: Date.now(), monedas: r.monedas });
        AccessibilityInfo.announceForAccessibility(
          formatear(textos.hechoMonedas, { n: r.monedas }),
        );
      } else {
        // El motivo lo anuncia el propio aviso flotante.
        AccessibilityInfo.announceForAccessibility(textos.hecho);
      }
      if (r.cambioFase !== null && r.cambioFase > 1) {
        setCelebracion({ area: habito.categoria, fase: r.cambioFase });
      }
    });

  const deshacer = (habito: HabitoParaCheck) =>
    ejecutar(habito.id, async () => {
      setAviso(null);
      await deshacerHabito(userId, habito, fechaLocal());
      AccessibilityInfo.announceForAccessibility(es.recompensas.deshecho);
    });

  return {
    ocupado,
    error,
    aviso,
    premio,
    celebracion,
    cerrarCelebracion: () => setCelebracion(null),
    cerrarAvisos: () => {
      setError(null);
      setAviso(null);
    },
    alternar: (habito: HabitoParaCheck, hecho: boolean) =>
      hecho ? deshacer(habito) : completar(habito),
  };
}
