import { Pressable, View } from 'react-native';

import { StableBoldText } from './stable-bold-text';

// Cuadros de días L M M J V S D (mockup «Crear hábito #3»). El elegido va relleno de `surface` y en
// negritas; el lector de pantalla dice el nombre completo del día y si está elegido.

export type DaySquaresProps = {
  /** Días elegidos, ISO 1 = lunes … 7 = domingo. */
  value: number[];
  onChange: (dias: number[]) => void;
  iniciales: readonly string[];
  nombres: readonly string[];
};

export function DaySquares({ value, onChange, iniciales, nombres }: DaySquaresProps) {
  return (
    <View className="flex-row justify-between rounded-card border-2 border-bg-oscuro bg-campo p-3">
      {iniciales.map((inicial, i) => {
        const dia = i + 1;
        const elegido = value.includes(dia);
        return (
          <Pressable
            key={nombres[i]}
            accessibilityRole="checkbox"
            accessibilityLabel={nombres[i]}
            accessibilityState={{ checked: elegido }}
            onPress={() =>
              onChange(
                elegido ? value.filter((d) => d !== dia) : [...value, dia].sort((a, b) => a - b),
              )
            }
            hitSlop={{ top: 2, bottom: 2, left: 4, right: 4 }}
            className={`h-12 w-10 items-center justify-center rounded-field border-2 ${
              elegido
                ? 'border-surface-oscuro bg-surface'
                : 'border-ink-soft bg-campo active:bg-bg-claro'
            }`}
          >
            <StableBoldText bold={elegido} weight="semibold">
              {inicial}
            </StableBoldText>
          </Pressable>
        );
      })}
    </View>
  );
}
