import { View } from 'react-native';

import { ChoicePill } from '@/components/ui/choice-pill';
import { Dialog } from '@/components/ui/dialog';
import { es, formatear } from '@/i18n/es';
import { DURACIONES } from '@/schemas/habit';

// Duración del hábito: opciones rápidas en minutos. Si el hábito tenía otra duración (por ejemplo,
// uno del plan con 2 min), también aparece para no perderla.

export type DurationDialogProps = {
  valor: number;
  onElegir: (minutos: number) => void;
  onCerrar: () => void;
};

export function DurationDialog({ valor, onElegir, onCerrar }: DurationDialogProps) {
  const t = es.habitForm;
  const opciones = [...new Set([valor, ...DURACIONES])].sort((a, b) => a - b);

  return (
    <Dialog visible titulo={t.dialogoDuracion} onCerrar={onCerrar}>
      <View className="flex-row flex-wrap justify-center gap-2" accessibilityRole="radiogroup">
        {opciones.map((minutos) => (
          <ChoicePill
            key={minutos}
            label={formatear(t.minutos, { n: minutos })}
            selected={minutos === valor}
            onPress={() => {
              onElegir(minutos);
              onCerrar();
            }}
          />
        ))}
      </View>
    </Dialog>
  );
}
