import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/auth/session-context';
import { useAppZone, ZONE_HOME } from '@/features/auth/use-app-zone';
import { es } from '@/i18n/es';
import { colors } from '@/theme';
import { navegar } from '@/lib/navegar';

// Aquí llegan los enlaces de los correos (habitgreen://auth-callback). SessionProvider procesa
// los tokens; esta pantalla espera a que termine y lleva al usuario a donde corresponde.

// Si el enlace no traía datos de sesión, no hay nada que esperar.
const MAX_WAIT_MS = 4000;

export default function AuthCallbackScreen() {
  const t = es.auth.callback;
  const { callbackStatus } = useSession();
  const zone = useAppZone();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const done = callbackStatus === 'done' || (callbackStatus === 'none' && timedOut);

  useEffect(() => {
    if (!done || zone === 'loading' || zone === 'profile-error') return;
    navegar.replace(ZONE_HOME[zone]);
  }, [done, zone]);

  if (callbackStatus === 'error') {
    return (
      <Screen contentClassName="justify-center gap-6">
        <Alert variant="error" message={t.error} />
        <Button
          label={t.irAlInicio}
          onPress={() =>
            navegar.replace(zone === 'loading' || zone === 'profile-error' ? '/' : ZONE_HOME[zone])
          }
        />
      </Screen>
    );
  }

  return (
    <Screen contentClassName="items-center justify-center">
      <View className="items-center gap-4" accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.ink} />
        <AppText variant="body">{t.procesando}</AppText>
      </View>
    </Screen>
  );
}
