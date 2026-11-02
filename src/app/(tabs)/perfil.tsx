import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { contarDatosLocales } from '@/db/debug-repository';
import { useLocalQuery } from '@/db/use-local-query';
import { useSession } from '@/features/auth/session-context';
import { es, formatear } from '@/i18n/es';
import { sincronizarAhora } from '@/sync/sync-engine';
import { useSyncStore } from '@/sync/sync-store';
import { colors } from '@/theme';

// Perfil mínimo: quién inició sesión, el modo y cerrar sesión. El panel «Datos en este teléfono»
// es temporal, para probar la sincronización de la Entrega 3.

export default function PerfilScreen() {
  const t = es.perfil;
  const { session, profile, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const local = useLocalQuery('perfil-datos-locales', contarDatosLocales);
  const sync = useSyncStore();

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <Screen edges={['top']} scroll contentClassName="gap-6 pt-6">
      <AppText variant="h1">{es.tabs.perfil}</AppText>

      <Card className="gap-1">
        <AppText variant="small">{t.sesionIniciada}</AppText>
        <AppText variant="body" weight="semibold">
          {session?.user.email ?? ''}
        </AppText>
        {profile?.modo ? (
          <AppText variant="small" className="mt-2">
            {profile.modo === 'guiado' ? t.modoGuiado : t.modoTradicional}
          </AppText>
        ) : null}
      </Card>

      <Card className="gap-1">
        <AppText variant="body" weight="semibold">
          {t.datosLocales.titulo}
        </AppText>
        {local.data ? (
          <>
            <AppText variant="small">
              {formatear(t.datosLocales.habitos, { n: local.data.habitos })}
            </AppText>
            <AppText variant="small">
              {formatear(t.datosLocales.horarios, { n: local.data.horarios })}
            </AppText>
            <AppText variant="small">
              {formatear(t.datosLocales.registros, { n: local.data.registros })}
            </AppText>
            <AppText variant="small">
              {formatear(t.datosLocales.pendientes, { n: local.data.pendientes })}
            </AppText>
          </>
        ) : null}
        <AppText variant="small" className="mt-2">
          {sync.sincronizando
            ? t.datosLocales.sincronizando
            : sync.ultima
              ? formatear(t.datosLocales.ultima, {
                  hora: new Date(sync.ultima).toLocaleTimeString(),
                })
              : t.datosLocales.nunca}
        </AppText>
        {sync.error ? (
          <AppText variant="small">
            {formatear(t.datosLocales.error, { mensaje: sync.error })}
          </AppText>
        ) : null}
        <Button
          variant="tertiary"
          label={t.datosLocales.sincronizar}
          onPress={() => void sincronizarAhora()}
        />
      </Card>

      <View className="mt-auto">
        <Button
          variant="secondary"
          label={t.cerrarSesion}
          loading={signingOut}
          onPress={onSignOut}
          icon={<LogOut size={20} color={colors.ink} />}
        />
      </View>
    </Screen>
  );
}
