import { EllipsisVertical, Pause } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

import { textoHabito } from '../domain/formato';
import type { HabitoConHorario } from '@/db/habits-repository';

// Tarjeta de la lista de Hábitos: título, días, hora y duración, la marca «En pausa» (icono y
// texto) y el botón ⋮ con las opciones del mockup. Tocar la tarjeta abre la edición.

export type HabitListCardProps = {
  item: HabitoConHorario;
  onPress: () => void;
  onOpciones: () => void;
};

export function HabitListCard({ item, onPress, onOpciones }: HabitListCardProps) {
  const { habito, horario } = item;
  const t = es.habitos;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={habito.titulo}
      className="flex-row items-center gap-2"
    >
      <View className="flex-1 gap-1">
        <AppText variant="h3">{habito.titulo}</AppText>
        {horario ? (
          <AppText variant="small" weight="semibold">
            {textoHabito({ ...horario, duracion_min: habito.duracion_min }, t.tarjeta)}
          </AppText>
        ) : null}
        {habito.activo ? null : (
          <View className="flex-row items-center gap-1">
            <Pause size={16} color={colors.ink} />
            <AppText variant="small" weight="bold">
              {t.enPausa}
            </AppText>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={formatear(t.opciones, { titulo: habito.titulo })}
        onPress={onOpciones}
        hitSlop={4}
        className="h-11 w-11 items-center justify-center rounded-chip active:bg-surface-claro"
      >
        <EllipsisVertical size={24} color={colors.ink} />
      </Pressable>
    </Card>
  );
}
