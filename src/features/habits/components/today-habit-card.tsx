import { Check, CircleCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import { horaCorta } from '../domain/horario';
import type { HabitoDelDia } from '../domain/habitos-del-dia';

// Tarjeta de un hábito en Hoy (SDD 9.4): título, hora y duración, y el check de 48 × 48 con
// icono y la palabra «Hecho». Marcado se distingue por icono relleno, texto en negrita y el
// enlace «Deshacer», no solo por color. El botón va sobre bg-claro con borde ink, porque el
// coral sobre la tarjeta terracota no contrasta (SDD 9.6).

export type TodayHabitCardProps = {
  item: HabitoDelDia;
  ocupado: boolean;
  onCompletar: () => void;
  onDeshacer: () => void;
};

export function TodayHabitCard({ item, ocupado, onCompletar, onDeshacer }: TodayHabitCardProps) {
  const t = es.hoy;
  const { habito, horario, hecho } = item;
  const detalle = [
    horaCorta(horario.hora) ?? es.habitos.tarjeta.horaFlexible,
    formatear(es.habitos.tarjeta.minutos, { n: habito.duracion_min }),
  ].join(' · ');

  return (
    <Card className="flex-row items-center gap-4">
      <View className="flex-1 gap-1">
        <AppText variant="h3">{habito.titulo}</AppText>
        <AppText variant="small" weight="semibold">
          {detalle}
        </AppText>
        {item.reprogramado ? <AppText variant="small">{t.reprogramado}</AppText> : null}
      </View>

      {hecho ? (
        <View className="items-center">
          <View
            accessible
            accessibilityLabel={`${habito.titulo}: ${t.hecho}`}
            className="min-h-12 flex-row items-center gap-1 rounded-chip border-2 border-ink bg-campo px-3"
          >
            <CircleCheck size={22} color={colors.ink} fill={colors['bg-claro']} strokeWidth={2.5} />
            <AppText weight="bold">{t.hecho}</AppText>
          </View>
          <Button
            variant="tertiary"
            label={t.deshacer}
            accessibilityLabel={formatear(t.deshacerEtiqueta, { titulo: habito.titulo })}
            disabled={ocupado}
            onPress={onDeshacer}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={formatear(t.marcar, { titulo: habito.titulo })}
          accessibilityState={{ disabled: ocupado, checked: false }}
          disabled={ocupado}
          onPress={onCompletar}
          className="min-h-12 min-w-12 flex-row items-center gap-1 rounded-chip border-2 border-ink bg-bg-claro px-3 active:bg-bg-oscuro"
        >
          <Check size={22} color={colors.ink} strokeWidth={2.5} />
          <AppText weight="semibold">{t.hecho}</AppText>
        </Pressable>
      )}
    </Card>
  );
}
