import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Screen } from '@/components/ui/screen';
import { respuestasCompletas } from '@/features/onboarding/domain/form-rules';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { es } from '@/i18n/es';

// Provisional (Entrega 2, primera parte): confirma que las respuestas están completas. En la
// siguiente parte aquí se llama a generate-plan y se muestra la revisión del plan.

export default function PlanScreen() {
  const t = es.onboarding.plan;
  const borrador = useOnboardingStore((s) => s.borrador);
  const respuestas = respuestasCompletas(borrador);

  if (respuestas === null) {
    return <Redirect href={{ pathname: '/formulario/[paso]', params: { paso: '1' } }} />;
  }

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>
      <AppText variant="h2" accessibilityRole="header" className="text-center">
        {t.titulo}
      </AppText>
      <Alert variant="info" message={t.proximamente} />
    </Screen>
  );
}
