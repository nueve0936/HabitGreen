import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import type { Celda, Conteo } from '@/features/stats/domain/cumplimiento';
import type { Racha } from '@/features/stats/domain/rachas';
import { es, formatear } from '@/i18n/es';

import { StatusCell } from './status-cell';
import { StreakPill, textoRacha } from './streak-pill';

// Un hábito en Mensual (maqueta «Mensual B»): a la izquierda el nombre, «5 de 6» y la racha; a la
// derecha su mini calendario de lunes a domingo, con celdas de 12 dp y los mismos estados que la
// semana. Para TalkBack es un solo elemento con el conteo del mes y la racha.

const LADO = 12;
const SEPARACION = 3;

export type MonthHabitCardProps = {
  titulo: string;
  etiquetaPeriodo: string;
  conteo: Conteo;
  racha: Racha;
  desanimo: boolean;
  semanas: readonly (string | null)[][];
  celdas: ReadonlyMap<string, Celda> | undefined;
};

export function MonthHabitCard({
  titulo,
  etiquetaPeriodo,
  conteo,
  racha,
  desanimo,
  semanas,
  celdas,
}: MonthHabitCardProps) {
  const t = es.estadisticas;
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
      className="flex-row items-center gap-3"
    >
      <View className="flex-1 gap-1.5">
        <AppText weight="medium">{titulo}</AppText>
        <AppText variant="small" tone="ink-soft">
          {conteo.total === 0
            ? t.sinDias
            : formatear(t.conteo, { n: conteo.hechos, total: conteo.total })}
        </AppText>
        <StreakPill racha={racha} desanimo={desanimo} />
      </View>
      <View style={{ gap: SEPARACION }}>
        {semanas.map((semana, i) => (
          <View key={i} className="flex-row" style={{ gap: SEPARACION }}>
            {semana.map((fecha, j) => (
              <StatusCell
                key={fecha ?? `h${j}`}
                lado={LADO}
                vacio={fecha === null}
                estado={fecha ? (celdas?.get(fecha)?.estado ?? null) : null}
              />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}
