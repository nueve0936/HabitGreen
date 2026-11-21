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
import { authRedirectUrl } from '@/features/auth/auth-redirect';
import { authErrorMessage } from '@/features/auth/domain/auth-error-message';
import { avisoDeFormulario } from '@/features/auth/domain/form-aviso';
import {
  EMAIL_MAX,
  registerSchema,
  type RegisterInput,
  type RegisterValues,
} from '@/features/auth/domain/auth-schemas';
import { es } from '@/i18n/es';
import { supabase } from '@/lib/supabase';

export default function RegistroScreen() {
  const t = es.auth;
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  // Un solo aviso bajo los campos (mockups «Registrar #1.x»): campos vacíos, contraseñas distintas,
  // datos inválidos o sin conexión. Tras intentar crear la cuenta, cada campo muestra una X o una
  // marca de verificación; con error del servidor se marcan todos.
  const v = t.validacion;
  const aviso =
    serverError ??
    avisoDeFormulario(
      [errors.email?.message, errors.password?.message, errors.confirmPassword?.message],
      [v.correoRequerido, v.contrasenaRequerida],
      v.registroVacios,
    );
  const errorServidor = serverError !== null;
  const estado = (error: unknown) => ({
    invalido: Boolean(error) || errorServidor,
    valido: isSubmitted && !error && !errorServidor,
  });

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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) {
      setServerError(authErrorMessage(error));
      return;
    }
    // Con la confirmación de correo activa, Supabase no abre sesión hasta confirmar.
    // Si el correo ya existía, devuelve un usuario sin identidades (sin revelar si existe).
    if (data.user && data.user.identities?.length === 0) {
      setServerError(t.errores.usuarioExiste);
      return;
    }
    setServerError(null);
    if (!data.session) {
      router.replace({ pathname: '/revisa-tu-correo', params: { correo: email } });
    }
  });

  return (
    <Screen scroll>
      <AuthHeader title={t.registro.titulo} />

      <View className="gap-4">
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
              {...estado(errors.email)}
              autoCapitalize="none"
              autoComplete="email"
              maxLength={EMAIL_MAX}
              keyboardType="email-address"
              textContentType="emailAddress"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label={t.contrasena}
              password
              value={value}
              onChangeText={(texto) => escribir(onChange, texto)}
              onBlur={onBlur}
              {...estado(errors.password)}
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Field
              label={t.confirmarContrasena}
              password
              value={value}
              onChangeText={(texto) => escribir(onChange, texto)}
              onBlur={onBlur}
              {...estado(errors.confirmPassword)}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
          )}
        />

        {aviso ? <Alert variant="error" message={aviso} /> : null}

        <Button
          label={t.registro.boton}
          loading={isSubmitting}
          onPress={onSubmit}
          className="mt-4"
        />

        <View className="flex-row flex-wrap items-center justify-center">
          <AppText variant="body">{t.registro.yaTienesCuenta}</AppText>
          <Button
            variant="tertiary"
            label={t.registro.iniciaSesion}
            onPress={() => router.replace('/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
