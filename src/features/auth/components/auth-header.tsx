import { router } from 'expo-router';
import { Sprout } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { colors } from '@/theme';

// Encabezado de las pantallas de cuenta (mockups Login y Registrar): botón de regresar,
// logotipo (provisional hasta tener el definitivo) y título.

export type AuthHeaderProps = {
  title: string;
  description?: string;
};

export function AuthHeader({ title, description }: AuthHeaderProps) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/bienvenida'));

  return (
    <View className="mb-8 gap-4 pt-2">
      <View className="-ml-4">
        <BackButton onPress={goBack} />
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        className="h-20 w-20 items-center justify-center self-center rounded-card border-2 border-ink bg-bg-claro"
      >
        <Sprout size={44} color={colors.ink} />
      </View>
      <AppText variant="h2" weight="semibold" className="text-center">
        {title}
      </AppText>
      {description ? (
        <AppText variant="body" className="text-center">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
