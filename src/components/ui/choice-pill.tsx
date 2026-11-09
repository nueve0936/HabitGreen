import { Pressable } from 'react-native';

import { StableBoldText } from './stable-bold-text';

// Píldora de elección del mockup «Editar hábito»: la elegida va rellena de `accent`, con texto blanco
// en negritas; las demás, con borde.

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
      className={`min-h-12 items-center justify-center rounded-chip border-2 px-4 py-2 ${
        selected ? 'border-accent bg-accent' : 'border-borde bg-campo active:bg-accent-claro'
      }`}
    >
      <StableBoldText variant="small" bold={selected} tone={selected ? 'blanco' : 'ink'}>
        {label}
      </StableBoldText>
    </Pressable>
  );
}
