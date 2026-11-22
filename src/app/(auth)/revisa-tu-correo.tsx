import { useLocalSearchParams } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { authRedirectUrl } from '@/features/auth/auth-redirect';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import { es, formatear } from '@/i18n/es';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';
import { navegar } from '@/lib/navegar';

// Después de registrarse: pide abrir el enlace del correo. Al abrirlo, la app inicia sesión
// sola (auth-callback) y lleva a la bienvenida.

type Feedback = { variant: 'exito' | 'error'; message: string } | null;

export default function RevisaTuCorreoScreen() {
  const t = es.auth.revisaCorreo;
  const { correo } = useLocalSearchParams<{ correo?: string }>();
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const resend = async () => {
    if (!correo) return;
    setSending(true);
    setFeedback(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: correo,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    setSending(false);
    setFeedback(
      error
        ? { variant: 'error', message: authErrorMessage(error) }
        : { variant: 'exito', message: t.reenviado },
    );
  };

  return (
    <Screen contentClassName="justify-center gap-6">
      <View className="items-center gap-4">
        <View
          importantForAccessibility="no-hide-descendants"
          className="h-24 w-24 items-center justify-center rounded-chip bg-accent-claro"
        >
          <MailCheck size={48} color={colors.ink} />
        </View>
        <AppText variant="h2" className="text-center">
          {t.titulo}
        </AppText>
        <AppText variant="body" className="text-center">
          {formatear(t.descripcion, { correo: correo ?? '' })}
        </AppText>
      </View>

      {feedback ? <Alert variant={feedback.variant} message={feedback.message} /> : null}

      <View className="gap-2">
        <Button label={t.irALogin} onPress={() => navegar.replace('/login')} />
        <Button variant="secondary" label={t.reenviar} loading={sending} onPress={resend} />
      </View>
    </Screen>
  );
}
