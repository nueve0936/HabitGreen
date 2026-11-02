import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/auth/session-context';
import { es } from '@/i18n/es';
import { colors } from '@/theme';

// Perfil mínimo: quién inició sesión, el modo y cerrar sesión. Ajustes de notificaciones y
// presupuesto llegan con sus entregas.

export default function PerfilScreen() {
  const t = es.perfil;
  const { session, profile, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);

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
