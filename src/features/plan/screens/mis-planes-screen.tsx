import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Screen } from '@/components/ui/screen';
import { useSession } from '@/features/auth/session-context';
import { es } from '@/i18n/es';

import { MisPlanes } from '../components/mis-planes';

// «Mis planes» (Perfil → Mis planes; decisión del usuario, Perfil como índice): la lista de planes
// con su detalle y «Crear plan», en su propia pantalla para que Perfil quede corto.

export default function MisPlanesScreen() {
  const { session } = useSession();
  return (
    <Screen scroll contentClassName="gap-6 pt-2 pb-8">
      <View className="-ml-4">
        <BackButton />
      </View>
      <AppText variant="h2" accessibilityRole="header">
        {es.perfil.planes.titulo}
      </AppText>
      <MisPlanes userId={session?.user.id ?? ''} />
    </Screen>
  );
}
