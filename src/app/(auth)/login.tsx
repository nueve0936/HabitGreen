import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { Alert } from '@/components/ui/alert';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { SessionExpiredNotice } from '@/features/auth/components/session-expired-notice';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import { avisoDeFormulario } from '@/features/auth/domain/form-aviso';
import {
  EMAIL_MAX,
  loginSchema,
  type LoginInput,
  type LoginValues,
  PASSWORD_MAX,
} from '@/features/auth/domain/auth-schemas';
import { es } from '@/i18n/es';
import { supabase } from '@/lib/supabase';
import { navegar } from '@/lib/navegar';

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

  // Un solo aviso bajo los campos (mockups «Login #1.x»): campos vacíos, datos inválidos,
  // credenciales incorrectas o sin conexión. Con error del servidor se marcan los dos campos.
  const aviso =
    serverError ??
    avisoDeFormulario(
      [errors.email?.message, errors.password?.message],
      [t.validacion.correoRequerido, t.validacion.contrasenaRequerida],
      t.validacion.loginVacios,
    );
  const errorServidor = serverError !== null;

  // Al corregir un campo, el error del servidor deja de aplicar.
  const escribir = (onChange: (texto: string) => void, texto: string) => {
    setServerError(null);
    onChange(texto);
  };

  // handleSubmit espera un evento web; en React Native se llama sin argumentos.
  const onSubmit = () => void submit();
  const submit = handleSubmit(async ({ email, password }) => {
    // El aviso anterior se queda mientras se espera la respuesta: quitarlo y volver a ponerlo
    // movía el botón y se veía como un parpadeo.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // Si todo sale bien, la sesión cambia y el layout raíz lleva a la pantalla que toca.
    setServerError(error ? authErrorMessage(error) : null);
  });

  return (
    <Screen scroll>
      <AuthHeader title={t.login.titulo} />

      <View className="gap-4">
        <SessionExpiredNotice />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label={t.correo}
              placeholder={t.correoPlaceholder}
              value={value}
              onChangeText={(texto) => escribir(onChange, texto)}
              onBlur={onBlur}
              invalido={Boolean(errors.email) || errorServidor}
              autoCapitalize="none"
              autoComplete="email"
              maxLength={EMAIL_MAX}
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
                maxLength={PASSWORD_MAX}
                value={value}
                onChangeText={(texto) => escribir(onChange, texto)}
                onBlur={onBlur}
                invalido={Boolean(errors.password) || errorServidor}
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
              onPress={() => navegar.push('/recuperar')}
              className="px-0"
            />
          </View>
        </View>

        {aviso ? <Alert variant="error" message={aviso} /> : null}

        <Button label={t.login.boton} loading={isSubmitting} onPress={onSubmit} className="mt-4" />

        <View className="flex-row flex-wrap items-center justify-center">
          <AppText variant="body">{t.login.noTienesCuenta}</AppText>
          <Button
            variant="tertiary"
            label={t.login.registrate}
            onPress={() => navegar.replace('/registro')}
          />
        </View>
      </View>
    </Screen>
  );
}
