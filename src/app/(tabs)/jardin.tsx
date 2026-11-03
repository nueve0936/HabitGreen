import { router } from 'expo-router';
import { Coins } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { avisarCambioLocal } from '@/db/db-version-store';
import { leerJardin } from '@/db/rewards-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { PlantPanel } from '@/features/rewards/components/plant-panel';
import { es, formatear } from '@/i18n/es';
import { colors } from '@/theme';

// Jardín (SDD 9.4): las 5 plantas desde el primer día, con su fase y sus accesorios, sin números
// de nivel ni XP. Tocar una planta abre su pantalla para ponerle o quitarle accesorios.

export default function JardinScreen() {
  const t = es.jardin;
  const { session } = useSession();
  const userId = session?.user.id ?? '';
  const jardin = useLocalQuery(`jardin-${userId}`, () => leerJardin(userId));
  const saldo = jardin.data?.saldo ?? 0;

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <View className="flex-row items-center justify-between">
        <AppText variant="h1">{es.tabs.jardin}</AppText>
        <View
          accessible
          accessibilityLabel={formatear(es.hoy.monedas, { n: saldo })}
          className="min-h-11 flex-row items-center gap-1"
        >
          <Coins size={22} color={colors['accent-oscuro']} />
          <AppText weight="bold">{saldo}</AppText>
        </View>
      </View>

      {jardin.cargando && !jardin.data ? (
        <ActivityIndicator color={colors.ink} accessibilityLabel={es.comun.cargando} />
      ) : jardin.error && !jardin.data ? (
        <View className="gap-4">
          <Alert variant="error" message={t.error} />
          <Button variant="secondary" label={es.comun.reintentar} onPress={avisarCambioLocal} />
        </View>
      ) : jardin.data ? (
        <>
          <View className="flex-row flex-wrap justify-between gap-y-6">
            {jardin.data.plantas.map((planta) => (
              <View key={planta.area} className="w-[47%]">
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
          <Button label={t.tienda} onPress={() => router.push('/tienda')} />
        </>
      ) : null}
    </Screen>
  );
}
