import { Pressable } from 'react-native';

import { StableBoldText } from './stable-bold-text';

// Píldora de elección del mockup «Editar hábito»: la elegida va rellena de `surface` (texto ink,
// porque el blanco del mockup no contrasta) y en negritas; las demás, con borde `surface`.

export type ChoicePillProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  kind?: 'radio' | 'checkbox' | 'button';
  accessibilityLabel?: string;
};

export function ChoicePill({
  label,
  selected,
  onPress,
  kind = 'radio',
  accessibilityLabel,
}: ChoicePillProps) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      className={`min-h-12 items-center justify-center rounded-chip border-2 border-surface-oscuro px-4 py-2 ${
        selected ? 'bg-surface' : 'bg-campo active:bg-bg-claro'
      }`}
    >
      <StableBoldText variant="small" bold={selected}>
        {label}
      </StableBoldText>
    </Pressable>
  );
}
