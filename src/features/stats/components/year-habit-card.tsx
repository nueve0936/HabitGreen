import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import type { Celda, Conteo } from '@/features/stats/domain/cumplimiento';
import type { Racha } from '@/features/stats/domain/rachas';
import { es, formatear } from '@/i18n/es';

import { StreakPill, textoRacha } from './streak-pill';

// Un hábito en la vista Año (maqueta «Mensual · Año»): una columna por semana y 7 filas de lunes a
// domingo. El cuadro se ajusta al ancho de la tarjeta. Hecho va relleno de `accent` y sin marcar
// con contorno; los días que no le tocan o que todavía no llegan quedan en blanco. Con cuadros tan
// chicos el detalle va en «40 de 52» y en el texto para TalkBack.

const SEPARACION = 1;

export type YearHabitCardProps = {
  titulo: string;
  etiquetaPeriodo: string;
  conteo: Conteo;
  racha: Racha;
  desanimo: boolean;
  semanas: readonly (string | null)[][];
  celdas: ReadonlyMap<string, Celda> | undefined;
};

export function YearHabitCard({
  titulo,
  etiquetaPeriodo,
  conteo,
  racha,
  desanimo,
  semanas,
  celdas,
}: YearHabitCardProps) {
  const t = es.estadisticas;
  const [ancho, setAncho] = useState(0);
  const lado = Math.max(
    2,
    Math.floor((ancho - SEPARACION * (semanas.length - 1)) / semanas.length),
  );
  const resumen = formatear(t.tarjetaA11y, {
    habito: titulo,
    n: conteo.hechos,
    total: conteo.total,
    periodo: etiquetaPeriodo,
  });

  return (
    <Card
      accessible
      accessibilityLabel={[resumen, textoRacha(racha, desanimo)].filter(Boolean).join(' ')}
      className="gap-2.5"
    >
      <View className="flex-row items-center gap-2">
        <AppText weight="medium" className="flex-1">
          {titulo}
        </AppText>
        <StreakPill racha={racha} desanimo={desanimo} />
      </View>
      <AppText variant="small" tone="ink-soft">
        {conteo.total === 0
          ? t.sinDias
          : formatear(t.conteo, { n: conteo.hechos, total: conteo.total })}
      </AppText>
      <View
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
        className="flex-row"
        style={{ gap: SEPARACION }}
      >
        {ancho > 0
          ? semanas.map((semana, i) => (
              <View key={i} style={{ gap: SEPARACION }}>
                {semana.map((fecha, j) => {
                  const estado = fecha ? celdas?.get(fecha)?.estado : undefined;
                  return (
                    <View
                      key={j}
                      style={{
                        width: lado,
                        height: lado,
                        borderRadius: 1,
                        borderWidth: estado === 'sin_marcar' ? 1 : 0,
                      }}
                      className={
                        estado === 'hecho'
                          ? 'bg-accent'
                          : estado === 'sin_marcar'
                            ? 'border-borde'
                            : fecha
                              ? 'bg-bg'
                              : ''
                      }
                    />
                  );
                })}
              </View>
            ))
          : null}
      </View>
    </Card>
  );
}
