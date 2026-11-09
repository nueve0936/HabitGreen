import { useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import { AppText } from './app-text';

// Columna de rueda (mockup «Seleccionar una fecha»): se ven 3 opciones y la del centro es la
// elegida, entre dos líneas. Con lector de pantalla se ajusta deslizando arriba o abajo
// («adjustable»).

const ALTO = 40;

export type WheelColumnProps = {
  etiqueta: string;
  opciones: readonly string[];
  indice: number;
  onCambiar: (indice: number) => void;
};

export function WheelColumn({ etiqueta, opciones, indice, onCambiar }: WheelColumnProps) {
  const scroll = useRef<ScrollViewInstance>(null);
  const seguro = Math.min(Math.max(indice, 0), opciones.length - 1);

  // Si cambia la lista (otro mes con menos días) o el índice desde fuera, se recoloca la rueda.
  useEffect(() => {
    scroll.current?.scrollTo({ y: seguro * ALTO, animated: false });
  }, [seguro, opciones.length]);

  const alSoltar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nuevo = Math.round(e.nativeEvent.contentOffset.y / ALTO);
    const limitado = Math.min(Math.max(nuevo, 0), opciones.length - 1);
    if (limitado !== seguro) onCambiar(limitado);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ text: opciones[seguro] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment')
          onCambiar(Math.min(seguro + 1, opciones.length - 1));
        if (e.nativeEvent.actionName === 'decrement') onCambiar(Math.max(seguro - 1, 0));
      }}
      style={{ height: ALTO * 3 }}
      className="flex-1"
    >
      <View
        pointerEvents="none"
        style={{ top: ALTO, height: ALTO }}
        className="absolute left-2 right-2 border-y-2 border-accent"
      />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ALTO}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ALTO }}
        onMomentumScrollEnd={alSoltar}
        onScrollEndDrag={(e) => {
          // En Android, un arrastre lento no siempre genera el fin de inercia.
          if (e.nativeEvent.velocity?.y === 0) alSoltar(e);
        }}
      >
        {opciones.map((opcion, i) => (
          <View key={opcion} style={{ height: ALTO }} className="items-center justify-center">
            <AppText
              weight={i === seguro ? 'bold' : 'regular'}
              tone={i === seguro ? 'ink' : 'ink-soft'}
            >
              {opcion}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
