import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Opción del formulario (SDD 9.3, forma de los mockups). La opción elegida se distingue por
// fondo, borde, texto en negrita e icono de verificación: nunca solo por color.

export type OptionChipProps = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** checkbox para preguntas de varias respuestas; radio para una sola. */
  kind?: 'radio' | 'checkbox';
  disabled?: boolean;
};

export function OptionChip({
  label,
  description,
  selected,
  onPress,
  kind = 'radio',
  disabled = false,
}: OptionChipProps) {
  return (
    <Pressable
      accessibilityRole={kind}
      accessibilityLabel={description ? `${label}. ${description}` : label}
      accessibilityState={{ checked: selected, selected, disabled }}
      onPress={onPress}
      disabled={disabled}
      className={`min-h-12 flex-row items-center gap-3 rounded-card border-2 px-4 py-3 ${
        selected ? 'border-ink bg-surface' : 'border-bg-oscuro bg-campo active:bg-bg-claro'
      }`}
    >
      <View className="flex-1 items-center">
        <AppText variant="h3" weight={selected ? 'bold' : 'medium'} className="text-center">
          {label}
        </AppText>
        {description ? (
          // Sobre surface el texto de apoyo va en ink (SDD 9.6).
          <AppText variant="small" tone={selected ? 'ink' : 'ink-soft'} className="text-center">
            {description}
          </AppText>
        ) : null}
      </View>
      <View
        className={`h-7 w-7 items-center justify-center rounded-chip border-2 border-ink ${
          selected ? 'bg-campo' : 'bg-transparent'
        }`}
      >
        {selected ? <Check size={18} color={colors.ink} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
