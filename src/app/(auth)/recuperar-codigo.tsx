import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import {
  recoveryCodeSchema,
  type RecoveryCodeInput,
  type RecoveryCodeValues,
} from '@/features/auth/domain/auth-schemas';
import { es, formatear } from '@/i18n/es';
import { supabase } from '@/lib/supabase';

// Segundo paso de la recuperación: el usuario escribe el código del correo. Si es correcto,
// Supabase abre una sesión y avisa con el evento PASSWORD_RECOVERY; SessionProvider lo escucha y
// la app pasa sola a «Crea una nueva contraseña».

type Feedback = { variant: 'exito' | 'error'; message: string } | null;

export default function RecuperarCodigoScreen() {
  const t = es.auth.recuperarCodigo;
  const { correo = '' } = useLocalSearchParams<{ correo?: string }>();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [resending, setResending] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryCodeInput, unknown, RecoveryCodeValues>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { code: '' },
  });

  // handleSubmit espera un evento web; en React Native se llama sin argumentos.
  const onSubmit = () => void submit();
  const submit = handleSubmit(async ({ code }) => {
    setFeedback(null);
    const { error } = await supabase.auth.verifyOtp({
      email: correo,
      token: code,
      type: 'recovery',
    });
    if (error) {
      // Supabase responde otp_expired tanto si el código está mal como si ya venció.
      const message = error.code === 'otp_expired' ? t.invalido : authErrorMessage(error);
      setFeedback({ variant: 'error', message });
    }
  });

  const resend = async () => {
    setResending(true);
    setFeedback(null);
    const { error } = await supabase.auth.resetPasswordForEmail(correo);
    setResending(false);
    setFeedback(
      error
        ? { variant: 'error', message: authErrorMessage(error) }
        : { variant: 'exito', message: t.reenviado },
    );
  };

  return (
    <Screen scroll>
      <AuthHeader title={t.titulo} description={formatear(t.descripcion, { correo })} />

      <View className="gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label={t.codigo}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.code?.message}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={12}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          )}
        />

        {feedback ? <Alert variant={feedback.variant} message={feedback.message} /> : null}

        <View className="mt-4 gap-2">
          <Button label={t.boton} loading={isSubmitting} onPress={onSubmit} />
          <Button
            variant="secondary"
            label={t.reenviar}
            loading={resending}
            disabled={isSubmitting}
            onPress={resend}
          />
        </View>
      </View>
    </Screen>
  );
}
