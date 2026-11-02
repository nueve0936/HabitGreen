import { Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Interruptor «Segundo aviso» de la revisión del plan (SDD 5.6). Va sobre el fondo de la
// pantalla, así que la ayuda puede ir en ink-soft.

export function SecondNoticeToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = es.onboarding.revision;

  return (
    <View className="min-h-12 flex-row items-center gap-4">
      <View className="flex-1 gap-1">
        <AppText weight="semibold">{t.segundoAviso}</AppText>
        <AppText variant="small" tone="ink-soft">
          {t.segundoAvisoAyuda}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={t.segundoAviso}
        accessibilityHint={t.segundoAvisoAyuda}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors['bg-oscuro'], true: colors['surface-oscuro'] }}
        thumbColor={value ? colors.ink : colors['bg-claro']}
      />
    </View>
  );
}
