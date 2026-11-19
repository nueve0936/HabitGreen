import { CalendarDays } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Botón «Hoy» del encabezado de Progreso: regresa a hoy en Diario y al periodo actual en Semanal y
// Mensual. Píldora `campo` con borde, icono de calendario y texto en negritas, del mismo tipo que
// el selector de pestañas; 48 dp de alto. TalkBack lo anuncia como «Volver a hoy».

export function TodayButton({ onPress }: { onPress: () => void }) {
  const t = es.estadisticas;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.irAHoyA11y}
      onPress={onPress}
      style={{ minHeight: 48 }}
      className="flex-row items-center gap-1.5 rounded-chip border-2 border-borde bg-campo px-4 active:bg-accent-claro"
    >
      <CalendarDays size={18} strokeWidth={2} color={colors.ink} />
      <AppText variant="small" weight="bold" maxFontSizeMultiplier={1.5}>
        {t.irAHoy}
      </AppText>
    </Pressable>
  );
}
