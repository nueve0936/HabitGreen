import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert as AlertNativo, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { crearHabito } from '@/db/habits-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { HabitWizard } from '@/features/habits/components/habit-wizard';
import { valoresNuevos } from '@/features/habits/domain/valores-formulario';
import { es, formatear } from '@/i18n/es';
import { fechaLocal } from '@/lib/dates';
import type { HabitoFormValues } from '@/schemas/habit';
import { colors } from '@/theme';

// Crear un hábito manual (SDD 6.5, mockups «Crear hábito #1–#3»). Se guarda en el teléfono y se
// sube al sincronizar, así que funciona sin conexión. Al terminar se vuelve a la pestaña Hábitos;
// si el tiempo diario se queda corto, se avisa con suavidad y sube.

export default function NuevoHabitoScreen() {
  const t = es.habitForm;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);
  const hoy = fechaLocal();

  const crear = async (valores: HabitoFormValues) => {
    setEnviando(true);
    setError(false);
    try {
      const { presupuestoNuevo } = await crearHabito(userId, valores);
      if (presupuestoNuevo !== null) {
        AlertNativo.alert(
          t.crearTitulo,
          formatear(es.habitos.presupuestoSubio, { n: presupuestoNuevo }),
        );
      }
      // Vuelve a la pestaña Hábitos aunque se haya llegado desde Hoy.
      router.dismissAll();
      router.navigate('/habitos');
    } catch {
      setError(true);
      setEnviando(false);
    }
  };

  if (ajustes.cargando && !ajustes.data) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        </View>
      </Screen>
    );
  }

  return (
    <HabitWizard
      titulo={t.crearTitulo}
      textoFinal={t.crear}
      valoresIniciales={valoresNuevos(ajustes.data?.estiloNotificaciones ?? null, hoy)}
      editando={false}
      hoy={hoy}
      inicioEditable
      enviando={enviando}
      error={error}
      onEnviar={crear}
      onCerrar={() => router.back()}
    />
  );
}
