import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { AppText } from './app-text';

// Ventana de diálogo de los mockups (tarjeta clara sobre fondo atenuado). Tocar
// fuera la cierra. La usan los selectores del asistente de hábito, el tiempo diario y el límite
// de hábitos. Para TalkBack el fondo no existe (como el velo de Material): sin esto se anunciaba
// como un botón con el texto del título. Con lector de pantalla se cierra con los botones del
// diálogo o con «atrás».

export type DialogProps = {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
};

export function Dialog({ visible, titulo, onCerrar, children }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCerrar}>
      <View className="flex-1 items-center justify-center px-10">
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onCerrar}
          className="absolute inset-0 bg-ink/40"
        />
        <View accessibilityViewIsModal className="w-full gap-4 rounded-card bg-campo p-6">
          <AppText weight="bold" className="text-center" accessibilityRole="header">
            {titulo}
          </AppText>
          {children}
        </View>
      </View>
    </Modal>
  );
}
