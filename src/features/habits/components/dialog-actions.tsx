import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { es } from '@/i18n/es';

// «Cancelar» y «Aceptar» de los diálogos de ruedas (duración y tiempo diario). «Aceptar» se apaga
// con un valor no válido y no se puede tocar.

export type DialogActionsProps = {
  valido: boolean;
  onCancelar: () => void;
  onAceptar: () => void;
};

export function DialogActions({ valido, onCancelar, onAceptar }: DialogActionsProps) {
  const t = es.habitForm.dialogoDuracion;
  return (
    <View className="flex-row gap-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.cancelar}
        onPress={onCancelar}
        className="h-12 flex-1 items-center justify-center rounded-field border-2 border-borde bg-campo active:bg-accent-claro"
      >
        <AppText weight="bold">{t.cancelar}</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.aceptar}
        accessibilityState={{ disabled: !valido }}
        disabled={!valido}
        onPress={onAceptar}
        className={`h-12 flex-1 items-center justify-center rounded-field ${
          valido ? 'bg-accent active:bg-accent-oscuro' : 'bg-divisor'
        }`}
      >
        <AppText weight="bold" tone={valido ? 'blanco' : 'ink-soft'}>
          {t.aceptar}
        </AppText>
      </Pressable>
    </View>
  );
}
