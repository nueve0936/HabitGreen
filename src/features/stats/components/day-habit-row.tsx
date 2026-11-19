import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import type { EstadoDia } from '@/features/stats/domain/cumplimiento';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Un hábito de un día que no es hoy, en Diario (solo consulta: el check-in es solo para hoy).
// Círculo verde con ✓ y «Hecho», contorno y «Sin marcar», o contorno punteado y «Te toca». Si
// llegó movido, «· Reprogramado». A la derecha, su racha.

export type DayHabitRowProps = {
  titulo: string;
  estado: EstadoDia;
  reprogramado: boolean;
  racha: ReactNode;
};

export function DayHabitRow({ titulo, estado, reprogramado, racha }: DayHabitRowProps) {
  const t = es.estadisticas;
  const texto = reprogramado ? `${t.estados[estado]} · ${t.reprogramado}` : t.estados[estado];
  return (
    <Card className="flex-row items-center gap-3">
      <View
        importantForAccessibility="no-hide-descendants"
        className={`h-8 w-8 items-center justify-center rounded-chip ${
          estado === 'hecho'
            ? 'bg-accent'
            : estado === 'sin_marcar'
              ? 'border-2 border-borde bg-campo'
              : 'border-2 border-dashed border-borde'
        }`}
      >
        {estado === 'hecho' ? <Check size={18} strokeWidth={3} color={colors.blanco} /> : null}
      </View>
      <View accessible className="flex-1 gap-0.5">
        <AppText weight="medium">{titulo}</AppText>
        <AppText variant="small" tone="ink-soft">
          {texto}
        </AppText>
      </View>
      {racha}
    </Card>
  );
}
