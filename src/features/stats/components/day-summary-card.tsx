import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';

// Resumen de un día en Diario: la frase («Llevas 1 de 3 hoy») y, si ese día hay algo hecho o por
// hacer, una barra de avance como la de Hoy (pista `divisor`, relleno `accent`). En días futuros
// solo la frase: ahí no hay avance que mostrar.

export function DaySummaryCard({
  frase,
  hechos,
  total,
  conBarra,
}: {
  frase: string;
  hechos: number;
  total: number;
  conBarra: boolean;
}) {
  return (
    <Card className="gap-3 p-5">
      <AppText variant="h3" accessibilityLiveRegion="polite">
        {frase}
      </AppText>
      {conBarra && total > 0 ? (
        <View
          importantForAccessibility="no-hide-descendants"
          className="h-2.5 overflow-hidden rounded-chip bg-divisor"
        >
          <View
            className="h-full rounded-chip bg-accent"
            style={{ width: `${(hechos / total) * 100}%` }}
          />
        </View>
      ) : null}
    </Card>
  );
}
