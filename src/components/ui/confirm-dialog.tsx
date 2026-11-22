import { Modal, Pressable, View } from 'react-native';

import { useAccionUnica } from '@/lib/use-accion-unica';

import { AppText } from './app-text';

// Diálogo de confirmación de los mockups del plan («Quitar» y «Agregar hábito»): tarjeta clara,
// «Cancelar» con borde y la acción en rojo (peligro) o verde (confirmar).

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
          <View className="flex-row gap-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelar}
              onPress={cancelarUnaVez}
              className="h-12 flex-1 items-center justify-center rounded-field border-2 border-borde bg-campo active:bg-accent-claro"
            >
              <AppText weight="bold">{cancelar}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={confirmar}
              onPress={confirmarUnaVez}
              className={`h-12 flex-1 items-center justify-center rounded-field active:opacity-80 ${
                tipo === 'peligro' ? 'bg-peligro' : 'bg-confirmar'
              }`}
            >
              <AppText weight="bold" tone="blanco">
                {confirmar}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
