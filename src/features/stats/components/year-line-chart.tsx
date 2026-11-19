import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import type { Conteo } from '@/features/stats/domain/cumplimiento';
import type { EtiquetaDivision } from '@/features/stats/domain/texto-periodo';
import { colors } from '@/theme';

// Línea del año (SDD 8): un punto por mes con hechos / programados. Los meses sin días que contar
// y los futuros no tienen punto, y la línea se corta ahí para no inventar un valor. Guías
// horizontales en `divisor` (lleno, mitad y vacío), sin números: el resumen va en texto.

const ALTO = 128;
const MARGEN = 8;

export type YearLineChartProps = {
  etiquetas: readonly EtiquetaDivision[];
  conteos: readonly Conteo[];
};

export function YearLineChart({ etiquetas, conteos }: YearLineChartProps) {
  const [ancho, setAncho] = useState(0);
  const paso = ancho / etiquetas.length;
  const y = (proporcion: number) => MARGEN + (1 - proporcion) * (ALTO - 2 * MARGEN);

  const puntos = etiquetas.map((etiqueta, i) => {
    const conteo = conteos[i] ?? { hechos: 0, total: 0 };
    if (etiqueta.futura || conteo.total === 0) return null;
    return { x: paso * (i + 0.5), y: y(conteo.hechos / conteo.total), actual: etiqueta.actual };
  });

  // Tramos de meses seguidos con punto.
  const tramos: { x: number; y: number }[][] = [];
  let tramo: { x: number; y: number }[] = [];
  for (const punto of puntos) {
    if (punto) tramo.push(punto);
    else if (tramo.length > 0) {
      tramos.push(tramo);
      tramo = [];
    }
  }
  if (tramo.length > 0) tramos.push(tramo);

  return (
    <View importantForAccessibility="no-hide-descendants" className="gap-2">
      <View style={{ height: ALTO }} onLayout={(e) => setAncho(e.nativeEvent.layout.width)}>
        {ancho > 0 ? (
          <Svg width={ancho} height={ALTO}>
            {[0, 0.5, 1].map((p) => (
              <Line
                key={p}
                x1={0}
                x2={ancho}
                y1={y(p)}
                y2={y(p)}
                stroke={colors.divisor}
                strokeWidth={1}
              />
            ))}
            {tramos.map((t) => (
              <Polyline
                key={`${t[0].x}`}
                points={t.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.accent}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {puntos.map((p, i) =>
              p ? (
                <Circle
                  key={etiquetas[i].nombre}
                  cx={p.x}
                  cy={p.y}
                  r={p.actual ? 6 : 4}
                  fill={colors.accent}
                  stroke={colors.campo}
                  strokeWidth={p.actual ? 2 : 0}
                />
              ) : null,
            )}
          </Svg>
        ) : null}
      </View>
      <View className="flex-row">
        {etiquetas.map((etiqueta) => (
          <AppText
            key={etiqueta.nombre}
            variant="small"
            weight={etiqueta.actual ? 'bold' : 'regular'}
            tone={etiqueta.actual ? 'ink' : 'ink-soft'}
            maxFontSizeMultiplier={1.3}
            className="flex-1 text-center"
          >
            {etiqueta.corta}
          </AppText>
        ))}
      </View>
    </View>
  );
}
