import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import type { Celda, Conteo } from '@/features/stats/domain/cumplimiento';
import type { Racha } from '@/features/stats/domain/rachas';
import { es, formatear } from '@/i18n/es';

import { StatusCell } from './status-cell';
import { StreakPill, textoRacha } from './streak-pill';

// Un hábito en Semanal (maqueta «Semanal A» con fechas): nombre y racha, y debajo sus 7 días con
// la letra y el número («L 16») sobre cada celda; hoy en negritas. Para TalkBack es un solo
// elemento: el conteo, la racha y el estado de cada día.

export type DiaSemana = {
  fecha: string;
  letra: string;
  numero: number;
  nombre: string;
  esHoy: boolean;
};

export type WeekHabitCardProps = {
  titulo: string;
  etiquetaPeriodo: string;
  conteo: Conteo;
  racha: Racha;
  desanimo: boolean;
  dias: readonly DiaSemana[];
  celdas: ReadonlyMap<string, Celda> | undefined;
};

export function WeekHabitCard({
  titulo,
  etiquetaPeriodo,
  conteo,
  racha,
  desanimo,
  dias,
  celdas,
}: WeekHabitCardProps) {
  const t = es.estadisticas;
  const detalle = dias
    .map((d) => {
      const celda = celdas?.get(d.fecha);
      return `${d.nombre}: ${celda ? t.estados[celda.estado] : t.noToca}`;
    })
    .join('. ');
  const resumen = formatear(t.tarjetaA11y, {
    habito: titulo,
    n: conteo.hechos,
    total: conteo.total,
    periodo: etiquetaPeriodo,
  });

  return (
    <Card
      accessible
      accessibilityLabel={[resumen, textoRacha(racha, desanimo), detalle].filter(Boolean).join(' ')}
      className="gap-3"
    >
      <View className="flex-row items-center gap-2">
        <AppText weight="medium" className="flex-1">
          {titulo}
        </AppText>
        <StreakPill racha={racha} desanimo={desanimo} />
      </View>
      <View className="flex-row justify-between">
        {dias.map((d) => {
          const celda = celdas?.get(d.fecha);
          return (
            <View key={d.fecha} className="items-center gap-1">
              <AppText
                variant="small"
                weight={d.esHoy ? 'bold' : 'regular'}
                tone={d.esHoy ? 'ink' : 'ink-soft'}
                maxFontSizeMultiplier={1.2}
                className="text-center"
              >
                {`${d.letra}\n${d.numero}`}
              </AppText>
              <StatusCell estado={celda?.estado ?? null} lado={32} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}
