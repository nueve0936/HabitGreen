import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

// Contenedor de pantalla: fondo liso, áreas seguras y, si hay formulario, desplazamiento y teclado.

export type ScreenProps = {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView (formularios y pantallas largas). */
  scroll?: boolean;
  /** En pestañas, el borde inferior lo maneja la barra de pestañas. */
  edges?: Edge[];
  contentClassName?: string;
};

export function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  contentClassName = '',
}: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerClassName={`grow px-8 pb-8 ${contentClassName}`}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 px-8 ${contentClassName}`}>{children}</View>
  );

  return (
    <View className="flex-1 bg-bg">
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          // En Android con edge-to-edge la ventana no se encoge sola con el teclado: 'height' deja
          // visible el campo activo (guía de Android «Layout basics»).
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
