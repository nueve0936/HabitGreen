import { Redirect } from 'expo-router';
import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Screen } from '@/components/ui/screen';
import { PlanHabitCard } from '@/features/plan/components/plan-habit-card';
import {
  paginaDeSugerencias,
  SUGERENCIAS_POR_PAGINA,
  sugerenciasDisponibles,
} from '@/features/plan/domain/plan-review';
import { usePlanReviewStore } from '@/features/plan/plan-review-store';
import { useRutasPlan } from '@/features/plan/use-rutas-plan';
import { es, formatear } from '@/i18n/es';
import type { HabitoPlan } from '@/schemas/plan';
import { colors } from '@/theme';
import { navegar } from '@/lib/navegar';

// «Sugerencias de hábitos» (mockups «Agregar otro hábito»): 4 hábitos de nivel 1 de objetivos que
// no están en el plan, solo de su área (un plan por área). «Sugerir otros hábitos» muestra los 4
// siguientes. Al agregar uno se vuelve a la revisión del plan.

export default function SugerenciasScreen() {
  const t = es.onboarding.sugerencias;
  const borrador = usePlanReviewStore((s) => s.borrador);
  const agregar = usePlanReviewStore((s) => s.agregar);
  const [pagina, setPagina] = useState(0);
  const rutas = useRutasPlan();
  const [eligiendo, setEligiendo] = useState<HabitoPlan | null>(null);

  if (borrador === null) return <Redirect href={rutas.generando} />;

  const disponibles = sugerenciasDisponibles(borrador);
  const visibles = paginaDeSugerencias(disponibles, pagina);

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>
      <AppText variant="h2">{t.titulo}</AppText>

      {visibles.length === 0 ? (
        <AppText tone="ink-soft">{t.vacio}</AppText>
      ) : (
        <View className="gap-4" accessibilityLiveRegion="polite">
          {visibles.map((habito) => (
            <PlanHabitCard
              key={habito.objetivo}
              habito={habito}
              ventana={borrador.ventana_flexible}
              acciones={[
                {
                  label: t.agregar,
                  tone: 'confirmar',
                  accessibilityLabel: formatear(t.agregarEtiqueta, { titulo: habito.titulo }),
                  onPress: () => setEligiendo(habito),
                },
              ]}
            />
          ))}
        </View>
      )}

      {disponibles.length > SUGERENCIAS_POR_PAGINA ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.otras}
          onPress={() => setPagina((p) => p + 1)}
          className="min-h-14 flex-row items-center justify-center gap-2 rounded-card border-2 border-dashed border-divisor active:bg-accent-claro"
        >
          <RefreshCw size={20} color={colors.ink} />
          <AppText weight="semibold">{t.otras}</AppText>
        </Pressable>
      ) : null}

      <ConfirmDialog
        visible={eligiendo !== null}
        tipo="confirmar"
        mensaje={formatear(t.confirmar, { titulo: eligiendo?.titulo ?? '' })}
        cancelar={t.cancelar}
        confirmar={t.agregar}
        onCancelar={() => setEligiendo(null)}
        onConfirmar={() => {
          if (eligiendo) agregar(eligiendo);
          setEligiendo(null);
          navegar.back();
        }}
      />
    </Screen>
  );
}
