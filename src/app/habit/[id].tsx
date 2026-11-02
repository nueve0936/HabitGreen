import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert as AlertNativo, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { archivarHabito, cambiarActivo, editarHabito, leerHabito } from '@/db/habits-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { HabitForm } from '@/features/habits/components/habit-form';
import { confirmarArchivar } from '@/features/habits/confirmar-archivar';
import { valoresDeHabito } from '@/features/habits/domain/valores-formulario';
import { es, formatear } from '@/i18n/es';
import type { HabitoFormValues } from '@/schemas/habit';
import { colors } from '@/theme';

// Editar un hábito: nombre, descripción, duración y horario (versionado, SDD 4). También se
// puede pausar o eliminar (archivar). La categoría no cambia.

export default function EditarHabitoScreen() {
  const t = es.habitForm;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const consulta = useLocalQuery(`habito-${id}`, () => leerHabito(id));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  const guardar = async (valores: HabitoFormValues) => {
    setEnviando(true);
    setError(false);
    try {
      const { presupuestoNuevo } = await editarHabito(userId, id, valores);
      if (presupuestoNuevo !== null) {
        AlertNativo.alert(
          t.editarTitulo,
          formatear(es.habitos.presupuestoSubio, { n: presupuestoNuevo }),
        );
      }
      router.back();
    } catch {
      setError(true);
      setEnviando(false);
    }
  };

  const accion = async (cambio: () => Promise<void>) => {
    setError(false);
    try {
      await cambio();
      router.back();
    } catch {
      setError(true);
    }
  };

  const item = consulta.data;

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="flex-row items-center gap-4">
        <View className="-ml-4">
          <BackButton />
        </View>
        <AppText variant="h2" className="flex-1">
          {t.editarTitulo}
        </AppText>
      </View>

      {consulta.cargando && item === undefined ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : !item ? (
        <Alert variant="error" message={consulta.error ? es.comun.errorGenerico : t.noEncontrado} />
      ) : (
        <HabitForm
          key={item.habito.id}
          valoresIniciales={valoresDeHabito(item.habito, item.horario, item.categoria)}
          editando
          enviando={enviando}
          error={error}
          textoBoton={t.guardar}
          onEnviar={guardar}
          pie={
            <View className="gap-2">
              <Button
                variant="secondary"
                label={item.habito.activo ? t.pausar : t.reanudar}
                onPress={() => accion(() => cambiarActivo(id, !item.habito.activo))}
              />
              <Button
                variant="tertiary"
                label={t.eliminar}
                onPress={() => confirmarArchivar(() => void accion(() => archivarHabito(id)))}
              />
            </View>
          }
        />
      )}
    </Screen>
  );
}
