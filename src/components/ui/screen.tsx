import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { gradientBackground } from '@/theme';

// Contenedor de pantalla: degradado crema → oliva de los mockups, áreas seguras y, si hay
// formulario, desplazamiento y teclado. Márgenes laterales amplios como en Figma.

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
    <LinearGradient colors={gradientBackground} style={{ flex: 1 }}>
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
    </LinearGradient>
  );
}
