import { Pressable, Switch, View } from 'react-native';

import { colors } from '@/theme';

import { AppText } from './app-text';

// Interruptor con etiqueta y ayuda, sobre el fondo de la pantalla (la ayuda puede ir en
// ink-soft). El estado también se lee en el propio interruptor, no solo por color. Toda la fila se
// puede tocar (critique de Impeccable): el interruptor solo mide 47×27 dp y la guía pide 48 dp.
// Para TalkBack la fila es un solo interruptor con su etiqueta y su ayuda.

export type SwitchRowProps = {
  label: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

export function SwitchRow({ label, help, value, onChange }: SwitchRowProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={help}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      className="min-h-12 flex-row items-center gap-4 rounded-field active:opacity-70"
    >
      <View className="flex-1 gap-1">
        <AppText weight="semibold">{label}</AppText>
        {help ? (
          <AppText variant="small" tone="ink-soft">
            {help}
          </AppText>
        ) : null}
      </View>
      <Switch
        importantForAccessibility="no"
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borde, true: colors.accent }}
        thumbColor={colors.blanco}
      />
    </Pressable>
  );
}
