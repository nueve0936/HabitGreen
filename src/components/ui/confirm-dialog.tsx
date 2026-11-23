import { Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { useAccionUnica } from '@/lib/use-accion-unica';

import { AppText } from './app-text';

// Diálogo de confirmación de los mockups del plan («Quitar» y «Agregar hábito»): tarjeta clara,
// «Cancelar» con borde y la acción en rojo (peligro) o verde (confirmar).
// Pulido de Impeccable: si los textos no caben lado a lado (largos o con letra grande), los botones
// se apilan con la acción arriba, como «¿Guardar los cambios?». Los botones miden al menos 48 dp y
// crecen si el texto ocupa dos renglones, en vez de que se salga.

/** Suma de caracteres de los dos botones a partir de la cual ya no caben en un renglón. */
const LARGO_MAXIMO_EN_FILA = 22;
const ESCALA_APILAR = 1.3;

export type ConfirmDialogProps = {
  visible: boolean;
  mensaje: string;
  cancelar: string;
  confirmar: string;
  tipo: 'peligro' | 'confirmar';
  onCancelar: () => void;
  onConfirmar: () => void;
  /** «Atrás» del sistema. Por defecto, igual que cancelar. */
  onCerrar?: () => void;
};

export function ConfirmDialog({
  visible,
  mensaje,
  cancelar,
  confirmar,
  tipo,
  onCancelar,
  onConfirmar,
  onCerrar,
}: ConfirmDialogProps) {
  // Un toque doble rápido no confirma (ni cancela) dos veces.
  const cancelarUnaVez = useAccionUnica(onCancelar);
  const confirmarUnaVez = useAccionUnica(onConfirmar);
  const { fontScale } = useWindowDimensions();
  const apilar =
    cancelar.length + confirmar.length > LARGO_MAXIMO_EN_FILA || fontScale >= ESCALA_APILAR;

  const botonCancelar = (
    <Pressable
      key="cancelar"
      accessibilityRole="button"
      accessibilityLabel={cancelar}
      onPress={cancelarUnaVez}
      className={`min-h-12 items-center justify-center rounded-field border-2 border-borde bg-campo px-3 py-2 active:bg-accent-claro ${apilar ? '' : 'flex-1'}`}
    >
      <AppText weight="bold" className="text-center">
        {cancelar}
      </AppText>
    </Pressable>
  );
  const botonConfirmar = (
    <Pressable
      key="confirmar"
      accessibilityRole="button"
      accessibilityLabel={confirmar}
      onPress={confirmarUnaVez}
      className={`min-h-12 items-center justify-center rounded-field px-3 py-2 active:opacity-80 ${
        tipo === 'peligro' ? 'bg-peligro' : 'bg-confirmar'
      } ${apilar ? '' : 'flex-1'}`}
    >
      <AppText weight="bold" tone="blanco" className="text-center">
        {confirmar}
      </AppText>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar ?? onCancelar}
    >
      <View className="flex-1 items-center justify-center bg-ink/40 px-10">
        <View accessibilityViewIsModal className="w-full gap-6 rounded-card bg-campo p-6">
          <AppText weight="bold" className="text-center" accessibilityRole="header">
            {mensaje}
          </AppText>
          {apilar ? (
            <View className="gap-3">{[botonConfirmar, botonCancelar]}</View>
          ) : (
            <View className="flex-row gap-4">{[botonCancelar, botonConfirmar]}</View>
          )}
        </View>
      </View>
    </Modal>
  );
}
