import { Switch, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Interruptor con etiqueta y ayuda, sobre el fondo de la pantalla (la ayuda puede ir en
// ink-soft). El estado también se lee en el propio interruptor, no solo por color.

export type SwitchRowProps = {
  label: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SwitchRow({ label, help, value, onChange }: SwitchRowProps) {
  return (
    <View className="min-h-12 flex-row items-center gap-4">
      <View className="flex-1 gap-1">
        <AppText weight="semibold">{label}</AppText>
        {help ? (
          <AppText variant="small" tone="ink-soft">
            {help}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={help}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borde, true: colors.accent }}
        thumbColor={colors.blanco}
      />
    </View>
  );
}
