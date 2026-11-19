import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { StableBoldText } from './stable-bold-text';

// Selector segmentado (SDD 9.4, Estadísticas): opciones excluyentes en una sola fila. La activa
// va sobre `accent-claro` con ✓ y negritas, para no depender solo del color. Cada opción mide
// 48 dp de alto y TalkBack la anuncia como pestaña. La letra escala hasta 1.5×. La versión
// `compacto` (Mes / Año en Progreso) ocupa solo lo que miden sus textos y no lleva ✓: la elegida se
// distingue por el fondo y las negritas.

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compacto?: boolean;
  accessibilityLabel?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compacto = false,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className={`flex-row rounded-chip border-2 border-borde bg-campo ${
        compacto ? 'gap-0.5 p-0.5' : 'gap-1 p-1'
      }`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{ minHeight: 48 }}
            className={`flex-row items-center justify-center gap-1 rounded-chip ${
              compacto ? 'px-3' : 'flex-1 px-2'
            } ${selected ? 'bg-accent-claro' : 'active:bg-accent-claro'}`}
          >
            {selected && !compacto ? (
              <Check size={16} strokeWidth={2.5} color={colors.ink} />
            ) : null}
            {/* Como las pestañas: tres opciones por fila no caben con la letra al doble. */}
            <StableBoldText variant="small" bold={selected} maxFontSizeMultiplier={1.5}>
              {option.label}
            </StableBoldText>
          </Pressable>
        );
      })}
    </View>
  );
}
