import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerHoy } from '@/db/habits-repository';
import { completarHabito, deshacerHabito } from '@/db/logs-repository';
import { leerAjustesLocales } from '@/db/settings-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { TodayHabitCard } from '@/features/habits/components/today-habit-card';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Hoy (SDD 9.4 y mockup «Inicio»): saludo, monedas y los hábitos de hoy con su check. Todo sale
// de SQLite, así que funciona sin conexión; la sincronización sube los cambios después.

export default function HoyScreen() {
  const t = es.hoy;
  const { session, profile } = useSession();
  const userId = session?.user.id ?? '';
  const hoy = useLocalQuery('hoy', leerHoy);
  const ajustes = useLocalQuery(`ajustes-${userId}`, () => leerAjustesLocales(userId));
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState(false);

  const cambiar = async (habitId: string, accion: () => Promise<void>) => {
    setOcupado(habitId);
    setErrorGuardar(false);
    try {
      await accion();
    } catch {
      setErrorGuardar(true);
    } finally {
      setOcupado(null);
    }
  };

  const saldo = ajustes.data?.saldo ?? 0;

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <AppText variant="h3" className="flex-1">
          {profile?.nombre ? formatear(t.saludo, { nombre: profile.nombre }) : t.saludoSinNombre}
        </AppText>
        <View
          accessible
          accessibilityLabel={formatear(t.monedas, { n: saldo })}
          className="min-h-11 flex-row items-center gap-1"
        >
          <Coins size={22} color={colors['accent-oscuro']} />
          <AppText weight="bold">{saldo}</AppText>
        </View>
      </View>

      {hoy.cargando && !hoy.data ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        </View>
      ) : hoy.error && !hoy.data ? (
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      ) : hoy.data && !hoy.data.tieneHabitos ? (
        <View className="flex-1 justify-center gap-4 py-8">
          <AppText variant="h2" className="text-center">
            {t.sinHabitos.titulo}
          </AppText>
          <AppText tone="ink-soft" className="text-center">
            {t.sinHabitos.descripcion}
          </AppText>
          <Button
            label={t.sinHabitos.crear}
            onPress={() => router.push('/habit/nuevo')}
            className="mt-2"
          />
        </View>
      ) : hoy.data ? (
        <>
          <AppText tone="ink-soft" className="text-center">
            {t.frase}
          </AppText>
          <View className="gap-4">
            <AppText variant="h3">{t.pendientes}</AppText>
            {errorGuardar ? <Alert variant="error" message={t.errorGuardar} /> : null}
            {hoy.data.items.length === 0 ? (
              <AppText tone="ink-soft">{t.vacio}</AppText>
            ) : (
              hoy.data.items.map((item) => (
                <TodayHabitCard
                  key={item.habito.id}
                  item={item}
                  ocupado={ocupado === item.habito.id}
                  onCompletar={() =>
                    cambiar(item.habito.id, () =>
                      completarHabito(userId, item.habito, hoy.data?.fecha ?? ''),
                    )
                  }
                  onDeshacer={() =>
                    cambiar(item.habito.id, () =>
                      deshacerHabito(item.habito.id, hoy.data?.fecha ?? ''),
                    )
                  }
                />
              ))
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
