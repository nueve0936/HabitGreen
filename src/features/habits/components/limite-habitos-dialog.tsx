import { useState } from 'react';
import { Pressable } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Dialog } from '@/components/ui/dialog';
import { es, formatear } from '@/i18n/es';

// Aviso de límite alcanzado (cupo total de hábitos): al tocar «+», al reanudar un hábito en pausa o
// al crear un plan sin lugar libre. Solo explica: no se crea ni se reanuda nada.
// Tocar fuera, «atrás» o «Entendido» lo cierran.

export type MotivoLimite = 'crear' | 'reanudar' | 'reanudarPlan' | 'plan';

export type AvisoLimite = { motivo: MotivoLimite; limite: number };

export type LimiteHabitosDialogProps = {
  /** Límite alcanzado y su motivo (solo cambia el texto); null oculta el diálogo. */
  aviso: AvisoLimite | null;
  onCerrar: () => void;
};

function titulo({ motivo, limite }: AvisoLimite): string {
  const t = es.habitForm.limiteHabitos;
  const n = { n: String(limite) };
  return formatear(t[motivo].titulo, n);
}

export function LimiteHabitosDialog({ aviso, onCerrar }: LimiteHabitosDialogProps) {
  const t = es.habitForm.limiteHabitos;
  // Mientras se desvanece al cerrar, sigue mostrando el último aviso (no una tarjeta vacía).
  const [ultimo, setUltimo] = useState(aviso);
  if (aviso !== null && aviso !== ultimo) setUltimo(aviso);
  const visto = aviso ?? ultimo;
  return (
    <Dialog visible={aviso !== null} titulo={visto ? titulo(visto) : ''} onCerrar={onCerrar}>
      <AppText tone="ink-soft" className="text-center">
        {visto ? formatear(t[visto.motivo].mensaje, { n: String(visto.limite) }) : ''}
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
