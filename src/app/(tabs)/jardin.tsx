import { router } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { ActionSquare } from '@/components/ui/action-square';
import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerJardin } from '@/db/rewards-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { CoinBalance } from '@/features/rewards/components/coin-balance';
import { PlantPanel } from '@/features/rewards/components/plant-panel';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Jardín (SDD 9.4 y mockup «Plantas #1»): las 5 plantas desde el primer día, con su fase y sus
// accesorios, sin números de nivel ni XP. Tocar una planta abre sus detalles; la bolsa, única
// acción principal de la pantalla, abre la Tienda, y el saldo junto a ella dice si alcanza para algo.
// El encabezado queda fijo y solo se desplazan las plantas.

export default function JardinScreen() {
  const t = es.jardin;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const jardin = useLocalQuery(`jardin-${userId}`, () => leerJardin(userId));
  const saldo = jardin.data?.saldo ?? 0;

  return (
    <Screen edges={['top']} contentClassName="gap-4 pt-6">
      <View className="flex-row items-center gap-3">
        <AppText variant="h1" className="flex-1">
          {es.tabs.jardin}
        </AppText>
        <CoinBalance saldo={saldo} />
        <ActionSquare label={t.tienda} icon={ShoppingBag} onPress={() => router.push('/tienda')} />
      </View>

      <ScrollView
        className="-mx-8 flex-1"
        contentContainerClassName="gap-4 px-8 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
      >
        {jardin.cargando && !jardin.data ? (
          <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
        ) : jardin.error && !jardin.data ? (
          <View className="gap-4">
            <Alert variant="error" message={t.error} />
            <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
          </View>
        ) : jardin.data?.plantas.length === 0 ? (
          <AppText tone="ink-soft" className="text-center">
            {t.vacio}
          </AppText>
        ) : jardin.data ? (
          // Márgenes de 16 dp en lugar de los 32 de la pantalla: dos columnas necesitan el ancho.
          <View className="-mx-4 flex-row flex-wrap justify-between gap-y-4">
            {jardin.data.plantas.map((planta) => (
              <View key={planta.area} className="w-[48%]">
                <PlantPanel
                  planta={planta}
                  onPress={() =>
                    router.push({
                      pathname: '/planta/[categoria]',
                      params: { categoria: planta.area },
                    })
                  }
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
