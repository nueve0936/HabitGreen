import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { Conteo } from '@/features/stats/domain/cumplimiento';
import type { EtiquetaDivision } from '@/features/stats/domain/texto-periodo';

// Barras de la semana (por día) y del mes (por semana). Cada barra es una pista `divisor` de toda
// la altura con el relleno `accent` de hechos / programados. Sin días que contar (o en el futuro)
// solo hay un punto. La etiqueta de hoy va en negritas. TalkBack lee el detalle completo desde la
// tarjeta, así que las barras no se anuncian una por una.

const ALTO = 'h-32';

export type BarChartProps = {
  etiquetas: readonly EtiquetaDivision[];
  conteos: readonly Conteo[];
};

export function BarChart({ etiquetas, conteos }: BarChartProps) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      className="flex-row items-end justify-between gap-2"
    >
      {etiquetas.map((etiqueta, i) => {
        const conteo = conteos[i] ?? { hechos: 0, total: 0 };
        const vacia = etiqueta.futura || conteo.total === 0;
        const proporcion = vacia ? 0 : conteo.hechos / conteo.total;
        return (
          <View key={etiqueta.nombre} className="flex-1 items-center gap-2">
            <View className={`${ALTO} w-full items-center justify-end`}>
              {vacia ? (
                <View className="mb-1 h-1.5 w-1.5 rounded-chip bg-borde" />
              ) : (
                <View className="h-full w-full max-w-7 justify-end overflow-hidden rounded-field bg-divisor">
                  <View
                    className="w-full rounded-field bg-accent"
                    style={{ height: `${proporcion * 100}%` }}
                  />
                </View>
              )}
            </View>
            <AppText
              variant="small"
              weight={etiqueta.actual ? 'bold' : 'regular'}
              tone={etiqueta.actual ? 'ink' : 'ink-soft'}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {etiqueta.corta}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
