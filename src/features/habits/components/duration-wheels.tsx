import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { WheelColumn } from '@/components/ui/wheel-column';
import { es } from '@/i18n/es';

import { textoDuracion } from '../domain/formato';

// Ruedas de Horas y Minutos con el total debajo. Las comparten «¿Cuánto dura?» (duración del
// hábito) y el tiempo diario de Perfil. Tocar el número del centro permite escribirlo.

const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i));

export type DurationWheelsProps = {
  horas: number;
  minutos: number;
  onCambiarHoras: (horas: number) => void;
  onCambiarMinutos: (minutos: number) => void;
  /** Última hora de la rueda (0 a `horasMax`). */
  horasMax?: number;
  /** Texto en lugar del total cuando es 0. */
  vacio: string;
  /** Dato junto al total (por ejemplo, cuánto suma el día con más hábitos). */
  detalle?: ReactNode;
};

export function DurationWheels({
  horas,
  minutos,
  onCambiarHoras,
  onCambiarMinutos,
  horasMax = 23,
  vacio,
  detalle,
}: DurationWheelsProps) {
  const t = es.habitForm.dialogoDuracion;
  const opcionesHoras = Array.from({ length: horasMax + 1 }, (_, i) => String(i));
  const total = horas * 60 + minutos;

  return (
    <>
      <View className="gap-1">
        <View className="flex-row gap-2">
          <AppText variant="small" tone="ink-soft" className="flex-1 text-center">
            {t.horas}
          </AppText>
          <AppText variant="small" tone="ink-soft" className="flex-1 text-center">
            {t.minutos}
          </AppText>
        </View>
        <View className="flex-row gap-2">
          <WheelColumn
            etiqueta={t.horas}
            opciones={opcionesHoras}
            indice={horas}
            onCambiar={onCambiarHoras}
            escribible
          />
          <WheelColumn
            etiqueta={t.minutos}
            opciones={MINUTOS}
            indice={minutos}
            onCambiar={onCambiarMinutos}
            escribible
          />
        </View>
      </View>

      {/* El total se anuncia al cambiar, para quien usa lector de pantalla. */}
      <View accessibilityLiveRegion="polite" className="items-center gap-1">
        <AppText variant="h3" className="text-center">
          {total > 0 ? textoDuracion(total) : vacio}
        </AppText>
        {detalle}
        <AppText variant="small" tone="ink-soft" className="text-center">
          {t.escribir}
        </AppText>
      </View>
    </>
  );
}
