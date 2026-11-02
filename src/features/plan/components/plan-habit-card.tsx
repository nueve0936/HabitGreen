import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { es } from '@/i18n/es';
import type { BorradorPlan, HabitoPlan } from '@/schemas/plan';

import { textoHorario } from '../domain/plan-format';

// Tarjeta de un hábito en la revisión del plan (SDD 9.4): título, duración, días y hora, con las
// acciones «Cambiar hora», «Bajar nivel» y «Quitar». Sobre `surface` todo el texto va en ink.

export type PlanHabitCardProps = {
  habito: HabitoPlan;
  ventana: BorradorPlan['ventana_flexible'];
  puedeBajar: boolean;
  puedeQuitar: boolean;
  onCambiarHora: () => void;
  onBajarNivel: () => void;
  onQuitar: () => void;
};

export function PlanHabitCard({
  habito,
  ventana,
  puedeBajar,
  puedeQuitar,
  onCambiarHora,
  onBajarNivel,
  onQuitar,
}: PlanHabitCardProps) {
  const t = es.onboarding.revision;

  return (
    <Card className="gap-2">
      <AppText variant="h3">{habito.titulo}</AppText>
      {habito.descripcion ? <AppText>{habito.descripcion}</AppText> : null}
      <AppText variant="small" weight="semibold">
        {textoHorario(habito, ventana, t)}
      </AppText>

      <View className="-mx-2 flex-row flex-wrap">
        <Button
          variant="tertiary"
          label={t.cambiarHora}
          accessibilityLabel={`${t.cambiarHora}: ${habito.titulo}`}
          onPress={onCambiarHora}
        />
        {puedeBajar ? (
          <Button
            variant="tertiary"
            label={t.bajarNivel}
            accessibilityLabel={`${t.bajarNivel}: ${habito.titulo}`}
            onPress={onBajarNivel}
          />
        ) : null}
        {puedeQuitar ? (
          <Button
            variant="tertiary"
            label={t.quitar}
            accessibilityLabel={`${t.quitar}: ${habito.titulo}`}
            onPress={onQuitar}
          />
        ) : null}
      </View>
    </Card>
  );
}
