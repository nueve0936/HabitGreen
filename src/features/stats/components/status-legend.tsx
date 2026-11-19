import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { EstadoDia } from '@/features/stats/domain/cumplimiento';
import { es } from '@/i18n/es';

import { StatusCell } from './status-cell';

// Leyenda de las celdas: qué significa cada forma. Se lee como texto; las muestras son decorativas.

const MUESTRAS: (EstadoDia | null)[] = ['hecho', 'sin_marcar', 'toca', null];

export function StatusLegend() {
  const t = es.estadisticas;
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-2">
      {MUESTRAS.map((estado) => (
        <View key={estado ?? 'no'} className="flex-row items-center gap-1.5">
          <View importantForAccessibility="no-hide-descendants">
            <StatusCell estado={estado} lado={14} />
          </View>
          <AppText variant="small" tone="ink-soft">
            {estado ? t.estados[estado] : t.noToca}
          </AppText>
        </View>
      ))}
    </View>
  );
}
