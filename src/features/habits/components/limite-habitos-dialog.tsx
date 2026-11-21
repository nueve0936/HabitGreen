import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Dialog } from '@/components/ui/dialog';
import { es, formatear } from '@/i18n/es';

// Aviso con el límite de hábitos alcanzado (usuario guiado; cuenta los del plan y los propios), al
// tocar «+» o al reanudar un hábito en pausa. Solo explica: no se crea ni se reanuda nada. Tocar fuera, «atrás» o «Entendido» lo cierran.

export type LimiteHabitosDialogProps = {
  /** Límite alcanzado; null oculta el diálogo. */
  limite: number | null;
  /** Crear con «+» o reanudar un hábito en pausa: solo cambia el texto. */
  motivo: 'crear' | 'reanudar';
  onCerrar: () => void;
};

export function LimiteHabitosDialog({ limite, motivo, onCerrar }: LimiteHabitosDialogProps) {
  const t = es.habitForm.limiteHabitos;
  const reanudar = motivo === 'reanudar';
  return (
    <Dialog
      visible={limite !== null}
      titulo={formatear(reanudar ? t.tituloReanudar : t.titulo, { n: String(limite ?? 0) })}
      onCerrar={onCerrar}
    >
      <AppText tone="ink-soft" className="text-center">
        {reanudar ? t.mensajeReanudar : t.mensaje}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.entendido}
        onPress={onCerrar}
        className="mt-2 h-12 items-center justify-center rounded-field bg-confirmar active:opacity-80"
      >
        <AppText weight="bold" tone="blanco">
          {t.entendido}
        </AppText>
      </Pressable>
    </Dialog>
  );
}
