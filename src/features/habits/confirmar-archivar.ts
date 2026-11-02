import { Alert } from 'react-native';

import { es } from '@/i18n/es';

// Confirmación de «Eliminar» (que en realidad archiva, definición 6). Se usa desde el menú de la
// lista y desde la edición del hábito.

export function confirmarArchivar(onConfirmar: () => void): void {
  const t = es.habitos.eliminar;
  Alert.alert(t.titulo, t.mensaje, [
    { text: t.cancelar, style: 'cancel' },
    { text: t.confirmar, style: 'destructive', onPress: onConfirmar },
  ]);
}
