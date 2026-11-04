import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { diasDelMes, fechaDesdeMesDia, mesYDia } from '@/features/habits/domain/fechas';

import { AppText } from './app-text';
import { Button } from './button';
import { Dialog } from './dialog';
import { WheelColumn } from './wheel-column';

// «Seleccionar una fecha» (mockup «Crear hábito #3.2»): ruedas de mes y día con «Cancelar» y
// «Aceptar». El año no se elige: es la próxima vez que ocurre esa fecha desde `minima`.
// Se monta solo mientras está abierto, así que siempre arranca en `valor`.

export type DateWheelDialogTextos = {
  titulo: string;
  meses: readonly string[];
  mes: string;
  dia: string;
  cancelar: string;
  aceptar: string;
  sinFin: string;
};

export type DateWheelDialogProps = {
  textos: DateWheelDialogTextos;
  /** Fecha inicial "YYYY-MM-DD". */
  valor: string;
  /** Fecha más temprana que se puede elegir. */
  minima: string;
  onAceptar: (fecha: string) => void;
  onCancelar: () => void;
  /** Si existe, muestra «Sin fecha de fin». */
  onQuitar?: () => void;
};

export function DateWheelDialog({
  textos,
  valor,
  minima,
  onAceptar,
  onCancelar,
  onQuitar,
}: DateWheelDialogProps) {
  const inicial = mesYDia(valor);
  const [mes, setMes] = useState(inicial.mes);
  const [dia, setDia] = useState(inicial.dia);

  const anio = Number(fechaDesdeMesDia(mes, 1, minima).slice(0, 4));
  const totalDias = diasDelMes(anio, mes);
  const dias = Array.from({ length: totalDias }, (_, i) => String(i + 1));
  const diaSeguro = Math.min(dia, totalDias);

  return (
    <Dialog visible titulo={textos.titulo} onCerrar={onCancelar}>
      <View className="flex-row gap-2">
        <WheelColumn
          etiqueta={textos.mes}
          opciones={textos.meses}
          indice={mes - 1}
          onCambiar={(i) => setMes(i + 1)}
        />
        <WheelColumn
          etiqueta={textos.dia}
          opciones={dias}
          indice={diaSeguro - 1}
          onCambiar={(i) => setDia(i + 1)}
        />
      </View>

      <View className="flex-row gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textos.cancelar}
          onPress={onCancelar}
          className="h-12 flex-1 items-center justify-center rounded-field border-2 border-accent bg-campo active:bg-bg-claro"
        >
          <AppText weight="bold">{textos.cancelar}</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={textos.aceptar}
          onPress={() => onAceptar(fechaDesdeMesDia(mes, diaSeguro, minima))}
          className="h-12 flex-1 items-center justify-center rounded-field border-2 border-ink bg-accent active:bg-accent-oscuro"
        >
          <AppText weight="bold">{textos.aceptar}</AppText>
        </Pressable>
      </View>

      {onQuitar ? <Button variant="tertiary" label={textos.sinFin} onPress={onQuitar} /> : null}
    </Dialog>
  );
}
