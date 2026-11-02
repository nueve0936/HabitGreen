import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import {
  loginSchema,
  type LoginInput,
  type LoginValues,
} from '@/features/auth/domain/auth-schemas';
import { es } from '@/i18n/es';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const t = es.auth;
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // handleSubmit espera un evento web; en React Native se llama sin argumentos.
  const onSubmit = () => void submit();
  const submit = handleSubmit(async ({ email, password }) => {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Si todo sale bien, la sesión cambia y el layout raíz lleva a la pantalla que toca.
    if (error) setServerError(authErrorMessage(error));
  });

  return (
    <Screen scroll>
      <AuthHeader title={t.login.titulo} />

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
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          )}
        />
        <View className="gap-1">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Field
                label={t.contrasena}
                password
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />
            )}
          />
          <View className="items-start">
            <Button
              variant="tertiary"
              label={t.login.olvidaste}
              onPress={() => router.push('/recuperar')}
              className="px-0"
            />
          </View>
        </View>

        {serverError ? <Alert variant="error" message={serverError} /> : null}

        <Button label={t.login.boton} loading={isSubmitting} onPress={onSubmit} className="mt-4" />

        <View className="flex-row flex-wrap items-center justify-center">
          <AppText variant="body">{t.login.noTienesCuenta}</AppText>
          <Button
            variant="tertiary"
            label={t.login.registrate}
            onPress={() => router.replace('/registro')}
          />
        </View>
      </View>
    </Screen>
  );
}
