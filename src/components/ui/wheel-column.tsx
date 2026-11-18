import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import { AppText } from './app-text';

// Columna de rueda (mockup «Seleccionar una fecha»): se ven 3 opciones y la del centro es la
// elegida, entre dos líneas. Tocar otra opción la elige. Con `escribible` (opciones numéricas
// seguidas, como 0–59), tocar la del centro permite escribir el número con el teclado. Con lector
// de pantalla se ajusta deslizando arriba o abajo («adjustable»).

const ALTO = 48;

export type WheelColumnProps = {
  etiqueta: string;
  opciones: readonly string[];
  indice: number;
  onCambiar: (indice: number) => void;
  /** Las opciones son números seguidos y el del centro se puede escribir. */
  escribible?: boolean;
};

export function WheelColumn({
  etiqueta,
  opciones,
  indice,
  onCambiar,
  escribible = false,
}: WheelColumnProps) {
  const scroll = useRef<ScrollViewInstance>(null);
  const seguro = Math.min(Math.max(indice, 0), opciones.length - 1);
  const [texto, setTexto] = useState<string | null>(null);

  // Si cambia la lista (otro mes con menos días) o el índice desde fuera, se recoloca la rueda.
  useEffect(() => {
    scroll.current?.scrollTo({ y: seguro * ALTO, animated: false });
  }, [seguro, opciones.length]);

  const alSoltar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nuevo = Math.round(e.nativeEvent.contentOffset.y / ALTO);
    const limitado = Math.min(Math.max(nuevo, 0), opciones.length - 1);
    if (limitado !== seguro) onCambiar(limitado);
  };

  /**
   * Lo escrito se aplica mientras se escribe, ajustado al rango («75» en minutos queda en 59): así
   * «Aceptar» toma el número aunque se toque con el teclado abierto.
   */
  const escribir = (valor: string) => {
    const limpio = valor.replace(/\D/g, '');
    setTexto(limpio);
    const numero = Number.parseInt(limpio, 10);
    if (Number.isNaN(numero)) return;
    const primero = Number(opciones[0] ?? 0);
    onCambiar(Math.min(Math.max(numero - primero, 0), opciones.length - 1));
  };

  const confirmar = () => setTexto(null);

  return (
    <View
      accessible={texto === null}
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
          <Pressable
            key={opcion}
            onPress={() => {
              if (i !== seguro) onCambiar(i);
              else if (escribible) setTexto(opcion);
            }}
            style={{ height: ALTO }}
            className="items-center justify-center"
          >
            <AppText
              weight={i === seguro ? 'bold' : 'regular'}
              tone={i === seguro ? 'ink' : 'ink-soft'}
            >
              {opcion}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      {texto !== null ? (
        <TextInput
          autoFocus
          selectTextOnFocus
          accessibilityLabel={etiqueta}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={String(opciones.length + Number(opciones[0] ?? 0)).length}
          value={texto}
          onChangeText={escribir}
          onSubmitEditing={confirmar}
          onBlur={confirmar}
          style={{ top: ALTO, height: ALTO }}
          className="absolute left-2 right-2 rounded-field border-2 border-accent bg-campo text-center font-bold text-body text-ink"
        />
      ) : null}
    </View>
  );
}
