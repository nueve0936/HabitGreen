import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
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
  EMAIL_MAX,
  recoverSchema,
  type RecoverInput,
  type RecoverValues,
} from '@/features/auth/domain/auth-schemas';
import { es } from '@/i18n/es';
import { supabase } from '@/lib/supabase';

// Primer paso de la recuperación: Supabase envía un código al correo y la siguiente pantalla lo
// pide. Se usa un código y no un enlace porque el enlace depende de que el teléfono sepa abrir la
// app desde el navegador, y eso falla en Expo Go o si el correo se abre en otro dispositivo.

export default function RecuperarScreen() {
  const t = es.auth;
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoverInput, unknown, RecoverValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: '' },
  });

  // handleSubmit espera un evento web; en React Native se llama sin argumentos.
  const onSubmit = () => void submit();
  const submit = handleSubmit(async ({ email }) => {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    // Supabase responde igual exista o no la cuenta, así que la app tampoco lo revela.
    router.push({ pathname: '/recuperar-codigo', params: { correo: email } });
  });

  return (
    <Screen scroll>
      <AuthHeader title={t.recuperar.titulo} description={t.recuperar.descripcion} />

      <View className="gap-4">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label={t.correo}
              placeholder={t.correoPlaceholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              autoCapitalize="none"
              autoComplete="email"
              maxLength={EMAIL_MAX}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={onSubmit}
            />
          )}
        />

        {serverError ? <Alert variant="error" message={serverError} /> : null}

        <Button
          label={t.recuperar.boton}
          loading={isSubmitting}
          onPress={onSubmit}
          className="mt-4"
        />
      </View>
    </Screen>
  );
}
