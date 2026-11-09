import { CircleCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText, type TextTone } from '@/components/ui/app-text';
import { es } from '@/i18n/es';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';
import { cardShadow, colors } from '@/theme';

import { textoHorario } from '../domain/plan-format';

// Tarjeta de un hábito del plan (mockups «Tu plan está listo» y «Sugerencias de hábitos»): fondo
// claro, verificación verde, título, duración con días y hora, la etiqueta de su categoría y los
// enlaces de acción («Editar» y «Quitar», o «Agregar»). Los enlaces dicen su acción con texto.

export type AccionTarjeta = {
  label: string;
  tone: Extract<TextTone, 'acento' | 'peligro' | 'confirmar'>;
  accessibilityLabel: string;
  onPress: () => void;
};

export type PlanHabitCardProps = {
  habito: HabitoPlan;
  ventana: BorradorPlan['ventana_flexible'];
  acciones: AccionTarjeta[];
};

export function PlanHabitCard({ habito, ventana, acciones }: PlanHabitCardProps) {
  const t = es.onboarding.revision;

  return (
    <View style={cardShadow} className="gap-2 rounded-card bg-campo px-4 pb-1 pt-4">
      <View className="flex-row items-start gap-2">
        <CircleCheck size={24} color={colors.campo} fill={colors.confirmar} strokeWidth={2.5} />
        <AppText weight="bold" className="flex-1">
          {habito.titulo}
        </AppText>
      </View>
      {habito.descripcion ? <AppText variant="small">{habito.descripcion}</AppText> : null}
      <AppText variant="small" tone="ink-soft">
        {textoHorario(habito, ventana, t)}
      </AppText>

      <View className="flex-row items-center justify-between gap-2">
        <View className="rounded-field bg-accent-claro px-3 py-1">
          <AppText variant="small" weight="semibold">
            {es.onboarding.formulario.areas[habito.categoria]}
          </AppText>
        </View>
        <View className="flex-row">
          {acciones.map((accion) => (
            <Pressable
              key={accion.label}
              accessibilityRole="button"
              accessibilityLabel={accion.accessibilityLabel}
              onPress={accion.onPress}
              className="min-h-12 justify-center px-2 active:opacity-60"
            >
              <AppText variant="small" weight="bold" tone={accion.tone}>
                {accion.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
