import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { OptionChip } from '@/components/ui/option-chip';
import { Screen } from '@/components/ui/screen';
import type { AppMode } from '@/db/profile-repository';
import { guardarAjustesTradicionales } from '@/db/settings-repository';
import { useSession } from '@/features/auth/session-context';
import { useOnboardingStore } from '@/features/onboarding/onboarding-store';
import { es } from '@/i18n/es';

// Elección de modo (SDD 9.4). El modo tradicional se guarda aquí, con sus ajustes por defecto, y
// el layout raíz lleva a las pestañas. El guiado pasa primero por el formulario; su modo se guarda
// al confirmar el plan.

export default function ModoScreen() {
  const t = es.onboarding.modo;
  const { chooseMode, session } = useSession();
  const prepararFormulario = useOnboardingStore((s) => s.prepararPara);
  const [mode, setMode] = useState<AppMode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const onContinue = async () => {
    if (mode === null) return;
    if (mode === 'guiado') {
      // Si hay respuestas guardadas de esta misma cuenta, se conservan para retomarlas.
      if (session) prepararFormulario(session.user.id);
      router.push({ pathname: '/formulario/[paso]', params: { paso: '1' } });
      return;
    }
    if (session === null) return;
    setSaving(true);
    setError(false);
    try {
      // Primero los ajustes por defecto (SDD 6.5); el modo se guarda al final porque cambia de zona.
      await guardarAjustesTradicionales(session.user.id);
      await chooseMode(mode);
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <Screen scroll contentClassName="gap-6 pt-2">
      <View className="-ml-4">
        <BackButton />
      </View>

      <View className="gap-2">
        <AppText variant="h2" className="text-center">
          {t.titulo}
        </AppText>
        <AppText variant="small" tone="ink-soft" className="text-center">
          {t.ayuda}
        </AppText>
      </View>

      <View accessibilityRole="radiogroup" className="gap-4">
        <OptionChip
          label={t.guiadoTitulo}
          description={t.guiadoDescripcion}
          selected={mode === 'guiado'}
          onPress={() => setMode('guiado')}
        />
        <OptionChip
          label={t.tradicionalTitulo}
          description={t.tradicionalDescripcion}
          selected={mode === 'tradicional'}
          onPress={() => setMode('tradicional')}
        />
      </View>

      {error ? <Alert variant="error" message={t.error} /> : null}

      <Button
        label={t.boton}
        disabled={mode === null}
        loading={saving}
        onPress={onContinue}
        className="mt-auto"
      />
    </Screen>
  );
}
