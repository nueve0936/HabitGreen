import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert as AlertNativo, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Screen } from '@/components/ui/screen';
import { crearHabito } from '@/db/habits-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { HabitForm, HORA_POR_DEFECTO } from '@/features/habits/components/habit-form';
import { valoresNuevos } from '@/features/habits/domain/valores-formulario';
import { es, formatear } from '@/i18n/es';
import type { HabitoFormValues } from '@/schemas/habit';
import { colors } from '@/theme';

// Crear un hábito manual (SDD 6.5). Se guarda en el teléfono y se sube al sincronizar, así que
// funciona sin conexión. Si el presupuesto diario se queda corto, se avisa con suavidad y sube.

export default function NuevoHabitoScreen() {
  const t = es.habitForm;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

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
      router.back();
    } catch {
      setError(true);
      setEnviando(false);
    }
  };

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="flex-row items-center gap-4">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText variant="h2" className="flex-1">
          {t.crearTitulo}
        </AppText>
      </View>

      {ajustes.cargando && !ajustes.data ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : (
        <HabitForm
          valoresIniciales={valoresNuevos(
            ajustes.data?.estiloNotificaciones ?? null,
            HORA_POR_DEFECTO,
          )}
          editando={false}
          enviando={enviando}
          error={error}
          textoBoton={t.crear}
          onEnviar={crear}
        />
      )}
    </Screen>
  );
}
