import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import type { Conteo } from '@/features/stats/domain/cumplimiento';
import type { Vista } from '@/features/stats/domain/periodos';
import type { EtiquetaDivision } from '@/features/stats/domain/texto-periodo';

import { BarChart } from './bar-chart';
import { YearLineChart } from './year-line-chart';

// Tarjeta principal de Progreso: la frase («Cumpliste 12 de 15 esta semana») y su gráfica. Para
// TalkBack la gráfica es un solo elemento que lee el detalle por día, semana o mes.

export type ComplianceCardProps = {
  vista: Vista;
  frase: string;
  detalle: string;
  etiquetas: readonly EtiquetaDivision[];
  conteos: readonly Conteo[];
};

export function ComplianceCard({ vista, frase, detalle, etiquetas, conteos }: ComplianceCardProps) {
  return (
    <Card className="gap-6 p-6">
      <AppText variant="h3" accessibilityLiveRegion="polite">
        {frase}
      </AppText>
      <View accessible accessibilityLabel={detalle}>
        {vista === 'anio' ? (
          <YearLineChart etiquetas={etiquetas} conteos={conteos} />
        ) : (
          <BarChart etiquetas={etiquetas} conteos={conteos} />
        )}
      </View>
    </Card>
  );
}
