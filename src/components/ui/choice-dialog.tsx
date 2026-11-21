import { Modal, Pressable, View } from 'react-native';

import { AppText } from './app-text';

// Diálogo con tres respuestas, como el de confirmación pero apiladas: la principal en verde
// (`confirmar`), la que pierde algo con borde y texto rojo (`peligro`) y «Cancelar» como enlace.
// Lo usa el asistente de hábito al salir con cambios: Guardar, Descartar o Cancelar. «Atrás» y
// tocar fuera cancelan. Cada botón mide 48 dp.

export type ChoiceDialogProps = {
  visible: boolean;
  titulo: string;
  mensaje?: string;
  principal: string;
  peligro: string;
  cancelar: string;
  onPrincipal: () => void;
  onPeligro: () => void;
  onCancelar: () => void;
};

export function ChoiceDialog({
  visible,
  titulo,
  mensaje,
  principal,
  peligro,
  cancelar,
  onPrincipal,
  onPeligro,
  onCancelar,
}: ChoiceDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancelar}>
      <View className="flex-1 items-center justify-center px-10">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cancelar}
          onPress={onCancelar}
          className="absolute inset-0 bg-ink/40"
        />
        <View accessibilityViewIsModal className="w-full gap-5 rounded-card bg-campo p-6">
          <View className="gap-2">
            <AppText weight="bold" className="text-center" accessibilityRole="header">
              {titulo}
            </AppText>
            {mensaje ? (
              <AppText variant="small" tone="ink-soft" className="text-center">
                {mensaje}
              </AppText>
            ) : null}
          </View>
          <View className="gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={principal}
              onPress={onPrincipal}
              style={{ minHeight: 48 }}
              className="items-center justify-center rounded-field bg-confirmar px-4 active:opacity-80"
            >
              <AppText weight="bold" tone="blanco">
                {principal}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={peligro}
              onPress={onPeligro}
              style={{ minHeight: 48 }}
              className="items-center justify-center rounded-field border-2 border-peligro bg-campo px-4 active:bg-error-claro"
            >
              <AppText weight="bold" tone="peligro">
                {peligro}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelar}
              onPress={onCancelar}
              style={{ minHeight: 48 }}
              className="items-center justify-center px-4 active:opacity-70"
            >
              <AppText weight="semibold" className="underline">
                {cancelar}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
